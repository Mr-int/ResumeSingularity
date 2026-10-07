import './educationForm.css';

const EducationForm = ({
    values = {},
    educations = [],
    onChange,
    onAdd,
}) => {
    const {
        educationId = '',
        institutionName = '',
        startYear = '',
        endYear = '',
    } = values;

    const handleUniversityChange = (raw) => {
        const nextName = raw;
        const match = educations.find(
            (item) => (item?.institution || '').trim().toLowerCase() === nextName.trim().toLowerCase(),
        );
        onChange?.({
            institutionName: nextName,
            educationId: match?.id != null ? String(match.id) : '',
        });
    };

    const handleAdd = () => {
        const name = institutionName.trim();
        onAdd?.({
            educationId: educationId === '' ? undefined : Number(educationId),
            institutionName: name,
            startYear: startYear === '' ? undefined : Number(startYear),
            endYear: endYear === '' ? undefined : Number(endYear),
        });
    };

    return (
        <section className="educationForm">
            <h2>Образование</h2>

            <div className="educationForm__field">
                <label htmlFor="education-university">Вуз</label>
                <input
                    id="education-university"
                    type="text"
                    list="education-university-list"
                    value={institutionName}
                    placeholder="Начните вводить или выберите из списка"
                    autoComplete="off"
                    onChange={(event) => handleUniversityChange(event.target.value)}
                />
                <datalist id="education-university-list">
                    {educations.map((item) => (
                        <option key={item.id} value={item.institution} />
                    ))}
                </datalist>
                <p className="educationForm__hint">Можно выбрать из списка или вписать свой вуз</p>
            </div>

            <div className="educationForm__row">
                <div className="educationForm__field">
                    <label htmlFor="education-start">Год начала</label>
                    <input
                        id="education-start"
                        type="number"
                        min="1900"
                        max="2100"
                        value={startYear}
                        onChange={(event) => onChange?.({ startYear: event.target.value })}
                    />
                </div>
                <div className="educationForm__field">
                    <label htmlFor="education-end">Год окончания</label>
                    <input
                        id="education-end"
                        type="number"
                        min="1900"
                        max="2100"
                        value={endYear}
                        onChange={(event) => onChange?.({ endYear: event.target.value })}
                    />
                </div>
            </div>

            <button type="button" className="educationForm__add" onClick={handleAdd}>
                Добавить
            </button>
        </section>
    );
};

export default EducationForm;
