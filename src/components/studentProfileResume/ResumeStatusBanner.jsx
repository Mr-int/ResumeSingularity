import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    RESUME_BANNER_STATUS,
    RESUME_SUBMIT_GRACE_MS,
    getStudentProfileSubmittedAt,
    resolveResumeBannerStatus,
} from '../../utils/studentOnboarding.js';
import { fetchAuthMe, getStoredAccountStatus, getStoredUserId } from '../../services/authApi.js';
import alertIcon from '../../assets/icons/resume-status-alert.svg';
import clockIcon from '../../assets/icons/resume-status-clock.svg';
import reviewIcon from '../../assets/icons/resume-status-review.svg';
import revisionIcon from '../../assets/icons/resume-status-revision.svg';
import './resumeStatusBanner.css';

const BANNER_COPY = {
    [RESUME_BANNER_STATUS.NOT_SUBMITTED]: {
        tone: 'warn',
        title: 'Не отправлено',
        text: 'Твоё резюме ещё не отправлено на проверку, заверши резюме что бы мы смогли его опубликовать',
        actionLabel: 'Доделать резюме',
        icon: alertIcon,
        iconClass: 'resumeStatusBanner__art--alert',
    },
    [RESUME_BANNER_STATUS.AWAITING_SEND]: {
        tone: 'neutral',
        title: 'Отправляем на проверку...',
        text: 'Резюме будет отправлено на проверку через 5 минут, в это время вы можете поправить резюме.',
        actionLabel: null,
        icon: clockIcon,
        iconClass: 'resumeStatusBanner__art--clock',
    },
    [RESUME_BANNER_STATUS.IN_REVIEW]: {
        tone: 'review',
        title: 'На проверке',
        text: 'Резюме уже у модератора. Обычно проверка занимает немного времени — мы сообщим, когда всё будет готово.',
        actionLabel: null,
        icon: reviewIcon,
        iconClass: 'resumeStatusBanner__art--review',
    },
    [RESUME_BANNER_STATUS.REVISION]: {
        tone: 'danger',
        title: 'Нужна доработка',
        text: 'Модератор вернул резюме на доработку. Исправь замечания и отправь анкету снова.',
        actionLabel: 'Исправить резюме',
        icon: revisionIcon,
        iconClass: 'resumeStatusBanner__art--revision',
    },
};

const ResumeStatusBanner = ({ accountStatus, userId }) => {
    const navigate = useNavigate();
    const [bannerStatus, setBannerStatus] = useState(null);

    useEffect(() => {
        let cancelled = false;
        let timerId = null;

        const apply = (authLike) => {
            if (cancelled) return;
            const next = resolveResumeBannerStatus(authLike);
            setBannerStatus(next);

            if (next !== RESUME_BANNER_STATUS.AWAITING_SEND) return;
            const submittedAt = getStudentProfileSubmittedAt(authLike?.id);
            if (submittedAt == null) return;
            const left = RESUME_SUBMIT_GRACE_MS - (Date.now() - submittedAt);
            if (left <= 0) {
                setBannerStatus(RESUME_BANNER_STATUS.IN_REVIEW);
                return;
            }
            timerId = window.setTimeout(() => {
                if (!cancelled) setBannerStatus(RESUME_BANNER_STATUS.IN_REVIEW);
            }, left + 50);
        };

        const boot = async () => {
            const localAuth = {
                id: userId || getStoredUserId(),
                accountStatus: accountStatus || getStoredAccountStatus() || '',
            };
            apply(localAuth);

            try {
                const me = await fetchAuthMe();
                if (cancelled) return;
                apply({
                    id: me?.id || localAuth.id,
                    accountStatus: me?.accountStatus || localAuth.accountStatus,
                });
            } catch {
                /* оставляем локальный статус */
            }
        };

        boot();
        return () => {
            cancelled = true;
            if (timerId) window.clearTimeout(timerId);
        };
    }, [accountStatus, userId]);

    const copy = bannerStatus ? BANNER_COPY[bannerStatus] : null;
    if (!copy) return null;

    return (
        <aside
            className={`resumeStatusBanner resumeStatusBanner--${copy.tone}`}
            aria-live="polite"
        >
            <div className="resumeStatusBanner__body">
                <p className="resumeStatusBanner__title">{copy.title}</p>
                <p className="resumeStatusBanner__text">{copy.text}</p>
                {copy.actionLabel ? (
                    <button
                        type="button"
                        className="resumeStatusBanner__btn"
                        onClick={() => navigate('/resume/create')}
                    >
                        {copy.actionLabel}
                    </button>
                ) : null}
            </div>
            <img
                className={`resumeStatusBanner__art ${copy.iconClass}`}
                src={copy.icon}
                alt=""
                aria-hidden="true"
            />
        </aside>
    );
};

export default ResumeStatusBanner;
