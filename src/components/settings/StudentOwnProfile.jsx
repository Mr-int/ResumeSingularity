import React, { useCallback, useEffect, useState } from 'react';
import StudentResume from '../studentResume/StudentResume.jsx';
import StudentProfileEditor from './StudentProfileEditor.jsx';
import StudentAccountSettings from './StudentAccountSettings.jsx';
import StudentRequestsSection from './StudentRequestsSection.jsx';
import { getStudentPortfolio } from '../../services/onboardingApi.js';
import '../studentResume/studentResume.css';
import './studentOwnProfile.css';

const StudentOwnProfile = ({
    profile,
    onProfileUpdate,
    onConsentChange,
    consentSaving,
    consentError,
    defaultEditing = false,
}) => {
    const [mode, setMode] = useState(defaultEditing ? 'edit' : 'view');
    const [portfolioCount, setPortfolioCount] = useState(0);

    const refreshPortfolioCount = useCallback(async () => {
        try {
            const items = await getStudentPortfolio();
            setPortfolioCount(Array.isArray(items) ? items.length : 0);
        } catch {
            setPortfolioCount(0);
        }
    }, []);

    useEffect(() => {
        refreshPortfolioCount();
    }, [profile?.id, mode, refreshPortfolioCount]);

    const profileMeta = {
        profile,
        portfolioCount,
        publicProfileConsent: profile.publicProfileConsent,
        onConsentChange,
        consentSaving,
        consentError,
    };

    return (
        <div className="StudentOwnProfile">
            {mode === 'view' ? (
                <div className="StudentOwnProfile__actions">
                    <button
                        type="button"
                        className="accountPage__submit"
                        onClick={() => setMode('edit')}
                    >
                        Изменить
                    </button>
                    <button
                        type="button"
                        className="StudentOwnProfile__linkBtn"
                        onClick={() => setMode('preview')}
                    >
                        Как видят другие
                    </button>
                </div>
            ) : null}
            {mode === 'preview' ? (
                <div className="StudentOwnProfile__actions">
                    <button
                        type="button"
                        className="accountPage__submit"
                        onClick={() => setMode('view')}
                    >
                        Назад к моему виду
                    </button>
                </div>
            ) : null}

            <div className="accountPage__resumePreview">
                {mode === 'view' ? (
                    <StudentResume
                        key={`${profile.id}-${profile.imagePath || 'no-photo'}-view`}
                        studentId={profile.id}
                        ownerView
                        showEmptySections
                    />
                ) : null}
                {mode === 'preview' ? (
                    <StudentResume
                        key={`${profile.id}-${profile.imagePath || 'no-photo'}-preview`}
                        studentId={profile.id}
                        ownerView={false}
                        showEmptySections
                    />
                ) : null}
                {mode === 'edit' ? (
                    <StudentProfileEditor
                        key={`${profile.id}-edit`}
                        resumeLayout
                        profileMeta={profileMeta}
                        onPortfolioChange={refreshPortfolioCount}
                        onSaved={(updated) => {
                            onProfileUpdate?.(updated);
                            setMode('view');
                            refreshPortfolioCount();
                        }}
                        onCancel={() => setMode('view')}
                        submitLabel="Сохранить"
                    />
                ) : null}
            </div>

            {mode === 'view' ? <StudentRequestsSection /> : null}

            {mode === 'edit' ? (
                <StudentAccountSettings
                    profile={profile}
                    portfolioCount={portfolioCount}
                    publicProfileConsent={profile.publicProfileConsent}
                    onConsentChange={onConsentChange}
                    consentSaving={consentSaving}
                    consentError={consentError}
                />
            ) : null}
        </div>
    );
};

export default StudentOwnProfile;
