import { useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import { ANALYTICS_EVENT, trackAnalyticsEvent } from '../../services/analyticsApi.js';

/** PAGE_VIEW при каждом открытии/смене маршрута. */
const AnalyticsPageViews = () => {
    const location = useLocation();
    const lastKeyRef = useRef('');

    useEffect(() => {
        const key = `${location.pathname}${location.search}${location.hash}`;
        if (lastKeyRef.current === key) return;
        lastKeyRef.current = key;
        trackAnalyticsEvent(ANALYTICS_EVENT.PAGE_VIEW, { path: location.pathname });
    }, [location.pathname, location.search, location.hash]);

    return null;
};

export default AnalyticsPageViews;
