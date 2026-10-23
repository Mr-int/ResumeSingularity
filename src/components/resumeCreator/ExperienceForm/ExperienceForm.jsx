import BirthDatePicker from '../StepForm/BirthDatePicker/BirthDatePicker.jsx';
import './experienceForm.css';

const EXPERIENCE_MIN_YEAR = new Date().getFullYear() - 60;
const EXPERIENCE_MAX_YEAR = new Date().getFullYear();

const ExperienceForm = ({
    values = {},
    companies = [],
    editingId = null,
    onChange,
    onAdd,
    onUpdate,
    onCancelEdit,
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
    const isProject = selectedKind === 'project';
    const companyPlaceholder = isProject ? 'Название проекта' : 'Название организации';
    const companyUrlPlaceholder = isProject
        ? 'Ссылка на проект (необязательно)'
        : 'Ссылка на организацию (необязательно)';

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

            <div className="experienceForm__field">
                <input
                    id="experience-company"
                    type="text"
                    list={isProject ? undefined : 'experience-company-list'}
                    value={companyName}
                    placeholder={companyPlaceholder}
                    autoComplete="off"
                    aria-label={companyPlaceholder}
                    onChange={(event) => handleCompanyChange(event.target.value)}
                />
                {!isProject ? (
                    <datalist id="experience-company-list">
                        {companies.map((item) => (
                            <option key={item.id} value={item.name} />
                        ))}
                    </datalist>
                ) : null}
            </div>

            <div className="experienceForm__field">
                <input
                    id="experience-company-url"
                    type="url"
                    value={companyUrl}
                    placeholder={companyUrlPlaceholder}
                    autoComplete="off"
                    aria-label={companyUrlPlaceholder}
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
