import { useNavigate } from 'react-router-dom';
import Header from '../components/header/Header.jsx';
import convertImg from '../assets/other/convert.jpg';
import resumatorImg from '../assets/other/resumator.jpg';
import './careerCenter.css';

/**
 * Новая заглушка «Центр карьеры».
 * Старый лендинг — pages/Home.jsx (не удалять; используется для /#projects).
 */
const CareerCenter = () => {
    const navigate = useNavigate();

    return (
        <div className="careerCenter">
            <Header />
            <main className="careerCenter__main">
                <div className="careerCenter__stage">
                    <div className="careerCenter__letter">
                        <h2 className="careerCenter__letterTitle">Моё резюме</h2>
                        <div
                            className="careerCenter__image"
                            style={{ backgroundImage: `url(${convertImg})` }}
                        >
                            <p className="careerCenter__imageText">
                                Создай своё резюме
                                <br />
                                что бы начать поиск вакансий
                            </p>
                            <button
                                type="button"
                                className="careerCenter__imageBtn"
                                onClick={() => navigate('/plug')}
                            >
                                Создать
                            </button>
                        </div>
                    </div>

                    <div className="careerCenter__messages">
                        <div className="careerCenter__messagesHead">
                            <h2 className="careerCenter__messagesTitle">Сообщения</h2>
                            <svg
                                className="careerCenter__messagesIcon"
                                viewBox="0 0 24 24"
                                aria-hidden="true"
                            >
                                <path d="M20 2H4c-1.1 0-1.99.9-1.99 2L2 22l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm-2 12H6v-2h12v2zm0-3H6V9h12v2zm0-3H6V6h12v2z" />
                            </svg>
                        </div>

                        <div className="careerCenter__messagesCard">
                            <div className="careerCenter__messagesBadge">+1 новых</div>

                            <button
                                type="button"
                                className="careerCenter__messageItem"
                                onClick={() => navigate('/chats')}
                            >
                                <div className="careerCenter__messageAvatar" aria-hidden="true">
                                    <img
                                        src={resumatorImg}
                                        alt=""
                                        className="careerCenter__messageAvatarImg"
                                        width={40}
                                        height={40}
                                    />
                                </div>
                                <div className="careerCenter__messageBody">
                                    <h3 className="careerCenter__messageAuthor">Резюматор</h3>
                                    <p className="careerCenter__messageText">
                                        Привет! Я твой помощник в Центре карьеры, для начала надо создать ...
                                    </p>
                                </div>
                                <div className="careerCenter__messageMeta">
                                    <span className="careerCenter__messageTime">Сейчас</span>
                                    <span className="careerCenter__messageCount">1</span>
                                </div>
                            </button>

                            <div className="careerCenter__messagesEmpty">
                                Больше нет новых сообщений
                            </div>

                            <button
                                type="button"
                                className="careerCenter__messagesOpen"
                                onClick={() => navigate('/chats')}
                            >
                                Открыть
                            </button>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
};

export default CareerCenter;
