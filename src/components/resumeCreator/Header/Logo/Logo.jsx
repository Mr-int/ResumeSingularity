import NewResumeLogo from '../../../../assets/logos/NewResumeLogo.svg';

const Logo = ({ href = '#' }) => {
    return (
        <a href={href} className="studentCreatorHeader__logo">
            <img
                src={NewResumeLogo}
                alt=""
                className="studentCreatorHeader__logoShape"
                width={95}
                height={30}
            />
            <span className="studentCreatorHeader__logoText">
                <span>сингулярити</span>
                <span>резюме</span>
            </span>
        </a>
    );
};

export default Logo;
