import './stepperFooter.css';
import stepArrowIcon from '../../../assets/icons/step_arrow.svg';

const StepperFooter = ({
    currentStep = 1,
    totalSteps = 8,
    maxReachableStep = 1,
    onBack,
    onNext,
    onSkip,
    onSave,
    onStepSelect,
    nextDisabled = false,
    nextHidden = false,
    showSkip = false,
    hideBack = false,
    title = 'Оформление карточки',
}) => {
    const canGoBack = !hideBack && currentStep > 1;
    const reachable = Math.max(1, Math.min(totalSteps, maxReachableStep || currentStep));

    const handleStepClick = (stepNumber) => {
        if (stepNumber === currentStep) return;
        if (stepNumber > reachable) return;
        onStepSelect?.(stepNumber);
    };

    return (
        <div className="stepperFooter">
            <div className="stepperFooter__progress" role="tablist" aria-label="Прогресс шагов">
                {Array.from({ length: totalSteps }, (_, index) => {
                    const stepNumber = index + 1;
                    const isActive = index < currentStep;
                    const isCurrent = stepNumber === currentStep;
                    const isReachable = stepNumber <= reachable;

                    return (
                        <button
                            key={stepNumber}
                            type="button"
                            role="tab"
                            aria-selected={isCurrent}
                            aria-label={`Шаг ${stepNumber}`}
                            aria-disabled={!isReachable}
                            disabled={!isReachable}
                            className={
                                'stepperFooter__step'
                                + (isActive ? ' is-active' : '')
                                + (isCurrent ? ' is-current' : '')
                                + (isReachable ? ' is-reachable' : '')
                            }
                            onClick={() => handleStepClick(stepNumber)}
                        >
                            {isReachable ? (
                                <span className="stepperFooter__stepHint" aria-hidden="true">
                                    <span className="stepperFooter__stepHintText">Шаг {stepNumber}</span>
                                    <img
                                        src={stepArrowIcon}
                                        alt=""
                                        className="stepperFooter__stepHintArrow"
                                        width={12}
                                        height={8}
                                    />
                                </span>
                            ) : null}
                        </button>
                    );
                })}
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
