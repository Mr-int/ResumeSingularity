import { useEffect, useRef } from 'react';
import profileStockIco from '../../../../assets/icons/profileStockIco.png';

const MENU_ITEMS = [
    { id: 'account', label: 'Аккаунт' },
    { id: 'students', label: 'Другие студенты' },
    { id: 'bug', label: 'Нашли ошибку?' },
    { id: 'logout', label: 'Выйти', logout: true },
];

const Avatar = ({
    src,
    alt = 'Пользователь',
    onClick,
    onMenuAction,
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
        <div
            ref={rootRef}
            className={
                'studentCreatorHeader__avatarWrap'
                + (expanded ? ' studentCreatorHeader__avatarWrap--expanded' : '')
            }
        >
            <button
                type="button"
                className={
                    'studentCreatorHeader__avatar'
                    + (expanded ? ' studentCreatorHeader__avatar--expanded' : '')
                }
                onClick={() => onClick?.({ type: expanded ? 'collapse' : 'expand' })}
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

            {expanded ? (
                <div className="studentCreatorHeader__avatarMenu" role="menu">
                    {MENU_ITEMS.map((item) => (
                        <button
                            key={item.id}
                            type="button"
                            role="menuitem"
                            className={
                                'studentCreatorHeader__avatarMenuBtn'
                                + (item.logout ? ' studentCreatorHeader__avatarMenuBtn--logout' : '')
                            }
                            onClick={() => onMenuAction?.(item.id)}
                        >
                            {item.label}
                        </button>
                    ))}
                </div>
            ) : null}
        </div>
    );
};

export default Avatar;
