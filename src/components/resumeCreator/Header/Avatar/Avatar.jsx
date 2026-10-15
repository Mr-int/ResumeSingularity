import { useEffect, useRef } from 'react';
import profileStockIco from '../../../../assets/icons/profileStockIco.png';

const Avatar = ({
    src,
    alt = 'Пользователь',
    onClick,
    expanded = false,
    firstName = '',
    lastName = '',
    roleLabel = '',
}) => {
    const rootRef = useRef(null);
    const displayName = [firstName, lastName].filter(Boolean).join(' ').trim() || 'Пользователь';

    useEffect(() => {
        if (!expanded) return undefined;
        const onDocPointer = (event) => {
            if (!rootRef.current?.contains(event.target)) {
                onClick?.({ type: 'collapse' });
            }
        };
        document.addEventListener('pointerdown', onDocPointer);
        return () => document.removeEventListener('pointerdown', onDocPointer);
    }, [expanded, onClick]);

    return (
        <button
            ref={rootRef}
            type="button"
            className={
                'studentCreatorHeader__avatar'
                + (expanded ? ' studentCreatorHeader__avatar--expanded' : '')
            }
            onClick={() => onClick?.({ type: expanded ? 'open' : 'expand' })}
            aria-label={alt}
            aria-expanded={expanded}
        >
            {expanded ? (
                <span className="studentCreatorHeader__avatarMeta">
                    <span className="studentCreatorHeader__avatarName">{displayName}</span>
                    {roleLabel ? (
                        <span className="studentCreatorHeader__avatarRole">{roleLabel}</span>
                    ) : null}
                </span>
            ) : null}
            <img
                src={src || profileStockIco}
                alt={alt}
                className={
                    'studentCreatorHeader__avatarImg'
                    + (src ? ' studentCreatorHeader__avatarImg--custom' : '')
                }
                width={42}
                height={42}
            />
        </button>
    );
};

export default Avatar;
