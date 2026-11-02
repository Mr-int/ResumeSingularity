import editIcon from '../../../assets/icons/edit.svg';
import MemoBlock from '../MemoBlock/MemoBlock.jsx';
import {
    formatExperienceDurationShort,
    formatExperiencePeriodText,
    isProjectExperience,
} from '../../../utils/formatExperiencePeriod.js';
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
                        const isProject = isProjectExperience(item);
                        const period = isProject
                            ? formatExperienceDurationShort(item.startDate, item.endDate, item.current)
                            : formatExperiencePeriodText(item.startDate, item.endDate, item.current);
                        const linkLabel = isProject ? 'Ссылка на материалы' : 'Ссылка на организацию';
                        const description = String(item.additionalInfo || item.description || '').trim();
                        const truncatedDescription = description.length > 72
                            ? `${description.slice(0, 72).trimEnd()}...`
                            : description;

                        return (
                            <article
                                key={itemKey}
                                className={
                                    'experienceAside__card'
                                    + (isActive ? ' is-active' : '')
                                    + (isProject ? ' experienceAside__card--project' : ' experienceAside__card--work')
                                }
                            >
                                <div className="experienceAside__main">
                                    <div className="experienceAside__meta">
                                        <p className="experienceAside__company">
                                            {item.companyName || (isProject ? 'Проект' : 'Компания не указана')}
                                        </p>
                                        {period ? (
                                            <p className="experienceAside__period">{period}</p>
                                        ) : null}
                                    </div>

                                    <div className="experienceAside__body">
                                        {item.position ? (
                                            <p className="experienceAside__position">{item.position}</p>
                                        ) : null}
                                        {truncatedDescription ? (
                                            <p className="experienceAside__description">
                                                {truncatedDescription}
                                            </p>
                                        ) : null}
                                        {item.companyUrl ? (
                                            <a
                                                className="experienceAside__link"
                                                href={item.companyUrl}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                            >
                                                {linkLabel}
                                            </a>
                                        ) : null}
                                    </div>

                                    <span className="experienceAside__tag">
                                        {isProject ? 'Проект' : 'Опыт работы'}
                                    </span>
                                </div>

                                <div className="experienceAside__tools">
                                    <button
                                        type="button"
                                        className="experienceAside__delete"
                                        aria-label={`Удалить опыт: ${item.position || 'запись'}`}
                                        onClick={() => onDelete?.(item)}
                                    >
                                        <TrashIcon />
                                    </button>
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
                                </div>
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
