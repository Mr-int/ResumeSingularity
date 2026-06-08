import { Client } from '@stomp/stompjs';
import SockJS from 'sockjs-client';

/** @type {Client | null} */
let client = null;
let connected = false;
/** @type {Map<string, { sub: import('@stomp/stompjs').StompSubscription, handlers: Set<Function> }>} */
const topicSubscriptions = new Map();

export function getChatWebSocketUrl() {
    const viteApi = import.meta.env.VITE_API_URL;
    if (viteApi) {
        const raw = String(viteApi).replace(/\/$/, '');
        try {
            return `${new URL(raw).origin}/ws`;
        } catch {
            return `${raw}/ws`;
        }
    }
    return `${window.location.origin}/ws`;
}

export function isChatWebSocketConnected() {
    return connected && client?.connected === true;
}

/**
 * @param {(online: boolean) => void} [onConnectionChange]
 */
export function ensureChatWebSocket(onConnectionChange) {
    if (client) {
        return client;
    }

    client = new Client({
        webSocketFactory: () => new SockJS(getChatWebSocketUrl()),
        reconnectDelay: 5000,
        heartbeatIncoming: 10000,
        heartbeatOutgoing: 10000,
        onConnect: () => {
            connected = true;
            onConnectionChange?.(true);
            for (const [topic, entry] of topicSubscriptions.entries()) {
                if (!entry.sub) {
                    entry.sub = client.subscribe(topic, (frame) => {
                        let payload;
                        try {
                            payload = JSON.parse(frame.body);
                        } catch {
                            return;
                        }
                        for (const handler of entry.handlers) {
                            handler(payload);
                        }
                    });
                }
            }
        },
        onDisconnect: () => {
            connected = false;
            for (const entry of topicSubscriptions.values()) {
                entry.sub = null;
            }
            onConnectionChange?.(false);
        },
        onStompError: () => {
            connected = false;
            onConnectionChange?.(false);
        },
        onWebSocketClose: () => {
            connected = false;
            for (const entry of topicSubscriptions.values()) {
                entry.sub = null;
            }
            onConnectionChange?.(false);
        },
    });

    client.activate();
    return client;
}

/**
 * @param {string} chatId
 * @param {(message: object) => void} handler
 * @returns {() => void} unsubscribe
 */
export function subscribeChatTopic(chatId, handler) {
    if (!chatId) return () => {};

    const topic = `/topic/chats/${chatId}`;
    let entry = topicSubscriptions.get(topic);
    if (!entry) {
        entry = { sub: null, handlers: new Set() };
        topicSubscriptions.set(topic, entry);
    }
    entry.handlers.add(handler);

    ensureChatWebSocket();

    if (client?.connected && !entry.sub) {
        entry.sub = client.subscribe(topic, (frame) => {
            let payload;
            try {
                payload = JSON.parse(frame.body);
            } catch {
                return;
            }
            for (const fn of entry.handlers) {
                fn(payload);
            }
        });
    }

    return () => {
        const current = topicSubscriptions.get(topic);
        if (!current) return;
        current.handlers.delete(handler);
        if (current.handlers.size === 0) {
            current.sub?.unsubscribe();
            topicSubscriptions.delete(topic);
        }
    };
}

export function disconnectChatWebSocket() {
    for (const entry of topicSubscriptions.values()) {
        entry.sub?.unsubscribe();
    }
    topicSubscriptions.clear();
    if (client) {
        client.deactivate();
        client = null;
    }
    connected = false;
}
