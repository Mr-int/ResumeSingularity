import { useEffect, useState } from 'react';
import { getCommunicationReadiness } from '../services/profileApi.js';
import { isAdmin } from '../services/authApi.js';

export function useCommunicationReadiness(enabled = true) {
    const [loading, setLoading] = useState(enabled);
    const [ready, setReady] = useState(isAdmin());
    const [missingFields, setMissingFields] = useState([]);

    useEffect(() => {
        if (!enabled || isAdmin()) {
            setReady(true);
            setMissingFields([]);
            setLoading(false);
            return undefined;
        }

        let cancelled = false;
        setLoading(true);

        (async () => {
            try {
                const res = await getCommunicationReadiness();
                if (cancelled) return;
                setReady(Boolean(res?.ready));
                setMissingFields(Array.isArray(res?.missingFields) ? res.missingFields : []);
            } catch {
                if (!cancelled) {
                    setReady(false);
                    setMissingFields([]);
                }
            } finally {
                if (!cancelled) setLoading(false);
            }
        })();

        return () => {
            cancelled = true;
        };
    }, [enabled]);

    return { loading, ready, missingFields };
}

export default useCommunicationReadiness;
