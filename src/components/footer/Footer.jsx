import './footer.css';

import resumeFooter from "../../assets/logos/resume.png";
import resumeLogo from '../../assets/logos/Logo.png';
import singularityLogo from '../../assets/logos/singularityLogo.svg';
import skyEngLogo from '../../assets/logos/skyEngLogo.svg';

const Footer = () => {
    return (
        <footer className="footer">
            <div className="footer__image">
                <img src={resumeFooter} alt="resume" />
            </div>

            <div className="footer__nav">
                <div className='footer__siteMap'>
                    <h2>Навигация</h2>
                    <button>Главная</button>
                    <button>Студенты</button>
                    <button>Обучение</button>
                    <button>Проекты</button>
                </div>

                <div className='footer__contacts'>
                    <div className="footer__number">
                        <h2>Телефон</h2>
                        <p>+7 (123) 456-78-90</p>
                    </div>

                    <div className="footer__mail">
                        <h2>Почта</h2>
                        <p>singularityresume@gmail.com</p>
                    </div>

                    <div className="footer__credit">
                        <p>© 2025 Singularity Resume</p>
                    </div>
                </div>

                <div className='footer__partners'>
                    <img src={resumeLogo} alt="Партнер 1" />
                    <img src={singularityLogo} alt="Партнер 2" />
                    <img src={skyEngLogo} alt="Партнер 3" />
                </div>
            </div>
        </footer>
    )
}

export default Footer;