import React, { useState } from 'react';
import './registerModal.css';
import BackIcon from '../../assets/icons/vectorAuth.svg';
import LogoImage from '../../assets/logos/resume_logo_mini.png';
import StudentImage from '../../assets/other/student.png';
import RecruiterImage from '../../assets/other/recruiter.png';

const RegisterModal = ({ onBack, onSelectRole }) => {
    const [selectedRole, setSelectedRole] = useState(null);

    const handleContinue = () => {
        if (selectedRole) {
            onSelectRole(selectedRole);
        }
    };

    return (
        <div className="registerModal__overlay">
            <div className="registerModal__card">
                <button
                    type="button"
                    className="registerModal__backBtn"
                    onClick={onBack}
                    aria-label="Назад"
                >
                    <img 
                        src={BackIcon} 
                        alt="Назад" 
                        className="registerModal__backIcon"
                    />
                </button>

                <div className="registerModal__logoWrap">
                    <img 
                        src={LogoImage} 
                        alt="Resume Singularity" 
                        className="registerModal__logoImage"
                    />
                </div>

                <h2 className="registerModal__heading">Регистрация</h2>
                <p className="registerModal__subheading">Кем вы являетесь?</p>

                <div className="registerModal__roleButtons">
                    <button 
                        type="button"
                        className={`registerModal__roleBtn ${selectedRole === 'recruiter' ? 'registerModal__roleBtn--active' : ''}`}
                        onClick={() => setSelectedRole('recruiter')}
                    >
                        <div className="registerModal__roleImageWrap">
                            <img 
                                src={RecruiterImage} 
                                alt="Работодатель" 
                                className="registerModal__roleImage"
                            />
                        </div>
                        <div className="registerModal__roleText">
                            <span className="registerModal__roleTitle">Работодатель</span>
                            <span className="registerModal__roleDesc">Я ищу сотрудников</span>
                        </div>
                    </button>
                    
                    <button 
                        type="button"
                        className={`registerModal__roleBtn ${selectedRole === 'student' ? 'registerModal__roleBtn--active' : ''}`}
                        onClick={() => setSelectedRole('student')}
                    >
                        <div className="registerModal__roleImageWrap">
                            <img 
                                src={StudentImage} 
                                alt="Студент" 
                                className="registerModal__roleImage"
                            />
                        </div>
                        <div className="registerModal__roleText">
                            <span className="registerModal__roleTitle">Студент</span>
                            <span className="registerModal__roleDesc">Я хочу найти работу</span>
                        </div>
                    </button>
                </div>

                <button 
                    type="button" 
                    className="registerModal__primaryBtn"
                    onClick={handleContinue}
                    disabled={!selectedRole}
                >
                    Зарегистрироваться
                </button>

                <button 
                    type="button" 
                    className="registerModal__linkBtn"
                    onClick={onBack}
                >
                    У меня уже есть аккаунт
                </button>
            </div>
        </div>
    );
};

export default RegisterModal;