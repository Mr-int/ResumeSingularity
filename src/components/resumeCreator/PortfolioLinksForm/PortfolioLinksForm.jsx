import whiteFolder from '../../../assets/folders/white_folder.png';
import linkIcon from '../../../assets/icons/link-outlined.svg';
import './portfolioLinksForm.css';

const PortfolioLinksForm = ({
    name = '',
    description = '',
    link = '',
    submitLabel = 'Сохранить',
    disabled = false,
    onChange,
    onSubmit,
}) => {
    const patch = (field, value) => onChange?.({ [field]: value });

    const submitOnEnter = (event) => {
        if (event.key !== 'Enter' || event.shiftKey) return;
        event.preventDefault();
        if (!disabled) onSubmit?.();
    };

    return (
        <section className="portfolioLinks">
            <h2 className="portfolioLinks__title">Прикрепите ссылки к портфолио</h2>

            <div className="portfolioLinks__box">
                <div className="portfolioLinks__row">
                    <div className="portfolioLinks__folder">
                        <img
                            className="portfolioLinks__folderImg"
                            src={whiteFolder}
                            alt=""
                            width={228}
                            height={146}
                        />
                        <div className="portfolioLinks__folderFields">
                            <input
                                className="portfolioLinks__name"
                                type="text"
                                value={name}
                                placeholder="Введите название..."
                                aria-label="Название"
                                autoComplete="off"
                                disabled={disabled}
                                onChange={(event) => patch('name', event.target.value)}
                                onKeyDown={submitOnEnter}
                            />
                            <input
                                className="portfolioLinks__description"
                                type="text"
                                value={description}
                                placeholder="Описание..."
                                aria-label="Описание"
                                autoComplete="off"
                                disabled={disabled}
                                onChange={(event) => patch('description', event.target.value)}
                                onKeyDown={submitOnEnter}
                            />
                        </div>
                    </div>

                    <label className="portfolioLinks__link">
                        <textarea
                            className="portfolioLinks__linkInput"
                            value={link}
                            placeholder="Ссылка на материал..."
                            aria-label="Ссылка на материал"
                            disabled={disabled}
                            onChange={(event) => patch('link', event.target.value)}
                            onKeyDown={submitOnEnter}
                        />
                        <img src={linkIcon} alt="" />
                    </label>
                </div>

                <button
                    type="button"
                    className="portfolioLinks__submit"
                    disabled={disabled}
                    onClick={() => onSubmit?.()}
                >
                    {submitLabel}
                </button>
            </div>
        </section>
    );
};

export default PortfolioLinksForm;
