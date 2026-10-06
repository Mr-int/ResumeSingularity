import './cardPreview.css';
import { getImageUrl } from '../../../config/api.js';
import { courseUiLabel } from '../StepForm/StepForm.jsx';

const CardPreview = ({
    firstName = 'Имя',
    lastName = 'Фамилия',
    specialty = 'Специализация',
    course = 'FIRST',
    skillCode = 'PY',
    skillLabel = 'Python',
    photoSrc,
    imagePath,
}) => {
    const fullName = `${firstName} ${lastName}`.trim();
    const courseLabel = courseUiLabel(course) || course;
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
                        <div className="cardPreview__badge cardPreview__badge--course">{courseLabel}</div>
                    </div>
                </div>
                <div className="cardPreview__name">{fullName || 'Имя Фамилия'}</div>
                <div className="cardPreview__spec">{specialty}</div>
            </div>

            <div className="cardPreview__legends">
                <div className="cardPreview__legend">
                    <span className="cardPreview__legendBadge cardPreview__legendBadge--course">{courseLabel}</span>
                    Курс
                </div>
                <div className="cardPreview__legend">
                    <span className="cardPreview__legendBadge cardPreview__legendBadge--skill">{skillCode}</span>
                    {skillLabel}
                </div>
            </div>
        </section>
    );
};

export default CardPreview;
