import React, { useEffect } from 'react';
import ChatsView from '../components/chats/ChatsView.jsx';
import useCommunicationReadiness from '../hooks/useCommunicationReadiness.js';
import { useNavigate } from 'react-router-dom';
import { isAdmin, isRecruiterRole, isStudentRole } from '../services/authApi.js';
import '../components/chats/chatsView.css';

const ChatsPage = () => {
    const navigate = useNavigate();
    const { loading, ready } = useCommunicationReadiness(!isAdmin());

    useEffect(() => {
        if (loading || isAdmin() || ready) return;
        if (isStudentRole()) {
            navigate('/settings', { replace: true });
            return;
        }
        if (isRecruiterRole()) {
            navigate('/onboarding/recruiter-profile', { replace: true });
        }
    }, [loading, ready, navigate]);

    if (loading || (!isAdmin() && !ready)) {
        return (
            <div className="appRouteLoader" aria-label="Загрузка">
                <div className="appRouteLoader__spinner" />
            </div>
        );
    }

    return (
        <div className="chatsPage">
            <ChatsView />
        </div>
    );
};

export default ChatsPage;
