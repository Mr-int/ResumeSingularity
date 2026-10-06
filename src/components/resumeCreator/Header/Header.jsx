import './header.css';
import Logo from './Logo/Logo.jsx';
import NavButton from './NavButton/NavButton.jsx';
import SearchInput from './SearchInput/SearchInput.jsx';
import IconButton from './IconButton/IconButton.jsx';
import Avatar from './Avatar/Avatar.jsx';

const DEFAULT_NAV_ITEMS = [
    { id: 'career', label: 'Центр карьеры', active: true },
    { id: 'projects', label: 'Проекты' },
    { id: 'resume', label: 'Резюме' },
    { id: 'vacancies', label: 'Вакансии', disabled: true },
];

const ChatIcon = () => (
    <svg width="22" height="20" viewBox="0 0 22 20" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M19 0H3C1.35 0 0 1.35 0 3V13C0 14.65 1.35 16 3 16H16L21.3 19.53C21.5 19.67 21.75 19.7 21.95 19.6C22.15 19.5 22.25 19.3 22.25 19.07V3C22 1.35 20.65 0 19 0ZM19 14H15.17L12 16.12L3 14V3H19V14Z" fill="currentColor" />
    </svg>
);

const Header = ({
    navItems = DEFAULT_NAV_ITEMS,
    searchValue = '',
    onSearchChange,
    onMessagesClick,
    onAvatarClick,
    avatarSrc,
}) => {
    return (
        <header className="studentCreatorHeader">
            <div className="studentCreatorHeader__inner">
                <Logo />

                <nav className="studentCreatorHeader__nav">
                    {navItems.map((item) => (
                        <NavButton
                            key={item.id}
                            href={item.href}
                            active={item.active}
                            disabled={item.disabled}
                            onClick={item.onClick}
                        >
                            {item.label}
                        </NavButton>
                    ))}
                </nav>

                <div className="studentCreatorHeader__actions">
                    <SearchInput value={searchValue} onChange={onSearchChange} />
                    <IconButton ariaLabel="Сообщения" onClick={onMessagesClick}>
                        <ChatIcon />
                    </IconButton>
                    <Avatar src={avatarSrc} onClick={onAvatarClick} />
                </div>
            </div>
        </header>
    );
};

export default Header;
