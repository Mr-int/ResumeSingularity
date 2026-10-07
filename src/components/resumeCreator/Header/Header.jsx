import './header.css';
import Logo from './Logo/Logo.jsx';
import NavButton from './NavButton/NavButton.jsx';
import IconButton from './IconButton/IconButton.jsx';
import Avatar from './Avatar/Avatar.jsx';
import chatsIco from '../../../assets/icons/chatsIco.svg';

const DEFAULT_NAV_ITEMS = [
    { id: 'career', label: 'Центр карьеры', active: true },
    { id: 'projects', label: 'Проекты' },
    { id: 'resume', label: 'Резюме' },
    { id: 'vacancies', label: 'Вакансии', disabled: true },
];

const Header = ({
    navItems = DEFAULT_NAV_ITEMS,
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
