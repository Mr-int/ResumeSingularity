import { forwardRef } from 'react';

const NavButton = forwardRef(({
    children,
    active = false,
    disabled = false,
    onClick,
}, ref) => {
    const className = [
        'studentCreatorHeader__navButton',
        active ? 'is-active' : '',
        disabled ? 'is-disabled' : '',
    ].filter(Boolean).join(' ');

    const label = (
        <span className="studentCreatorHeader__navButtonLabel">{children}</span>
    );

    if (disabled) {
        return (
            <span ref={ref} className={className} aria-disabled="true">
                {label}
            </span>
        );
    }

    return (
        <button
            ref={ref}
            type="button"
            className={className}
            onClick={onClick}
        >
            {label}
        </button>
    );
});

NavButton.displayName = 'NavButton';

export default NavButton;
