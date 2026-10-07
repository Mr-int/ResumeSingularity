import './cardPreview.css';
import { getImageUrl } from '../../../config/api.js';
import { courseUiLabel } from '../StepForm/StepForm.jsx';

const courseTone = (course) => {
    switch (course) {
        case 'FIRST':
            return 1;
        case 'SECOND':
            return 2;
        case 'THIRD':
            return 3;
        case 'FOURTH':
            return 4;
        case 'NEW':
        case 'FIFTH':
            return 'star';
        default:
            return '';
    }
};

const CardPreview = ({
    firstName = 'Имя',
    lastName = 'Фамилия',
    specialty = 'Специализация',
    course = '',
    skillCode = 'PY',
    skillLabel = 'Python',
    photoSrc,
    imagePath,
}) => {
    const fullName = `${firstName} ${lastName}`.trim();
    const courseLabel = courseUiLabel(course) || '—';
    const tone = courseTone(course);
    const courseClass = tone
        ? `cardPreview__legendBadge--course cardPreview__legendBadge--course-${tone}`
        : 'cardPreview__legendBadge--course';
    const badgeCourseClass = tone
        ? `cardPreview__badge--course cardPreview__badge--course-${tone}`
        : 'cardPreview__badge--course';
    const photoUrl = photoSrc || getImageUrl(imagePath);

    return (
        <section className="cardPreview">
            <div className="cardPreview__title">
                Оформление карточки
                <span className="cardPreview__info">?</span>
            </div>

            <div className="cardPreview__card">
                <div className="cardPreview__photo">
                    {photoUrl ? <img src={photoUrl} alt={fullName} /> : null}
                    <div className="cardPreview__badges">
                        <div className="cardPreview__badge cardPreview__badge--skill">{skillCode}</div>
                        <div className={`cardPreview__badge ${badgeCourseClass}`}>{courseLabel}</div>
                    </div>
                </div>
                <div className="cardPreview__name">
                    <span>{firstName || 'Имя'}</span>
                    <span>{lastName || 'Фамилия'}</span>
                </div>
                <div className="cardPreview__spec">{specialty}</div>
            </div>

            <div className="cardPreview__legends">
                <div className="cardPreview__legend">
                    <span className={`cardPreview__legendBadge ${courseClass}`}>{courseLabel}</span>
                    Ваш номер курса
                </div>
                <div className="cardPreview__legend">
                    <span className="cardPreview__legendBadge cardPreview__legendBadge--skill">{skillCode}</span>
                    проф. знак вашей специальности
                </div>
            </div>
        </section>
    );
};

export default CardPreview;
