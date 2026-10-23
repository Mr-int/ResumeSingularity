import editIcon from '../../../assets/icons/edit.svg';
import MemoBlock from '../MemoBlock/MemoBlock.jsx';
import { formatExperiencePeriodText } from '../../../utils/formatExperiencePeriod.js';
import './experienceAside.css';

const TrashIcon = () => (
    <svg className="experienceAside__trashIcon" viewBox="0 0 24 24" aria-hidden="true">
        <path
            d="M9 3h6M4 7h16M8 7v12a2 2 0 0 0 2 2h4a2 2 0 0 0 2-2V7M10 11v6M14 11v6"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.7"
            strokeLinecap="round"
            strokeLinejoin="round"
        />
    </svg>
);

const ExperienceAside = ({
    items = [],
    editingId = null,
    memoItems = [],
    onEdit,
    onDelete,
}) => {
    return (
        <aside className="experienceAside">
            {items.length > 0 ? (
                <div className="experienceAside__cards">
                    {items.map((item) => {
                        const itemKey = item.id || `${item.position}-${item.startDate}`;
                        const isActive = editingId != null && String(item.id) === String(editingId);
                        const period = formatExperiencePeriodText(item.startDate, item.endDate);

                        return (
                            <article
                                key={itemKey}
                                className={
                                    'experienceAside__card'
                                    + (isActive ? ' is-active' : '')
                                }
                            >
                                <button
                                    type="button"
                                    className="experienceAside__delete"
                                    aria-label={`Удалить опыт: ${item.position || 'запись'}`}
                                    onClick={() => onDelete?.(item)}
                                >
                                    <TrashIcon />
                                </button>

                                <h3 className="experienceAside__company">
                                    {item.companyName || 'Компания не указана'}
                                </h3>
                                {period ? (
                                    <p className="experienceAside__period">{period}</p>
                                ) : null}
                                {item.position ? (
                                    <p className="experienceAside__position">{item.position}</p>
                                ) : null}
                                {item.additionalInfo ? (
                                    <p className="experienceAside__description">
                                        {item.additionalInfo}
                                    </p>
                                ) : null}
                                {item.companyUrl ? (
                                    <a
                                        className="experienceAside__link"
                                        href={item.companyUrl}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                    >
                                        {item.companyUrl}
                                    </a>
                                ) : null}

                                <button
                                    type="button"
                                    className="experienceAside__edit"
                                    aria-label={`Редактировать: ${item.position || 'запись'}`}
                                    onClick={() => onEdit?.(item)}
                                >
                                    <img
                                        src={editIcon}
                                        alt=""
                                        className="experienceAside__editIcon"
                                        width={14}
                                        height={14}
                                        aria-hidden="true"
                                    />
                                </button>
                            </article>
                        );
                    })}
                </div>
            ) : null}

            <MemoBlock title="Памятка" items={memoItems} />
        </aside>
    );
};

export default ExperienceAside;
