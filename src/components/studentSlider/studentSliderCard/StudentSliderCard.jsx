import React from "react";
import './studentSliderCard.css';
import test from "../../../assets/other/test.png";
import javaIcon from "../../../assets/other/java.png";
import pythonIcon from "../../../assets/other/python.png";
import designIcon from "../../../assets/other/design.png";
import course4 from "../../../assets/other/course4.png";
import course3 from "../../../assets/other/thirdCourse.png";
import course2 from "../../../assets/other/secondCourse.png";

const StudentSliderCard = ({ student, isActive, onClick }) => {
    if (!student) {
        return null;
    }

    const fullName = `${student.firstName || ''} ${student.lastName || ''}`.trim() || 'Имя не указано';

    const getStudentImageUrl = (studentData) => {
        if (!studentData) return test;

        const imagePath = studentData.imagePath || studentData.image || studentData.photo;

        if (!imagePath) return test;

        if (imagePath.startsWith('http')) {
            return imagePath;
        }

        const baseUrl = 'https://api.singularity-resume.ru/main/photo';
        const studentId = studentData.id;

        if (!studentId) return test;

        return `${baseUrl}/${studentId}.jpg`;
    };

    const getCourseImage = (course) => {
        switch (course) {
            case 'FIRST':
            case '1':
                return course2;
            case 'SECOND':
            case '2':
                return course2;
            case 'THIRD':
            case '3':
                return course3;
            case 'FOURTH':
            case '4':
                return course4;
            default:
                return course4;
        }
    };

    const getCourseText = (course) => {
        const courseMap = {
            'FIRST': '1 курс',
            'SECOND': '2 курс',
            'THIRD': '3 курс',
            'FOURTH': '4 курс',
            '1': '1 курс',
            '2': '2 курс',
            '3': '3 курс',
            '4': '4 курс',
        };
        return courseMap[course] || 'курс';
    };

    const getSkillIcon = (specialityId) => {
        // Маппинг ID специальностей на иконки
        switch (specialityId) {
            case 1: // Java-разработчик
                return javaIcon;
            case 3: // Графический дизайнер
                return designIcon;
            case 4: // Веб-разработчик
                return designIcon; // Можно использовать designIcon или создать отдельную для веба
            case 6: // Аналитик данных
                return pythonIcon;
            case 7: // Python-разработчик
                return pythonIcon;
            case 2: // Менеджер проектов
                return designIcon; // Временное решение - используем designIcon
            case 9: // Тестировщик
                return javaIcon; // Временное решение - используем javaIcon
            default:
                return javaIcon; // Иконка по умолчанию
        }
    };

    const imageSrc = getStudentImageUrl(student);
    const courseImage = getCourseImage(student.course);
    const skillIcon = getSkillIcon(student.specialityId);

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

                <div className="student-slider-card__course">
                    <img src={courseImage} className="student-slider-card__courseIco" alt="Иконка курса"/>
                    {isActive && <span>{getCourseText(student.course)}</span>}
                </div>

                {student.specialityId && (
                    <div className="student-slider-card__extraIco">
                        <img src={skillIcon} alt={`Иконка специальности: ${student.speciality || 'специальность'}`}/>
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