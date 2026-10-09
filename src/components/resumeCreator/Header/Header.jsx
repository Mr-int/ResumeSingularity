import { useMemo, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import './header.css';
import Logo from './Logo/Logo.jsx';
import NavButton from './NavButton/NavButton.jsx';
import IconButton from './IconButton/IconButton.jsx';
import Avatar from './Avatar/Avatar.jsx';
import chatsIco from '../../../assets/icons/chatsIco.svg';
import { isAuthenticated } from '../../../services/authApi.js';

const NAV_DEFS = [
    { id: 'career', label: 'Центр карьеры', path: '/' },
    { id: 'projects', label: 'Проекты', path: '/#projects' },
    { id: 'resume', label: 'Резюме', path: '/plug' },
    { id: 'vacancies', label: 'Вакансии', path: null },
];

const navIdFromLocation = (pathname, hash) => {
    if (pathname.startsWith('/plug')) return 'resume';
    if (pathname === '/' && hash === '#projects') return 'projects';
    if (pathname === '/' || pathname.startsWith('/students') || pathname.startsWith('/studentsResume')) {
        return 'career';
    }
    return null;
};

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
    const navigate = useNavigate();
    const location = useLocation();
    const routeActiveId = navIdFromLocation(location.pathname, location.hash);
    const [activeNavId, setActiveNavId] = useState(activeNavIdProp || routeActiveId || 'career');

    const currentActive = activeNavIdProp ?? routeActiveId ?? activeNavId;

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

    const goAuthed = (path) => {
        if (isAuthenticated()) {
            navigate(path);
            return;
        }
        navigate('/login', { state: { from: path } });
    };

    const defaultNavigate = (item) => {
        if (item.id === 'career') {
            navigate('/');
            return;
        }
        if (item.id === 'projects') {
            if (location.pathname === '/') {
                const el = document.getElementById('projects');
                if (el) {
                    el.scrollIntoView({ behavior: 'smooth' });
                    return;
                }
            }
            navigate('/#projects');
            return;
        }
        if (item.id === 'resume') {
            goAuthed('/plug');
        }
    };

    const handleNavClick = (event, item) => {
        if (item.disabled) {
            event.preventDefault();
            return;
        }
        if (activeNavIdProp == null) {
            setActiveNavId(item.id);
        }
        onNavChange?.(item.id);
        if (item.onClick) {
            item.onClick(event);
            return;
        }
        defaultNavigate(item);
    };

    const handleMessages = () => {
        if (onMessagesClick) {
            onMessagesClick();
            return;
        }
        goAuthed('/chats');
    };

    const handleAvatar = () => {
        if (onAvatarClick) {
            onAvatarClick();
            return;
        }
        goAuthed('/settings');
    };

    return (
        <header className="studentCreatorHeader">
            <div className="studentCreatorHeader__inner">
                <Logo />

                <nav className="studentCreatorHeader__nav">
                    {items.map((item) => (
                        <NavButton
                            key={item.id}
                            active={item.active}
                            disabled={item.disabled}
                            onClick={(event) => handleNavClick(event, item)}
                        >
                            {item.label}
                        </NavButton>
                    ))}
                </nav>

                <div className="studentCreatorHeader__actions">
                    <IconButton ariaLabel="Чаты" onClick={handleMessages}>
                        <img
                            src={chatsIco}
                            alt=""
                            className="studentCreatorHeader__chatsIco"
                            width={20}
                            height={18}
                        />
                    </IconButton>
                    <Avatar src={avatarSrc} onClick={handleAvatar} alt="Профиль" />
                </div>
            </div>
        </header>
    );
};

export default Header;
