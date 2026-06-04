import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { trackAnalyticsEvent } from '../services/analyticsApi.js';

/**
 * Отправляет PAGE_VIEW при смене маршрута.
 */
export function useAnalyticsTracker() {
    const location = useLocation();

    useEffect(() => {
        const path = `${location.pathname}${location.search || ''}`;
        trackAnalyticsEvent({ path });
    }, [location.pathname, location.search]);
}
