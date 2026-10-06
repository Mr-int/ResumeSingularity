import './experienceForm.css';

const ExperienceForm = ({
    values = {},
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
                    <input
                        id="experience-start"
                        type="date"
                        value={startDate}
                        onChange={(event) => onChange?.('startDate', event.target.value)}
                    />
                </div>
                <div className="experienceForm__field">
                    <label htmlFor="experience-end">Окончание</label>
                    <input
                        id="experience-end"
                        type="date"
                        value={endDate}
                        onChange={(event) => onChange?.('endDate', event.target.value)}
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
