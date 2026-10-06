import './cardPreview.css';

const CardPreview = ({
    firstName = 'Имя',
    lastName = 'Фамилия',
    specialty = 'Специализация',
    course = '1',
    skillCode = 'PY',
    skillLabel = 'Python',
    photoSrc,
}) => {
    const fullName = `${firstName} ${lastName}`.trim();

    return (
        <section className="cardPreview">
            <div className="cardPreview__title">
                Оформление карточки
                <span className="cardPreview__info">?</span>
            </div>

            <div className="cardPreview__card">
                <div className="cardPreview__photo">
                    {photoSrc ? <img src={photoSrc} alt={fullName} /> : null}
                    <div className="cardPreview__badges">
                        <div className="cardPreview__badge cardPreview__badge--skill">{skillCode}</div>
                        <div className="cardPreview__badge cardPreview__badge--course">{course}</div>
                    </div>
                </div>
                <div className="cardPreview__name">{fullName || 'Имя Фамилия'}</div>
                <div className="cardPreview__spec">{specialty}</div>
            </div>

            <div className="cardPreview__legends">
                <div className="cardPreview__legend">
                    <span className="cardPreview__legendBadge cardPreview__legendBadge--course">{course}</span>
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
