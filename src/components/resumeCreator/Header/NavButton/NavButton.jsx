const NavButton = ({
    children,
    href = '#',
    active = false,
    disabled = false,
    onClick,
}) => {
    const className = [
        'studentCreatorHeader__navButton',
        active ? 'is-active' : '',
        disabled ? 'is-disabled' : '',
    ].filter(Boolean).join(' ');

    if (disabled) {
        return (
            <span className={className} aria-disabled="true">
                {children}
            </span>
        );
    }

    return (
        <button type="button" className={className} onClick={onClick}>
            {children}
        </button>
    );
};

export default NavButton;
