import BirthDatePicker from '../StepForm/BirthDatePicker/BirthDatePicker.jsx';
import './experienceForm.css';

const EXPERIENCE_MIN_YEAR = new Date().getFullYear() - 60;
const EXPERIENCE_MAX_YEAR = new Date().getFullYear();

const formatDateLabel = (value) => {
    if (!value) return 'н.в.';
    if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return value;
    const [y, m, d] = value.split('-');
    return `${d}.${m}.${y}`;
};

const ExperienceForm = ({
    values = {},
    items = [],
    companies = [],
    editingId = null,
    onChange,
    onAdd,
    onUpdate,
    onSelectItem,
    onCancelEdit,
    onDelete,
}) => {
    const {
        companyId = '',
        companyName = '',
        companyUrl = '',
        position = '',
        startDate = '',
        endDate = '',
        additionalInfo = '',
        activityKind = 'work',
    } = values;

    const isEditing = editingId != null && editingId !== '';
    const selectedKind = activityKind === 'project' ? 'project' : 'work';

    const handleCompanyChange = (raw) => {
        const nextName = raw;
        const match = companies.find(
            (item) => (item?.name || '').trim().toLowerCase() === nextName.trim().toLowerCase(),
        );
        onChange?.({
            companyName: nextName,
            companyId: match?.id != null ? String(match.id) : '',
        });
    };

    const buildEntry = () => ({
        id: editingId || undefined,
        companyId: companyId || undefined,
        companyName: companyName.trim(),
        companyUrl: companyUrl.trim(),
        position: position.trim(),
        additionalInfo,
        startDate,
        endDate: endDate || undefined,
        activityKind: selectedKind,
    });

    const handleSubmit = () => {
        const entry = buildEntry();
        if (isEditing) {
            onUpdate?.(entry);
            return;
        }
        onAdd?.(entry);
    };

    return (
        <section className="experienceForm">
            <h2>Добавьте опыт работы или проект</h2>

            <div
                className={`experienceForm__kind experienceForm__kind--${selectedKind}`}
                role="group"
                aria-label="Тип записи"
            >
                <span className="experienceForm__kindThumb" aria-hidden="true" />
                <button
                    type="button"
                    className={
                        'experienceForm__kindBtn'
                        + (selectedKind === 'work' ? ' is-active' : '')
                    }
                    aria-pressed={selectedKind === 'work'}
                    onClick={() => onChange?.({ activityKind: 'work' })}
                >
                    Опыт работы
                </button>
                <button
                    type="button"
                    className={
                        'experienceForm__kindBtn'
                        + (selectedKind === 'project' ? ' is-active' : '')
                    }
                    aria-pressed={selectedKind === 'project'}
                    onClick={() => onChange?.({ activityKind: 'project' })}
                >
                    Проектная деятельность
                </button>
            </div>

            {items.length > 0 ? (
                <ul className="experienceForm__list">
                    {items.map((item) => {
                        const itemKey = item.id || `${item.position}-${item.startDate}`;
                        const isActive = isEditing && String(item.id) === String(editingId);
                        return (
                            <li key={itemKey} className="experienceForm__listRow">
                                <button
                                    type="button"
                                    className={
                                        'experienceForm__listItem'
                                        + (isActive ? ' experienceForm__listItem--active' : '')
                                    }
                                    onClick={() => onSelectItem?.(item)}
                                >
                                    <div className="experienceForm__listItemTop">
                                        <span className="experienceForm__listTitle">
                                            {item.position || 'Должность'}
                                        </span>
                                        <span className="experienceForm__listEditHint">
                                            {isActive ? 'Редактируется' : 'Изменить'}
                                        </span>
                                    </div>
                                    {item.companyName ? (
                                        <div className="experienceForm__listCompany">
                                            {item.companyName}
                                        </div>
                                    ) : null}
                                    <div className="experienceForm__listDates">
                                        {formatDateLabel(item.startDate)}
                                        {' — '}
                                        {formatDateLabel(item.endDate)}
                                    </div>
                                    {item.additionalInfo ? (
                                        <p className="experienceForm__listDesc">
                                            {item.additionalInfo}
                                        </p>
                                    ) : null}
                                </button>
                                <button
                                    type="button"
                                    className="experienceForm__listDelete"
                                    aria-label={`Удалить опыт: ${item.position || 'запись'}`}
                                    onClick={(event) => {
                                        event.stopPropagation();
                                        onDelete?.(item);
                                    }}
                                >
                                    Удалить
                                </button>
                            </li>
                        );
                    })}
                </ul>
            ) : null}

            <div className="experienceForm__field">
                <input
                    id="experience-company"
                    type="text"
                    list="experience-company-list"
                    value={companyName}
                    placeholder="Название организации"
                    autoComplete="off"
                    aria-label="Название организации"
                    onChange={(event) => handleCompanyChange(event.target.value)}
                />
                <datalist id="experience-company-list">
                    {companies.map((item) => (
                        <option key={item.id} value={item.name} />
                    ))}
                </datalist>
            </div>

            <div className="experienceForm__field">
                <input
                    id="experience-company-url"
                    type="url"
                    value={companyUrl}
                    placeholder="Ссылка на организацию (необязательно)"
                    autoComplete="off"
                    aria-label="Ссылка на организацию"
                    onChange={(event) => onChange?.({ companyUrl: event.target.value })}
                />
            </div>

            <div className="experienceForm__field">
                <input
                    id="experience-position"
                    type="text"
                    value={position}
                    placeholder="Роль"
                    aria-label="Роль"
                    onChange={(event) => onChange?.({ position: event.target.value })}
                />
            </div>

            <div className="experienceForm__row">
                <div className="experienceForm__field">
                    <BirthDatePicker
                        id="experience-start"
                        value={startDate}
                        placeholder="Начало работы"
                        minYear={EXPERIENCE_MIN_YEAR}
                        maxYear={EXPERIENCE_MAX_YEAR}
                        maxDate={endDate || undefined}
                        ariaLabel="Дата начала работы"
                        onChange={(next) => {
                            onChange?.({ startDate: next });
                            if (endDate && next && endDate < next) {
                                onChange?.({ endDate: '' });
                            }
                        }}
                    />
                </div>
                <div className="experienceForm__field">
                    <BirthDatePicker
                        id="experience-end"
                        value={endDate}
                        placeholder="Окончание"
                        minYear={EXPERIENCE_MIN_YEAR}
                        maxYear={EXPERIENCE_MAX_YEAR}
                        minDate={startDate || undefined}
                        ariaLabel="Дата окончания работы"
                        onChange={(next) => onChange?.({ endDate: next })}
                    />
                </div>
            </div>

            <div className="experienceForm__field">
                <textarea
                    id="experience-description"
                    value={additionalInfo}
                    placeholder="Описание результата работы и выших задач"
                    aria-label="Описание"
                    onChange={(event) => onChange?.({ additionalInfo: event.target.value })}
                />
            </div>

            <div className="experienceForm__actions">
                <button type="button" className="experienceForm__add" onClick={handleSubmit}>
                    {isEditing ? 'Сохранить' : 'Добавить'}
                </button>
                {isEditing ? (
                    <button
                        type="button"
                        className="experienceForm__cancel"
                        onClick={() => onCancelEdit?.()}
                    >
                        Отмена
                    </button>
                ) : null}
            </div>
        </section>
    );
};

export default ExperienceForm;
