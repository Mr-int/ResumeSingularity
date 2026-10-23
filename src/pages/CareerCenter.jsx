import Header from '../components/header/Header.jsx';
import convertImg from '../assets/other/convert.jpg';
import './careerCenter.css';

/**
 * Новая заглушка «Центр карьеры».
 * Старый лендинг — pages/Home.jsx (не удалять; используется для /#projects).
 */
const CareerCenter = () => (
    <div className="careerCenter">
        <Header />
        <main className="careerCenter__main">
            <img
                src={convertImg}
                alt=""
                className="careerCenter__image"
            />
        </main>
    </div>
);

export default CareerCenter;
