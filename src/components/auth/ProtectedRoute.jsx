import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { isAuthenticated, syncAuthSession, isAdmin, consumeAuthReturnTo } from '../../services/authApi.js';
import { getStudentOnboardingStatus, getRecruiterOnboardingStatus } from '../../services/onboardingApi.js';
import LoginModal from './LoginModal.jsx';

const ONBOARDING_STUDENT_PATH = '/onboarding/resume';
const ONBOARDING_RECRUITER_PATH = '/onboarding/vacancy';

const ProtectedRoute = ({ children, skipOnboardingCheck = false }) => {
    const [showLogin, setShowLogin] = useState(false);
    const [authenticated, setAuthenticated] = useState(false);
    const [loading, setLoading] = useState(true);
    const [onboardingReady, setOnboardingReady] = useState(false);
    const [authCheckVersion, setAuthCheckVersion] = useState(0);
    const navigate = useNavigate();
    const location = useLocation();
    const checkingRef = useRef(false);

    useEffect(() => {
        const onAuthRequired = () => {
            setAuthenticated(false);
            setShowLogin(true);
            setLoading(false);
            setOnboardingReady(false);
        };
        window.addEventListener('resume:auth-required', onAuthRequired);
        return () => window.removeEventListener('resume:auth-required', onAuthRequired);
    }, []);

    useEffect(() => {
        const checkAuth = async () => {
            const authStatus = isAuthenticated();
            const showLoginFlag = sessionStorage.getItem('showLoginAfter403');

            if (!authStatus) {
                setAuthenticated(false);
                setLoading(false);
                setOnboardingReady(true);
                setShowLogin(true);
                return;
            }

            setShowLogin(false);
            if (showLoginFlag === 'true') {
                sessionStorage.removeItem('showLoginAfter403');
            }

            await syncAuthSession();
            const stillAuthed = isAuthenticated();
            setAuthenticated(stillAuthed);

            if (!stillAuthed) {
                setLoading(false);
                setOnboardingReady(true);
                setShowLogin(true);
                return;
            }

            if (skipOnboardingCheck || isAdmin()) {
                setOnboardingReady(true);
                setLoading(false);
                checkingRef.current = false;
                return;
            }

            if (checkingRef.current) return;
            checkingRef.current = true;
            setOnboardingReady(false);

            const path = location.pathname;

            try {
                const studentStatus = await getStudentOnboardingStatus();
                if (!studentStatus.completed) {
                    if (path !== ONBOARDING_STUDENT_PATH) {
                        navigate(ONBOARDING_STUDENT_PATH, { replace: true });
                    }
                    setOnboardingReady(true);
                    setLoading(false);
                    checkingRef.current = false;
                    return;
                }
                if (path === ONBOARDING_STUDENT_PATH) {
                    navigate('/settings', { replace: true });
                }
                setOnboardingReady(true);
                setLoading(false);
                checkingRef.current = false;
                return;
            } catch (e) {
                if (e.status !== 403 && e.status !== 404) {
                    console.warn('[ProtectedRoute] student onboarding check', e);
                }
            }

            try {
                const recruiterStatus = await getRecruiterOnboardingStatus();
                if (!recruiterStatus.completed) {
                    if (path !== ONBOARDING_RECRUITER_PATH) {
                        navigate(ONBOARDING_RECRUITER_PATH, { replace: true });
                    }
                    setOnboardingReady(true);
                    setLoading(false);
                    checkingRef.current = false;
                    return;
                }
                if (path === ONBOARDING_RECRUITER_PATH) {
                    navigate('/vacancies/mine', { replace: true });
                }
                setOnboardingReady(true);
                setLoading(false);
                checkingRef.current = false;
                return;
            } catch (e) {
                if (e.status !== 403 && e.status !== 404) {
                    console.warn('[ProtectedRoute] recruiter onboarding check', e);
                }
            }

            setOnboardingReady(true);
            setLoading(false);
            checkingRef.current = false;
        };

        checkAuth();

        const handleStorageChange = (e) => {
            if (e.key === 'showLoginAfter403') checkAuth();
        };

        window.addEventListener('storage', handleStorageChange);
        return () => window.removeEventListener('storage', handleStorageChange);
    }, [location.pathname, navigate, skipOnboardingCheck, authCheckVersion]);

    const handleLoginSuccess = () => {
        sessionStorage.removeItem('showLoginAfter403');
        checkingRef.current = false;
        setAuthenticated(true);
        setShowLogin(false);
        setLoading(false);
        setOnboardingReady(true);

        const returnTo = consumeAuthReturnTo();
        if (returnTo) {
            window.location.href = returnTo;
            return;
        }
        window.location.reload();
    };

    const handleCloseLogin = () => {
        navigate('/');
    };

    if (loading || (authenticated && !onboardingReady)) {
        return null;
    }

    if (!authenticated) {
        return showLogin ? (
            <LoginModal onClose={handleCloseLogin} onSuccess={handleLoginSuccess} />
        ) : null;
    }

    return children;
};

export default ProtectedRoute;
