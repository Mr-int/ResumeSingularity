import './stepperFooter.css';

const StepperFooter = ({
    currentStep = 1,
    totalSteps = 8,
    onBack,
    onNext,
    onSkip,
    onSave,
    nextDisabled = false,
    nextHidden = false,
    showSkip = false,
    hideBack = false,
}) => {
    return (
        <div className="stepperFooter">
            <div className="stepperFooter__progress">
                {Array.from({ length: totalSteps }, (_, index) => (
                    <div
                        key={index}
                        className={`stepperFooter__step ${index < currentStep ? 'is-active' : ''}`}
                    />
                ))}
            </div>

            <div className="stepperFooter__bar">
                <div>
                    <h3 className="stepperFooter__infoTitle">Шаг {currentStep} из {totalSteps}</h3>
                    <button type="button" className="stepperFooter__infoHint" onClick={onSave}>
                        Сохранить прогресс
                    </button>
                </div>

                <div className="stepperFooter__actions">
                    {!hideBack && (
                        <button type="button" className="stepperFooter__nav stepperFooter__nav--back" onClick={onBack}>
                            Назад
                        </button>
                    )}
                    {showSkip ? (
                        <button type="button" className="stepperFooter__nav stepperFooter__nav--skip" onClick={onSkip}>
                            Пропустить
                        </button>
                    ) : null}
                    {!nextHidden && (
                        <button
                            type="button"
                            className="stepperFooter__nav stepperFooter__nav--next"
                            onClick={onNext}
                            disabled={nextDisabled}
                        >
                            Далее
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
};

export default StepperFooter;
