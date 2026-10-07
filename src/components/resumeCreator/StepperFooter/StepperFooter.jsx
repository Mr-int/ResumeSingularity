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
    title = 'Оформление карточки',
}) => {
    const canGoBack = !hideBack && currentStep > 1;

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
                <div className="stepperFooter__lead">
                    <div className="stepperFooter__copy">
                        <p className="stepperFooter__subtitle">{title}</p>
                        <p className="stepperFooter__stepLabel">
                            Шаг {currentStep} из {totalSteps}
                        </p>
                    </div>
                    <button
                        type="button"
                        className="stepperFooter__saveProgress"
                        onClick={onSave}
                    >
                        Сохранить прогресс
                    </button>
                </div>

                <div className="stepperFooter__actions">
                    {canGoBack ? (
                        <button
                            type="button"
                            className="stepperFooter__nav stepperFooter__nav--back"
                            onClick={onBack}
                        >
                            Назад
                        </button>
                    ) : null}
                    {showSkip ? (
                        <button
                            type="button"
                            className="stepperFooter__nav stepperFooter__nav--skip"
                            onClick={onSkip}
                        >
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
