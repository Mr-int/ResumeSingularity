import { Link } from 'react-router-dom';
import NewResumeLogo from '../../../../assets/logos/NewResumeLogo.svg';

const Logo = ({ to = '/' }) => {
    return (
        <Link to={to} className="studentCreatorHeader__logo">
            <img
                src={NewResumeLogo}
                alt="Сингулярити резюме"
                className="studentCreatorHeader__logoShape"
                width={95}
                height={30}
            />
            <span className="studentCreatorHeader__logoText">
                <span>сингулярити</span>
                <span>резюме</span>
            </span>
        </Link>
    );
};

export default Logo;
