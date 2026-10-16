import { useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import './header.css';
import Logo from './Logo/Logo.jsx';
import NavButton from './NavButton/NavButton.jsx';
import IconButton from './IconButton/IconButton.jsx';
import Avatar from './Avatar/Avatar.jsx';
import chatsIco from '../../../assets/icons/chatsIco.svg';
import { getImageUrl } from '../../../config/api.js';
import { getRecruiterMe, getStudentMe } from '../../../services/getApi.js';
import { isAuthenticated, logoutServer } from '../../../services/authApi.js';
import { hasStudentProfilePhoto } from '../../../utils/hasStudentProfilePhoto.js';

const NAV_DEFS = [
    { id: 'career', label: 'Центр карьеры', path: '/' },
    { id: 'projects', label: 'Проекты', path: '/#projects' },
    { id: 'resume', label: 'Резюме', path: '/plug' },
    { id: 'vacancies', label: 'Вакансии', path: null },
];

const navIdFromLocation = (pathname, hash) => {
    if (pathname.startsWith('/plug')) return 'resume';
    if (pathname === '/' && hash === '#projects') return 'projects';
    if (
        pathname === '/'
        || pathname.startsWith('/students')
        || pathname.startsWith('/studentsResume')
        || pathname.startsWith('/resume')
        || /^\/profile\/[^/]+/.test(pathname)
    ) {
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
    const [loadedAvatarSrc, setLoadedAvatarSrc] = useState(null);
    const [avatarExpanded, setAvatarExpanded] = useState(false);
    const [profileUser, setProfileUser] = useState({
        firstName: '',
        lastName: '',
        roleLabel: '',
    });

    const currentActive = activeNavIdProp ?? routeActiveId ?? activeNavId;
    const displayAvatarSrc = avatarSrc || loadedAvatarSrc;

    useEffect(() => {
        setAvatarExpanded(false);
        if (!isAuthenticated()) {
            setLoadedAvatarSrc(null);
            setProfileUser({ firstName: '', lastName: '', roleLabel: '' });
            return undefined;
        }

        let cancelled = false;
        const loadAvatar = async () => {
            try {
                const me = await getStudentMe();
                if (cancelled) return;
                setProfileUser({
                    firstName: me.firstName || '',
                    lastName: me.lastName || '',
                    roleLabel: 'Студент',
                });
                if (!avatarSrc && hasStudentProfilePhoto(me)) {
                    setLoadedAvatarSrc(getImageUrl(me.imagePath || me.image || me.photo || me.avatar));
                } else if (!avatarSrc) {
                    setLoadedAvatarSrc(null);
                }
                return;
            } catch {
                /* не студент — пробуем рекрутера */
            }
            try {
                const me = await getRecruiterMe();
                if (cancelled) return;
                setProfileUser({
                    firstName: me.firstName || '',
                    lastName: me.lastName || '',
                    roleLabel: 'Рекрутер',
                });
                if (!avatarSrc) {
                    const path = me?.imagePath || me?.image || me?.photo || me?.avatar;
                    setLoadedAvatarSrc(path ? getImageUrl(path) : null);
                }
            } catch {
                if (!cancelled) {
                    setLoadedAvatarSrc(null);
                    setProfileUser({ firstName: '', lastName: '', roleLabel: '' });
                }
            }
        };

        loadAvatar();
        return () => {
            cancelled = true;
        };
    }, [avatarSrc, location.pathname]);

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

    const handleAvatar = (action) => {
        if (action?.type === 'collapse') {
            setAvatarExpanded(false);
            return;
        }
        if (action?.type === 'expand') {
            setAvatarExpanded(true);
        }
    };

    const handleAvatarMenu = async (actionId) => {
        setAvatarExpanded(false);
        if (actionId === 'account') {
            if (onAvatarClick) {
                onAvatarClick();
                return;
            }
            goAuthed('/profile');
            return;
        }
        if (actionId === 'students') {
            navigate('/students');
            return;
        }
        if (actionId === 'bug') {
            window.location.href = 'mailto:support@resumesingularity.ru?subject=Нашли%20ошибку';
            return;
        }
        if (actionId === 'logout') {
            try {
                await logoutServer();
            } finally {
                navigate('/', { replace: true });
            }
        }
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
                    {isAuthenticated() ? (
                        <>
                            <IconButton ariaLabel="Чаты" onClick={handleMessages}>
                                <img
                                    src={chatsIco}
                                    alt=""
                                    className="studentCreatorHeader__chatsIco"
                                    width={20}
                                    height={18}
                                />
                            </IconButton>
                            <Avatar
                                src={displayAvatarSrc}
                                onClick={handleAvatar}
                                onMenuAction={handleAvatarMenu}
                                alt="Профиль"
                                expanded={avatarExpanded}
                                firstName={profileUser.firstName}
                                lastName={profileUser.lastName}
                                roleLabel={profileUser.roleLabel}
                            />
                        </>
                    ) : (
                        <button
                            type="button"
                            className="studentCreatorHeader__loginBtn"
                            onClick={() => navigate('/login', { state: { from: location.pathname } })}
                        >
                            Войти
                        </button>
                    )}
                </div>
            </div>
        </header>
    );
};

export default Header;
