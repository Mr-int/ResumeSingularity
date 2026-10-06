import './educationForm.css';

const EducationForm = ({
    values = {},
    educations = [],
    onChange,
    onAdd,
}) => {
    const {
        educationId = '',
        startYear = '',
        endYear = '',
    } = values;

    const handleAdd = () => {
        onAdd?.({
            educationId: educationId === '' ? undefined : Number(educationId),
            startYear: startYear === '' ? undefined : Number(startYear),
            endYear: endYear === '' ? undefined : Number(endYear),
        });
    };

    return (
        <section className="educationForm">
            <h2>Образование</h2>

            <div className="educationForm__field">
                <label htmlFor="education-university">Вуз</label>
                <select
                    id="education-university"
                    value={educationId}
                    onChange={(event) => onChange?.('educationId', event.target.value)}
                >
                    <option value="">Выберите вуз</option>
                    {educations.map((item) => (
                        <option key={item.id} value={item.id}>
                            {item.institution}
                        </option>
                    ))}
                </select>
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
                        onChange={(event) => onChange?.('startYear', event.target.value)}
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
                        onChange={(event) => onChange?.('endYear', event.target.value)}
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
