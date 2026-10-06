import './photoExamples.css';

const PhotoExamples = ({ examples = [], onSelect }) => {
    return (
        <div className="photoExamples">
            <p className="photoExamples__title">Примеры фото</p>
            <div className="photoExamples__grid">
                {examples.map((example) => (
                    <button
                        key={example.id}
                        type="button"
                        className="photoExamples__item"
                        onClick={() => onSelect?.(example)}
                    >
                        {example.src ? <img src={example.src} alt={example.alt || 'Пример'} /> : null}
                    </button>
                ))}
            </div>
        </div>
    );
};

export default PhotoExamples;
