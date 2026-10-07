import './resumeBioForm.css';

const ResumeBioForm = ({
    value = '',
    maxLength = 600,
    onChange,
}) => {
    const length = value.length;
    const isEmpty = length === 0;

    return (
        <section className="resumeBioForm">
            <h2 className="resumeBioForm__title">Заполните описание резюме</h2>
            <p className="resumeBioForm__subtitle">Описание будет находиться в вашем резюме</p>

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
                    <span className={`resumeBioForm__counterCurrent${isEmpty ? ' is-empty' : ''}`}>
                        {length}
                    </span>
                    {` / ${maxLength} симв.`}
                </div>
            </div>
        </section>
    );
};

export default ResumeBioForm;
