const Logo = ({ href = '#' }) => {
    return (
        <a href={href} className="studentCreatorHeader__logo">
            <span className="studentCreatorHeader__logoShape" />
            <span className="studentCreatorHeader__logoText">
                <span>сингулярити</span>
                <span>резюме</span>
            </span>
        </a>
    );
};

export default Logo;
