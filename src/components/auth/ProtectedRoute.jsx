import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
    isAuthenticated,
    syncAuthSession,
    isAdmin,
    consumeAuthReturnTo,
    isStudentRole,
    isRecruiterRole,
    notifyAuthChanged,
    AUTH_CHANGED_EVENT,
} from '../../services/authApi.js';
import {
    getStudentOnboardingStatus,
    getRecruiterOnboardingStatus,
    getCachedOnboardingStatus,
    setCachedOnboardingStatus,
} from '../../services/onboardingApi.js';
import LoginModal from './LoginModal.jsx';

const ONBOARDING_STUDENT_PATH = '/onboarding/resume';
const ONBOARDING_RECRUITER_PATH = '/onboarding/vacancy';

const RouteLoadingScreen = () => (
    <div className="appRouteLoader" aria-label="Загрузка">
        <div className="appRouteLoader__spinner" />
    </div>
);

const ProtectedRoute = ({ children, skipOnboardingCheck = false }) => {
    const [showLogin, setShowLogin] = useState(false);
    const [authenticated, setAuthenticated] = useState(false);
    const [loading, setLoading] = useState(true);
    const [onboardingReady, setOnboardingReady] = useState(false);
    const [authCheckVersion, setAuthCheckVersion] = useState(0);
    const navigate = useNavigate();
    const location = useLocation();

    useEffect(() => {
        let cancelled = false;
        let inFlight = false;
        let pendingRerun = false;

        const finishLoading = (authed, loginVisible, ready = true) => {
            if (cancelled) return;
            setAuthenticated(authed);
            setShowLogin(loginVisible);
            setOnboardingReady(ready);
            setLoading(false);
        };

        const checkAuth = async () => {
            if (cancelled) return;
            if (inFlight) {
                pendingRerun = true;
                return;
            }
            inFlight = true;
            pendingRerun = false;

            setLoading(true);
            const showLoginFlag = sessionStorage.getItem('showLoginAfter403');
            if (showLoginFlag === 'true') {
                sessionStorage.removeItem('showLoginAfter403');
            }

            try {
            if (!isAuthenticated()) {
                finishLoading(false, true);
                return;
            }

            await syncAuthSession();
            if (cancelled) return;

            if (!isAuthenticated()) {
                finishLoading(false, true);
                return;
            }

            setShowLogin(false);
            setAuthenticated(true);

            if (skipOnboardingCheck || isAdmin()) {
                finishLoading(true, false);
                return;
            }

            setOnboardingReady(false);
            const path = location.pathname;

            const applyStudentOnboarding = (completed) => {
                if (!completed) {
                    if (path !== ONBOARDING_STUDENT_PATH) {
                        navigate(ONBOARDING_STUDENT_PATH, { replace: true });
                    }
                    finishLoading(true, false);
                    return true;
                }
                if (path === ONBOARDING_STUDENT_PATH) {
                    navigate('/settings', { replace: true });
                }
                finishLoading(true, false);
                return true;
            };

            const applyRecruiterOnboarding = (completed) => {
                if (!completed) {
                    if (path !== ONBOARDING_RECRUITER_PATH) {
                        navigate(ONBOARDING_RECRUITER_PATH, { replace: true });
                    }
                    finishLoading(true, false);
                    return true;
                }
                if (path === ONBOARDING_RECRUITER_PATH) {
                    navigate('/vacancies/mine', { replace: true });
                }
                finishLoading(true, false);
                return true;
            };

            const checkStudentOnboarding = async () => {
                const cached = getCachedOnboardingStatus('student');
                if (cached) {
                    return applyStudentOnboarding(cached.completed);
                }
                try {
                    const studentStatus = await getStudentOnboardingStatus();
                    if (cancelled) return false;
                    setCachedOnboardingStatus('student', Boolean(studentStatus.completed));
                    return applyStudentOnboarding(Boolean(studentStatus.completed));
                } catch (e) {
                    if (e.status !== 403 && e.status !== 404) {
                        console.warn('[ProtectedRoute] student onboarding check', e);
                    }
                    return false;
                }
            };

            const checkRecruiterOnboarding = async () => {
                const cached = getCachedOnboardingStatus('recruiter');
                if (cached) {
                    return applyRecruiterOnboarding(cached.completed);
                }
                try {
                    const recruiterStatus = await getRecruiterOnboardingStatus();
                    if (cancelled) return false;
                    setCachedOnboardingStatus('recruiter', Boolean(recruiterStatus.completed));
                    return applyRecruiterOnboarding(Boolean(recruiterStatus.completed));
                } catch (e) {
                    if (e.status !== 403 && e.status !== 404) {
                        console.warn('[ProtectedRoute] recruiter onboarding check', e);
                    }
                    return false;
                }
            };

            if (isStudentRole()) {
                if (await checkStudentOnboarding()) return;
                finishLoading(true, false);
                return;
            }

            if (isRecruiterRole()) {
                if (await checkRecruiterOnboarding()) return;
                finishLoading(true, false);
                return;
            }

            if (await checkStudentOnboarding()) return;
            if (await checkRecruiterOnboarding()) return;

            finishLoading(true, false);
            } finally {
                inFlight = false;
                if (pendingRerun && !cancelled) {
                    pendingRerun = false;
                    checkAuth();
                }
            }
        };

        const onAuthRequired = () => {
            if (cancelled) return;
            finishLoading(false, true);
        };

        checkAuth();

        window.addEventListener('resume:auth-required', onAuthRequired);
        window.addEventListener(AUTH_CHANGED_EVENT, checkAuth);

        const handleStorageChange = (e) => {
            if (e.key === 'showLoginAfter403') checkAuth();
        };
        window.addEventListener('storage', handleStorageChange);

        return () => {
            cancelled = true;
            window.removeEventListener('resume:auth-required', onAuthRequired);
            window.removeEventListener(AUTH_CHANGED_EVENT, checkAuth);
            window.removeEventListener('storage', handleStorageChange);
        };
    }, [location.pathname, navigate, skipOnboardingCheck, authCheckVersion]);

    const handleLoginSuccess = async () => {
        sessionStorage.removeItem('showLoginAfter403');
        await syncAuthSession();
        setAuthenticated(isAuthenticated());
        setShowLogin(false);
        setLoading(false);
        setOnboardingReady(false);
        notifyAuthChanged();

        const returnTo = consumeAuthReturnTo();
        if (returnTo) {
            navigate(returnTo);
            return;
        }
        setAuthCheckVersion((v) => v + 1);
    };

    const handleCloseLogin = () => {
        navigate('/');
    };

    if (loading || (authenticated && !onboardingReady)) {
        return <RouteLoadingScreen />;
    }

    if (!authenticated) {
        return showLogin ? (
            <LoginModal onClose={handleCloseLogin} onSuccess={handleLoginSuccess} />
        ) : (
            <RouteLoadingScreen />
        );
    }

    return children;
};

export default ProtectedRoute;
