import './resumeBioForm.css';

const ResumeBioForm = ({
    value = '',
    maxLength = 2000,
    minLength = 30,
    hhLink = '',
    portfolioName = '',
    portfolioLink = '',
    onChange,
    onHhLinkChange,
    onPortfolioNameChange,
    onPortfolioLinkChange,
}) => {
    const length = value.length;
    const isEmpty = length === 0;
    const tooShort = length > 0 && length < minLength;

    return (
        <section className="resumeBioForm">
            <h2 className="resumeBioForm__title">Заполните описание резюме</h2>
            <p className="resumeBioForm__subtitle">
                «О себе» — не короче {minLength} символов. Нужна ссылка на HH или работа в портфолио.
            </p>

            <div className="resumeBioForm__box">
                <label className="resumeBioForm__label" htmlFor="student-bio">
                    Обо мне
                </label>
                <textarea
                    id="student-bio"
                    className="resumeBioForm__textarea"
                    value={value}
                    maxLength={maxLength}
                    placeholder="Я python-разработчик с опытом работы в..."
                    onChange={(event) => onChange?.(event.target.value)}
                />
                <div className="resumeBioForm__counter">
                    <span
                        className={
                            `resumeBioForm__counterCurrent${isEmpty || tooShort ? ' is-empty' : ''}`
                        }
                    >
                        {length}
                    </span>
                    {` / ${maxLength} симв. (мин. ${minLength})`}
                </div>
            </div>

            <div className="resumeBioForm__extra">
                <div className="resumeBioForm__field">
                    <label htmlFor="student-hh" className="resumeBioForm__label">
                        Ссылка на HH (или портфолио ниже)
                    </label>
                    <input
                        id="student-hh"
                        type="url"
                        className="resumeBioForm__input"
                        placeholder="https://hh.ru/resume/…"
                        value={hhLink}
                        onChange={(e) => onHhLinkChange?.(e.target.value)}
                    />
                </div>
                <div className="resumeBioForm__field">
                    <label htmlFor="student-portfolio-name" className="resumeBioForm__label">
                        Название работы в портфолио
                    </label>
                    <input
                        id="student-portfolio-name"
                        type="text"
                        className="resumeBioForm__input"
                        placeholder="Учебный проект"
                        value={portfolioName}
                        onChange={(e) => onPortfolioNameChange?.(e.target.value)}
                    />
                </div>
                <div className="resumeBioForm__field">
                    <label htmlFor="student-portfolio-link" className="resumeBioForm__label">
                        Ссылка на работу
                    </label>
                    <input
                        id="student-portfolio-link"
                        type="url"
                        className="resumeBioForm__input"
                        placeholder="https://…"
                        value={portfolioLink}
                        onChange={(e) => onPortfolioLinkChange?.(e.target.value)}
                    />
                </div>
            </div>
        </section>
    );
};

export default ResumeBioForm;
