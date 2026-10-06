import './educationForm.css';

const DEFAULT_UNIVERSITIES = ['Сингулярити', 'Другой вуз'];
const DEFAULT_COURSES = ['1', '2', '3', '4'];

const EducationForm = ({
    values = {},
    universities = DEFAULT_UNIVERSITIES,
    courses = DEFAULT_COURSES,
    onChange,
    onAdd,
}) => {
    const {
        university = '',
        course = '',
        startDate = '',
        endDate = '',
        link = '',
    } = values;

    return (
        <section className="educationForm">
            <h2>Образование</h2>

            <div className="educationForm__field">
                <label htmlFor="education-university">Вуз</label>
                <select
                    id="education-university"
                    value={university}
                    onChange={(event) => onChange?.('university', event.target.value)}
                >
                    <option value="">Выберите вуз</option>
                    {universities.map((item) => (
                        <option key={item} value={item}>{item}</option>
                    ))}
                </select>
            </div>

            <div className="educationForm__field">
                <label htmlFor="education-course">Курс</label>
                <select
                    id="education-course"
                    value={course}
                    onChange={(event) => onChange?.('course', event.target.value)}
                >
                    <option value="">Выберите курс</option>
                    {courses.map((item) => (
                        <option key={item} value={item}>{item}</option>
                    ))}
                </select>
            </div>

            <div className="educationForm__row">
                <div className="educationForm__field">
                    <label htmlFor="education-start">Начало</label>
                    <input
                        id="education-start"
                        type="month"
                        value={startDate}
                        onChange={(event) => onChange?.('startDate', event.target.value)}
                    />
                </div>
                <div className="educationForm__field">
                    <label htmlFor="education-end">Окончание</label>
                    <input
                        id="education-end"
                        type="month"
                        value={endDate}
                        onChange={(event) => onChange?.('endDate', event.target.value)}
                    />
                </div>
            </div>

            <div className="educationForm__field">
                <label htmlFor="education-link">Ссылка</label>
                <input
                    id="education-link"
                    type="url"
                    value={link}
                    placeholder="https://"
                    onChange={(event) => onChange?.('link', event.target.value)}
                />
            </div>

            <button type="button" className="educationForm__add" onClick={onAdd}>
                Добавить
            </button>
        </section>
    );
};

export default EducationForm;
