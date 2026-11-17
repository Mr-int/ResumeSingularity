import editIcon from '../../../assets/icons/edit.svg';
import MemoBlock from '../MemoBlock/MemoBlock.jsx';
import './educationAside.css';

const TrashIcon = () => (
    <svg className="educationAside__trashIcon" viewBox="0 0 24 24" aria-hidden="true">
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

const formatEducationPeriod = (item) => {
    const start = item.startYear ?? item.startDate ?? '';
    const end = item.endYear ?? item.endDate ?? '';
    return [start, end]
        .map((value) => String(value || '').trim())
        .filter(Boolean)
        .join(' – ');
};

const EducationAside = ({
    items = [],
    editingId = null,
    memoItems = [],
    onEdit,
    onDelete,
}) => (
    <aside className="educationAside">
        {items.length > 0 ? (
            <div className="educationAside__cards">
                {items.map((item, index) => {
                    const itemKey = item.id != null ? item.id : `edu-${index}`;
                    const isActive = editingId != null && String(item.id) === String(editingId);
                    const isCourse = item.educationType === 'COURSE'
                        || item.educationKind === 'course';
                    const title = (item.institutionName || item.institution || '').trim()
                        || (isCourse ? 'Онлайн-курс' : 'Учебное заведение');
                    const period = formatEducationPeriod(item);
                    const direction = String(item.direction || item.courseName || '').trim();
                    const level = String(item.educationLevel || '').trim();
                    const link = String(item.webUrl || item.courseLink || '').trim();
                    const tag = isCourse ? 'Онлайн-курс' : (level || 'Гос. образование');

                    return (
                        <article
                            key={itemKey}
                            className={
                                'educationAside__card'
                                + (isCourse
                                    ? ' educationAside__card--green'
                                    : ' educationAside__card--blue')
                                + (isActive ? ' is-active' : '')
                            }
                        >
                            <div className="educationAside__main">
                                <div className="educationAside__meta">
                                    <h3 className="educationAside__title">{title}</h3>
                                    {period ? (
                                        <p className="educationAside__period">{period}</p>
                                    ) : null}
                                </div>

                                <div className="educationAside__body">
                                    {direction ? (
                                        <p className="educationAside__direction">{direction}</p>
                                    ) : null}
                                    {link ? (
                                        <a
                                            className="educationAside__link"
                                            href={link}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                        >
                                            {isCourse ? 'Ссылка на курс' : 'Ссылка на уч. заведение'}
                                        </a>
                                    ) : null}
                                </div>

                                <span className="educationAside__tag">{tag}</span>
                            </div>

                            <div className="educationAside__tools">
                                <button
                                    type="button"
                                    className="educationAside__delete"
                                    aria-label={`Удалить образование: ${title}`}
                                    onClick={() => onDelete?.(item)}
                                >
                                    <TrashIcon />
                                </button>
                                <button
                                    type="button"
                                    className="educationAside__edit"
                                    aria-label={`Редактировать образование: ${title}`}
                                    onClick={() => onEdit?.(item)}
                                >
                                    <img
                                        src={editIcon}
                                        alt=""
                                        className="educationAside__editIcon"
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

export default EducationAside;
