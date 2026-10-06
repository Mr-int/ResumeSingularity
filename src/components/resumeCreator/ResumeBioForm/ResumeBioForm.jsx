import './resumeBioForm.css';

const ResumeBioForm = ({
    value = '',
    maxLength = 2000,
    onChange,
}) => {
    return (
        <section className="resumeBioForm">
            <h2>Описание резюме</h2>
            <div className="resumeBioForm__field">
                <label htmlFor="student-bio">Обо мне</label>
                <textarea
                    id="student-bio"
                    value={value}
                    maxLength={maxLength}
                    placeholder="Расскажите о себе, интересах и целях"
                    onChange={(event) => onChange?.(event.target.value)}
                />
                <span className="resumeBioForm__counter">{value.length} / {maxLength}</span>
            </div>
        </section>
    );
};

export default ResumeBioForm;
