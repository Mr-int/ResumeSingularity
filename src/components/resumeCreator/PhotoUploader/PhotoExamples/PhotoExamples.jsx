import agreeIcon from '../../../../assets/icons/agree.png';
import cancelIcon from '../../../../assets/icons/cancel.png';
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
                            <img
                                src={isWrong ? cancelIcon : agreeIcon}
                                alt=""
                                className="photoExamples__badge"
                                width={18}
                                height={18}
                                aria-hidden="true"
                            />
                        </button>
                    );
                })}
            </div>
        </div>
    );
};

export default PhotoExamples;
