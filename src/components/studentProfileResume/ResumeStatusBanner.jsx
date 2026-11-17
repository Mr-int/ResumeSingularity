import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    RESUME_BANNER_STATUS,
    formatMissingProfileFields,
    formatRejectionMessage,
    resolveResumeBannerStatus,
} from '../../utils/studentOnboarding.js';
import { fetchAuthMe, getStoredAccountStatus, getStoredUserId } from '../../services/authApi.js';
import { submitStudentForReview } from '../../services/accountApi.js';
import alertIcon from '../../assets/icons/resume-status-alert.svg';
import clockIcon from '../../assets/icons/resume-status-clock.svg';
import progressIcon from '../../assets/icons/resume-status-progress.svg';
import rejectedIcon from '../../assets/icons/resume-status-rejected.svg';
import './resumeStatusBanner.css';

const ResumeStatusBanner = ({ accountStatus, userId }) => {
    const navigate = useNavigate();
    const [bannerStatus, setBannerStatus] = useState(null);
    const [rejectionText, setRejectionText] = useState('');
    const [missingText, setMissingText] = useState('');
    const [submitting, setSubmitting] = useState(false);

    useEffect(() => {
        let cancelled = false;

        const apply = (authMe) => {
            if (cancelled) return;
            setBannerStatus(resolveResumeBannerStatus(authMe));
            setRejectionText(formatRejectionMessage(authMe));
        };

        const boot = async () => {
            const localAuth = {
                id: userId || getStoredUserId(),
                accountStatus: accountStatus || getStoredAccountStatus() || '',
            };
            apply(localAuth);
            try {
                const authMe = await fetchAuthMe();
                apply(authMe || localAuth);
            } catch {
                /* локальный fallback */
            }
        };

        boot();
        return () => {
            cancelled = true;
        };
    }, [accountStatus, userId]);

    const submitResume = async () => {
        if (submitting) return;
        setSubmitting(true);
        setMissingText('');
        try {
            await submitStudentForReview();
            const authMe = await fetchAuthMe();
            setBannerStatus(resolveResumeBannerStatus(authMe));
            setRejectionText(formatRejectionMessage(authMe));
        } catch (error) {
            const body = error?.responseBody;
            if (error?.status === 403 && body?.code === 'PROFILE_INCOMPLETE') {
                const missing = formatMissingProfileFields(body.missingFields);
                setMissingText(missing
                    ? `Для модерации ещё нужно: ${missing}`
                    : (body.message || 'Дозаполните профиль для модерации'));
            } else {
                setMissingText(error?.message || 'Отправить на проверку не удалось');
            }
        } finally {
            setSubmitting(false);
        }
    };

    if (!bannerStatus) return null;

    if (bannerStatus === RESUME_BANNER_STATUS.NOT_SUBMITTED) {
        return (
            <aside className="resumeStatusBanner resumeStatusBanner--warn" aria-live="polite">
                <div className="resumeStatusBanner__body">
                    <p className="resumeStatusBanner__title">Не отправлено</p>
                    <p className="resumeStatusBanner__text">
                        {missingText || 'Твоё резюме ещё не отправлено на проверку, заверши резюме что бы мы смогли его опубликовать'}
                    </p>
                    <button
                        type="button"
                        className="resumeStatusBanner__btn"
                        onClick={submitResume}
                        disabled={submitting}
                    >
                        {submitting ? 'Отправка…' : 'Доделать резюме'}
                    </button>
                </div>
                <img
                    className="resumeStatusBanner__art resumeStatusBanner__art--alert"
                    src={alertIcon}
                    alt=""
                    aria-hidden="true"
                />
            </aside>
        );
    }

    if (bannerStatus === RESUME_BANNER_STATUS.AWAITING_SEND) {
        return (
            <aside className="resumeStatusBanner resumeStatusBanner--neutral" aria-live="polite">
                <div className="resumeStatusBanner__body resumeStatusBanner__body--wide">
                    <p className="resumeStatusBanner__title">Отправляем на проверку...</p>
                    <p className="resumeStatusBanner__text">
                        Резюме будет отправлено на проверку через 5 минут, в это время вы можете поправить резюме.
                    </p>
                </div>
                <img
                    className="resumeStatusBanner__art resumeStatusBanner__art--clock"
                    src={clockIcon}
                    alt=""
                    aria-hidden="true"
                />
            </aside>
        );
    }

    if (bannerStatus === RESUME_BANNER_STATUS.IN_REVIEW) {
        return (
            <aside className="resumeStatusBanner resumeStatusBanner--review" aria-live="polite">
                <div className="resumeStatusBanner__row">
                    <div className="resumeStatusBanner__body resumeStatusBanner__body--wide">
                        <p className="resumeStatusBanner__title">Резюме на проверке</p>
                        <p className="resumeStatusBanner__text">
                            Вы снова сможете редактировать резюме, после проверки.
                        </p>
                    </div>
                    <div className="resumeStatusBanner__chip resumeStatusBanner__chip--review">
                        <img src={progressIcon} alt="" width={20} height={20} />
                        <span>На проверке</span>
                    </div>
                </div>
            </aside>
        );
    }

    if (bannerStatus === RESUME_BANNER_STATUS.APPROVED) {
        return (
            <aside className="resumeStatusBanner resumeStatusBanner--review" aria-live="polite">
                <div className="resumeStatusBanner__row">
                    <div className="resumeStatusBanner__body resumeStatusBanner__body--wide">
                        <p className="resumeStatusBanner__title">Резюме одобрено</p>
                        <p className="resumeStatusBanner__text">
                            Анкета опубликована и видна работодателям.
                        </p>
                    </div>
                    <div className="resumeStatusBanner__chip resumeStatusBanner__chip--review">
                        <img src={progressIcon} alt="" width={20} height={20} />
                        <span>Одобрено</span>
                    </div>
                </div>
            </aside>
        );
    }

    if (bannerStatus === RESUME_BANNER_STATUS.REVISION) {
        return (
            <aside className="resumeStatusBanner resumeStatusBanner--danger" aria-live="polite">
                <div className="resumeStatusBanner__stack">
                    <div className="resumeStatusBanner__row">
                        <div className="resumeStatusBanner__body resumeStatusBanner__body--wide">
                            <p className="resumeStatusBanner__title">Резюме было отправлено на доработку</p>
                            <p className="resumeStatusBanner__text">
                                Правки и комментарии к резюме были отправлены в сообщения.
                                {rejectionText ? ` ${rejectionText}` : ''}
                            </p>
                        </div>
                        <div className="resumeStatusBanner__chip resumeStatusBanner__chip--danger">
                            <img src={rejectedIcon} alt="" width={20} height={20} />
                            <span>На доработке</span>
                        </div>
                    </div>
                    <button
                        type="button"
                        className="resumeStatusBanner__btn"
                        onClick={() => navigate('/chats')}
                    >
                        Открыть комментарии
                    </button>
                </div>
            </aside>
        );
    }

    return null;
};

export default ResumeStatusBanner;
