const IconButton = ({
    ariaLabel,
    onClick,
    children,
}) => {
    return (
        <button
            type="button"
            className="studentCreatorHeader__iconButton"
            aria-label={ariaLabel}
            onClick={onClick}
        >
            {children}
        </button>
    );
};

export default IconButton;
