import React from "react";
import './studentSliderCard.css';
import test from "../../../assets/other/test.png"
import javaIcon from "../../../assets/other/java.png"
import course4 from "../../../assets/other/course4.png";
import { getImageUrl } from "../../../config/api.js";

const StudentSliderCard = ({ student, isActive, onClick }) => {
    if (!student) {
        return null;
    }

    const fullName = `${student.firstName || ''} ${student.lastName || ''}`.trim() || 'Имя не указано';
    const imagePath = student.imagePath || student.image;
    const imageSrc = imagePath ? getImageUrl(imagePath) : test;
    
    // Определяем курс из поля course (FIRST, SECOND, THIRD, FOURTH и т.д.)
    const getCourseText = (course) => {
        const courseMap = {
            'FIRST': '1 курс',
            'SECOND': '2 курс',
            'THIRD': '3 курс',
            'FOURTH': '4 курс',
        };
        return courseMap[course] || 'курс';
    };

    const handleClick = (e) => {
        if (onClick) {
            onClick(e);
        }
    };

    return (
        <div
            className={`student-slider-card ${isActive ? 'student-slider-card--active' : ''}`}
            onClick={handleClick}
            style={{ cursor: onClick ? 'pointer' : 'default' }}
        >
            <div className="student-slider-card__photoWrapper">
                <img src={imageSrc} alt={`Фото ${fullName}`} className="student-slider-card__photo"/>

                {isActive && (
                    <div className="student-slider-card__course">
                        <img src={course4} className="student-slider-card__courseIco" alt=""/>
                        <span>{getCourseText(student.course)}</span>
                    </div>
                )}

                {student.skills && student.skills.length > 0 && (
                    <div className="student-slider-card__extraIco">
                        <img src={javaIcon} alt=""/>
                    </div>
                )}
            </div>

            <div className="student-slider-card__text">
                <div className="student-slider-card__name">
                    {fullName}
                </div>

                <div className="student-slider-card__job">
                    {student.speciality || 'Специальность не указана'}
                </div>
            </div>
        </div>
    )
}

export default StudentSliderCard;