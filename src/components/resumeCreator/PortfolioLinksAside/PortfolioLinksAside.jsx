import whiteFolder from '../../../assets/folders/white_folder.png';
import yellowFolder from '../../../assets/folders/yellow_folder.png';
import greenFolder from '../../../assets/folders/green_folder.png';
import pinkFolder from '../../../assets/folders/pink_folder.png';
import bookIcon from '../../../assets/icons/memo-book.svg';
import editIcon from '../../../assets/icons/folder-edit.svg';
import closeIcon from '../../../assets/icons/folder-close.svg';
import arrowIcon from '../../../assets/icons/arrow_small.svg';
import './portfolioLinksAside.css';

const FOLDER_IMAGES = [whiteFolder, yellowFolder, greenFolder, pinkFolder];

const MEMO_QUESTIONS = [
    'Какие ссылки полезно прикрепить?',
    'Какую ссылку оставить в опыте работы?',
    'Подойдет ли неофициальное трудоустройство?',
    'На сколько важно иметь опыт работы в резюме?',
    'Что представляет из себя опыт работы?',
];

const PortfolioLinksAside = ({
    items = [],
    onEdit,
    onDelete,
}) => {
    return (
        <aside className="portfolioAside">
            <div className="portfolioAside__scroll">
                {items.length > 0 ? (
                    <div className="portfolioAside__folders">
                        {items.map((item, index) => {
                            const label = item.name || 'Ссылка';
                            return (
                                <article
                                    key={item.id ?? `${item.name}-${index}`}
                                    className="portfolioAside__folder"
                                >
                                    <img
                                        className="portfolioAside__folderImg"
                                        src={FOLDER_IMAGES[index % FOLDER_IMAGES.length]}
                                        alt=""
                                        width={205}
                                        height={131}
                                    />
                                    <div className="portfolioAside__tools">
                                        <button
                                            type="button"
                                            className="portfolioAside__tool"
                                            aria-label={`Редактировать: ${label}`}
                                            onClick={() => onEdit?.(item)}
                                        >
                                            <img src={editIcon} alt="" />
                                        </button>
                                        <button
                                            type="button"
                                            className="portfolioAside__tool"
                                            aria-label={`Удалить: ${label}`}
                                            onClick={() => onDelete?.(item)}
                                        >
                                            <img src={closeIcon} alt="" />
                                        </button>
                                    </div>
                                    <div className="portfolioAside__copy">
                                        <p className="portfolioAside__name">{item.name}</p>
                                        {item.description ? (
                                            <p className="portfolioAside__desc">{item.description}</p>
                                        ) : null}
                                    </div>
                                </article>
                            );
                        })}
                    </div>
                ) : null}

                <div className="portfolioAside__memo">
                    <div className="portfolioAside__memoHead">
                        <img src={bookIcon} alt="" />
                        <h2 className="portfolioAside__memoTitle">Памятка</h2>
                    </div>
                    <ul className="portfolioAside__questions">
                        {MEMO_QUESTIONS.map((question) => (
                            <li key={question} className="portfolioAside__question">
                                <span>{question}</span>
                                <img src={arrowIcon} alt="" />
                            </li>
                        ))}
                    </ul>
                </div>
            </div>
            <div className="portfolioAside__fade" aria-hidden="true" />
        </aside>
    );
};

export default PortfolioLinksAside;
