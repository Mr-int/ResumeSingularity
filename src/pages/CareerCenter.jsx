import { useNavigate } from 'react-router-dom';
import Header from '../components/header/Header.jsx';
import convertImg from '../assets/other/convert.jpg';
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
                    <img
                        src={convertImg}
                        alt=""
                        className="careerCenter__image"
                        width={683}
                        height={384}
                    />

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
                                    <svg width="24" height="24" viewBox="0 0 24 24" fill="#fff">
                                        <circle cx="12" cy="12" r="10" fill="none" stroke="#fff" strokeWidth="2" />
                                        <circle cx="9" cy="10" r="2" />
                                        <circle cx="15" cy="10" r="2" />
                                        <path
                                            d="M8 16s1.5 2 4 2 4-2 4-2"
                                            stroke="#fff"
                                            strokeWidth="2"
                                            strokeLinecap="round"
                                            fill="none"
                                        />
                                    </svg>
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
