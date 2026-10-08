import './photoExamples.css';

const PhotoExamples = ({ examples = [], onSelect }) => {
    return (
        <div className="photoExamples">
            <p className="photoExamples__title">Примеры фото</p>
            <div className="photoExamples__grid">
                {examples.map((example) => {
                    const isWrong = example.status === 'wrong';
                    const isCorrect = example.status === 'correct';

                    return (
                        <button
                            key={example.id}
                            type="button"
                            className={
                                'photoExamples__item'
                                + (isCorrect ? ' photoExamples__item--correct' : '')
                                + (isWrong ? ' photoExamples__item--wrong' : '')
                            }
                            onClick={() => {
                                if (isWrong) return;
                                onSelect?.(example);
                            }}
                            disabled={isWrong}
                            aria-label={example.alt || (isWrong ? 'Неудачный пример' : 'Удачный пример')}
                        >
                            {example.src ? (
                                <img src={example.src} alt={example.alt || 'Пример'} />
                            ) : null}
                            <span className="photoExamples__badge" aria-hidden="true">
                                {isWrong ? (
                                    <svg viewBox="0 0 12 12" width="10" height="10">
                                        <path
                                            d="M3 3l6 6M9 3L3 9"
                                            stroke="#fff"
                                            strokeWidth="1.8"
                                            strokeLinecap="round"
                                        />
                                    </svg>
                                ) : (
                                    <svg viewBox="0 0 12 12" width="10" height="10">
                                        <path
                                            d="M2.5 6.2l2.4 2.4L9.5 3.8"
                                            fill="none"
                                            stroke="#fff"
                                            strokeWidth="1.8"
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                        />
                                    </svg>
                                )}
                            </span>
                        </button>
                    );
                })}
            </div>
        </div>
    );
};

export default PhotoExamples;
