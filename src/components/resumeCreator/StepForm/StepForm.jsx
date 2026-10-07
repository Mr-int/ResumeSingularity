import './stepForm.css';
import starIco from '../../../assets/icons/Star.svg';
import BirthDatePicker from './BirthDatePicker/BirthDatePicker.jsx';
import SpecialtyList from './SpecialtyList/SpecialtyList.jsx';

export const COURSE_OPTIONS = [
    { ui: '1', value: 'FIRST', kind: 'number' },
    { ui: '2', value: 'SECOND', kind: 'number' },
    { ui: '3', value: 'THIRD', kind: 'number' },
    { ui: '4', value: 'FOURTH', kind: 'number' },
    { ui: 'star', value: 'NEW', kind: 'star' },
];

export const courseUiLabel = (course) => {
    const fromOptions = COURSE_OPTIONS.find((item) => item.value === course);
    if (fromOptions?.kind === 'star') return '★';
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
        city = '',
        birthDate = '',
        course = '',
        gender = '',
        specialityId = null,
    } = values;

    if (step === 2) {
        return (
            <section className="stepForm stepForm--specialties">
                <h2>Выбор специальности</h2>
                <SpecialtyList
                    specialties={specialties}
                    specialityId={specialityId}
                    onSpecialtyChange={onSpecialtyChange}
                />
            </section>
        );
    }

    return (
        <section className="stepForm">
            <h2>Основные данные</h2>

            <div className="stepForm__grid">
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
                    <label htmlFor="student-city">Город</label>
                    <input
                        id="student-city"
                        type="text"
                        placeholder="г. Москва"
                        value={city}
                        onChange={(event) => onChange?.('city', event.target.value)}
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
                <div className="stepForm__field">
                    <label htmlFor="student-birth-date">Дата рождения</label>
                    <BirthDatePicker
                        id="student-birth-date"
                        value={birthDate}
                        onChange={(next) => onChange?.('birthDate', next)}
                    />
                </div>
            </div>

            <div className="stepForm__course">
                <p className="stepForm__groupLabel">Номер курса</p>
                <div className="stepForm__courseButtons" role="group" aria-label="Номер курса">
                    {COURSE_OPTIONS.map((item) => {
                        const isActive = course === item.value;
                        return (
                            <button
                                key={item.value}
                                type="button"
                                className={
                                    'stepForm__courseBtn'
                                    + (item.kind === 'star' ? ' stepForm__courseBtn--star' : '')
                                    + (isActive ? ' is-active' : '')
                                }
                                aria-pressed={isActive}
                                aria-label={item.kind === 'star' ? 'Новый курс' : `Курс ${item.ui}`}
                                onClick={() => onCourseChange?.(item.value)}
                            >
                                {item.kind === 'star' ? (
                                    <img
                                        src={starIco}
                                        alt=""
                                        className="stepForm__courseStar"
                                        width={18}
                                        height={17}
                                    />
                                ) : (
                                    item.ui
                                )}
                            </button>
                        );
                    })}
                </div>
            </div>

            <div className="stepForm__gender">
                <p className="stepForm__groupLabel">Пол</p>
                <div className="stepForm__genderButtons" role="group" aria-label="Пол">
                    <button
                        type="button"
                        className={`stepForm__genderBtn ${gender === 'MALE' ? 'is-active' : ''}`}
                        aria-pressed={gender === 'MALE'}
                        onClick={() => onGenderChange?.('MALE')}
                    >
                        Мужской
                    </button>
                    <button
                        type="button"
                        className={`stepForm__genderBtn ${gender === 'FEMALE' ? 'is-active' : ''}`}
                        aria-pressed={gender === 'FEMALE'}
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
