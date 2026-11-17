import { useNavigate } from 'react-router-dom';
import Header from '../components/header/Header.jsx';
import convertImg from '../assets/other/convert.jpg';
import dogRepairmanImg from '../assets/other/dog-repairman.png';
import '../components/projects/projects.css';
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
                                onClick={() => navigate('/resume/create')}
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
                            <div className="projects__wip careerCenter__wip">
                                <img
                                    className="projects__wipImg"
                                    src={dogRepairmanImg}
                                    alt=""
                                    width={180}
                                    height={180}
                                />
                                <p className="projects__wipText">не грусти собачка, страница в разработке</p>
                            </div>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
};

export default CareerCenter;
