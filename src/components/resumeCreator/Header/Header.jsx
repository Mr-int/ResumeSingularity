import { useMemo, useState } from 'react';
import './header.css';
import Logo from './Logo/Logo.jsx';
import NavButton from './NavButton/NavButton.jsx';
import IconButton from './IconButton/IconButton.jsx';
import Avatar from './Avatar/Avatar.jsx';
import chatsIco from '../../../assets/icons/chatsIco.svg';

const NAV_DEFS = [
    { id: 'career', label: 'Центр карьеры' },
    { id: 'projects', label: 'Проекты' },
    { id: 'resume', label: 'Резюме' },
    { id: 'vacancies', label: 'Вакансии' },
];

const Header = ({
    navItems,
    activeNavId: activeNavIdProp,
    onNavChange,
    /** Вакансии доступны только когда резюме заполнено до конца */
    resumeComplete = false,
    onMessagesClick,
    onAvatarClick,
    avatarSrc,
}) => {
    const [activeNavId, setActiveNavId] = useState(activeNavIdProp || 'career');

    const currentActive = activeNavIdProp ?? activeNavId;

    const items = useMemo(() => {
        const source = navItems || NAV_DEFS;
        return source.map((item) => {
            const isVacancies = item.id === 'vacancies';
            const disabled = isVacancies
                ? !resumeComplete
                : Boolean(item.disabled);
            return {
                ...item,
                active: item.id === currentActive,
                disabled,
            };
        });
    }, [navItems, currentActive, resumeComplete]);

    const handleNavClick = (event, item) => {
        if (item.disabled) {
            event.preventDefault();
            return;
        }
        if (!item.href || item.href === '#') {
            event.preventDefault();
        }
        if (activeNavIdProp == null) {
            setActiveNavId(item.id);
        }
        onNavChange?.(item.id);
        item.onClick?.(event);
    };

    return (
        <header className="studentCreatorHeader">
            <div className="studentCreatorHeader__inner">
                <Logo />

                <nav className="studentCreatorHeader__nav">
                    {items.map((item) => (
                        <NavButton
                            key={item.id}
                            href={item.href}
                            active={item.active}
                            disabled={item.disabled}
                            onClick={(event) => handleNavClick(event, item)}
                        >
                            {item.label}
                        </NavButton>
                    ))}
                </nav>

                <div className="studentCreatorHeader__actions">
                    <IconButton ariaLabel="Сообщения" onClick={onMessagesClick}>
                        <img
                            src={chatsIco}
                            alt=""
                            className="studentCreatorHeader__chatsIco"
                            width={20}
                            height={18}
                        />
                    </IconButton>
                    <Avatar src={avatarSrc} onClick={onAvatarClick} />
                </div>
            </div>
        </header>
    );
};

export default Header;
