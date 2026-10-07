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
    onChange,
    onAdd,
}) => {
    const {
        companyId = '',
        companyName = '',
        position = '',
        startDate = '',
        endDate = '',
        additionalInfo = '',
    } = values;

    const handleAdd = () => {
        onAdd?.({
            companyId: companyId || undefined,
            companyName: companyName.trim(),
            position: position.trim(),
            additionalInfo,
            startDate,
            endDate: endDate || undefined,
        });
    };

    return (
        <section className="experienceForm">
            <h2>Опыт работы</h2>

            {items.length > 0 ? (
                <ul className="experienceForm__list">
                    {items.map((item) => (
                        <li key={item.id || `${item.position}-${item.startDate}`} className="experienceForm__listItem">
                            <div className="experienceForm__listTitle">
                                {item.position || 'Должность'}
                                {item.companyName ? ` · ${item.companyName}` : ''}
                            </div>
                            <div className="experienceForm__listDates">
                                {formatDateLabel(item.startDate)}
                                {' — '}
                                {formatDateLabel(item.endDate)}
                            </div>
                        </li>
                    ))}
                </ul>
            ) : null}

            <div className="experienceForm__field">
                <label htmlFor="experience-company">Компания</label>
                <input
                    id="experience-company"
                    type="text"
                    value={companyName}
                    placeholder="Название компании"
                    onChange={(event) => onChange?.('companyName', event.target.value)}
                />
            </div>

            <div className="experienceForm__field">
                <label htmlFor="experience-position">Должность</label>
                <input
                    id="experience-position"
                    type="text"
                    value={position}
                    placeholder="Ваша роль"
                    onChange={(event) => onChange?.('position', event.target.value)}
                />
            </div>

            <div className="experienceForm__row">
                <div className="experienceForm__field">
                    <label htmlFor="experience-start">Начало</label>
                    <BirthDatePicker
                        id="experience-start"
                        value={startDate}
                        placeholder="ДД.ММ.ГГГГ"
                        minYear={EXPERIENCE_MIN_YEAR}
                        maxYear={EXPERIENCE_MAX_YEAR}
                        maxDate={endDate || undefined}
                        ariaLabel="Дата начала работы"
                        onChange={(next) => {
                            onChange?.('startDate', next);
                            if (endDate && next && endDate < next) {
                                onChange?.('endDate', '');
                            }
                        }}
                    />
                </div>
                <div className="experienceForm__field">
                    <label htmlFor="experience-end">Окончание</label>
                    <BirthDatePicker
                        id="experience-end"
                        value={endDate}
                        placeholder="ДД.ММ.ГГГГ"
                        minYear={EXPERIENCE_MIN_YEAR}
                        maxYear={EXPERIENCE_MAX_YEAR}
                        minDate={startDate || undefined}
                        ariaLabel="Дата окончания работы"
                        onChange={(next) => onChange?.('endDate', next)}
                    />
                </div>
            </div>

            <div className="experienceForm__field">
                <label htmlFor="experience-description">Описание</label>
                <textarea
                    id="experience-description"
                    rows="4"
                    value={additionalInfo}
                    placeholder="Что вы делали и какого результата достигли"
                    onChange={(event) => onChange?.('additionalInfo', event.target.value)}
                />
            </div>

            <button type="button" className="experienceForm__add" onClick={handleAdd}>
                Добавить
            </button>
        </section>
    );
};

export default ExperienceForm;
