/**
 * Мок-данные под будущие GET /chat и GET /chat/{chatId}/messages (PageResponse / DTO).
 * TODO: удалить после подключения реального API.
 */

export const MOCK_CHAT_SUMMARIES = [
    {
        chatId: 'mock-chat-001',
        peerName: 'Анна Смирнова',
        lastMessagePreview: 'Договорились: созвон завтра в 15:00',
        unreadCount: 2,
        updatedAt: '2026-05-12T14:30:00.000Z',
    },
    {
        chatId: 'mock-chat-002',
        peerName: 'HR · Singularity',
        lastMessagePreview: 'Спасибо за заявку! Мы передали профиль куратору.',
        unreadCount: 0,
        updatedAt: '2026-05-11T09:15:00.000Z',
    },
    {
        chatId: 'mock-chat-003',
        peerName: 'Дмитрий Орлов',
        lastMessagePreview: 'Можете прислать ссылку на портфолио?',
        unreadCount: 1,
        updatedAt: '2026-05-10T18:45:00.000Z',
    },
];

export const MOCK_MESSAGES_BY_CHAT_ID = {
    'mock-chat-001': [
        {
            messageId: 'mock-msg-001-1',
            body: 'Здравствуйте! Заинтересованы в сотрудничестве по стажировке.',
            sentAt: '2026-05-10T11:00:00.000Z',
            outgoing: true,
        },
        {
            messageId: 'mock-msg-001-2',
            body: 'Добрый день! Да, готова обсудить детали.',
            sentAt: '2026-05-10T11:12:00.000Z',
            outgoing: false,
        },
        {
            messageId: 'mock-msg-001-3',
            body: 'Договорились: созвон завтра в 15:00',
            sentAt: '2026-05-12T14:30:00.000Z',
            outgoing: false,
        },
    ],
    'mock-chat-002': [
        {
            messageId: 'mock-msg-002-1',
            body: 'Заявка получена, ожидайте ответа в течение 24 часов.',
            sentAt: '2026-05-11T09:15:00.000Z',
            outgoing: false,
        },
        {
            messageId: 'mock-msg-002-2',
            body: 'Спасибо за заявку! Мы передали профиль куратору.',
            sentAt: '2026-05-11T09:16:00.000Z',
            outgoing: false,
        },
    ],
    'mock-chat-003': [
        {
            messageId: 'mock-msg-003-1',
            body: 'Привет! Смотрел ваше резюме — сильный блок по фронтенду.',
            sentAt: '2026-05-09T16:00:00.000Z',
            outgoing: false,
        },
        {
            messageId: 'mock-msg-003-2',
            body: 'Можете прислать ссылку на портфолио?',
            sentAt: '2026-05-10T18:45:00.000Z',
            outgoing: false,
        },
    ],
};
