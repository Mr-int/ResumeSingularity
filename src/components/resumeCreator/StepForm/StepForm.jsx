import './stepForm.css';

export const COURSE_OPTIONS = [
    { ui: '1', value: 'FIRST' },
    { ui: '2', value: 'SECOND' },
    { ui: '3', value: 'THIRD' },
    { ui: '4', value: 'FOURTH' },
];

export const courseUiLabel = (course) => {
    const fromOptions = COURSE_OPTIONS.find((item) => item.value === course);
    if (fromOptions) return fromOptions.ui;
    if (course === 'FIFTH') return '5';
    return course || '';
};

const StepForm = ({
    step = 1,
    values = {},
    specialties = [],
    onChange,
    onCourseChange,
    onGenderChange,
    onSpecialtyChange,
}) => {
    const {
        firstName = '',
        lastName = '',
        city = 'г. Москва',
        birthDate = '',
        course = 'FIRST',
        gender = 'MALE',
        specialityId = null,
    } = values;

    if (step === 2) {
        return (
            <section className="stepForm">
                <h2>Выбор специальности</h2>
                <div className="stepForm__specialtyList">
                    {specialties.map((item) => {
                        const id = item?.id;
                        const name = item?.name || '';
                        const isActive = specialityId != null && String(specialityId) === String(id);

                        return (
                            <button
                                key={id}
                                type="button"
                                className={`stepForm__specialtyItem ${isActive ? 'is-active' : ''}`}
                                onClick={() => onSpecialtyChange?.(id)}
                            >
                                {name}
                            </button>
                        );
                    })}
                </div>
            </section>
        );
    }

    return (
        <section className="stepForm">
            <h2>Основные данные</h2>

            <div className="stepForm__row">
                <div className="stepForm__field">
                    <label htmlFor="student-first-name">Имя</label>
                    <input
                        id="student-first-name"
                        type="text"
                        placeholder="Введите имя"
                        value={firstName}
                        onChange={(event) => onChange?.('firstName', event.target.value)}
                    />
                </div>
                <div className="stepForm__field">
                    <label htmlFor="student-last-name">Фамилия</label>
                    <input
                        id="student-last-name"
                        type="text"
                        placeholder="Введите фамилию"
                        value={lastName}
                        onChange={(event) => onChange?.('lastName', event.target.value)}
                    />
                </div>
            </div>

            <div className="stepForm__row">
                <div className="stepForm__field">
                    <label htmlFor="student-city">Город</label>
                    <input
                        id="student-city"
                        type="text"
                        value={city}
                        onChange={(event) => onChange?.('city', event.target.value)}
                    />
                </div>
                <div className="stepForm__field">
                    <label htmlFor="student-birth-date">Дата рождения</label>
                    <input
                        id="student-birth-date"
                        type="date"
                        value={birthDate}
                        onChange={(event) => onChange?.('birthDate', event.target.value)}
                    />
                </div>
            </div>

            <div className="stepForm__course">
                <p className="stepForm__groupLabel">Номер курса</p>
                <div className="stepForm__courseButtons">
                    {COURSE_OPTIONS.map((item) => (
                        <button
                            key={item.value}
                            type="button"
                            className={`stepForm__courseBtn ${course === item.value ? 'is-active' : ''}`}
                            onClick={() => onCourseChange?.(item.value)}
                        >
                            {item.ui}
                        </button>
                    ))}
                </div>
            </div>

            <div>
                <p className="stepForm__groupLabel">Пол</p>
                <div className="stepForm__genderButtons">
                    <button
                        type="button"
                        className={`stepForm__genderBtn ${gender === 'MALE' ? 'is-active' : ''}`}
                        onClick={() => onGenderChange?.('MALE')}
                    >
                        Мужской
                    </button>
                    <button
                        type="button"
                        className={`stepForm__genderBtn ${gender === 'FEMALE' ? 'is-active' : ''}`}
                        onClick={() => onGenderChange?.('FEMALE')}
                    >
                        Женский
                    </button>
                </div>
            </div>
        </section>
    );
};

export default StepForm;
