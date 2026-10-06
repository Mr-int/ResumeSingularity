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
        <a href={href} className={className} onClick={onClick}>
            {children}
        </a>
    );
};

export default NavButton;
