import './photoReadyCard.css';

const PhotoReadyCard = ({ src, fileName = 'photo.jpeg', onReplace }) => {
    return (
        <div className="photoReadyCard">
            <div className="photoReadyCard__photo">
                {src ? (
                    <img src={src} alt="Ваша фотография" />
                ) : (
                    <div className="photoReadyCard__placeholder" />
                )}
            </div>

            <div className="photoReadyCard__info">
                <div className="photoReadyCard__text">
                    <p className="photoReadyCard__label">Ваша фотография</p>
                    <p className="photoReadyCard__filename">{fileName}</p>
                </div>

                <button type="button" className="photoReadyCard__action" onClick={onReplace}>
                    <span>Загрузить другое</span>
                    <svg viewBox="0 0 24 24" aria-hidden="true">
                        <line x1="18" y1="6" x2="6" y2="18" />
                        <line x1="6" y1="6" x2="18" y2="18" />
                    </svg>
                </button>
            </div>
        </div>
    );
};

export default PhotoReadyCard;
