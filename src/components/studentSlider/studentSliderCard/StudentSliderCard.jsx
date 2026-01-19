import React from "react";
import './studentSliderCard.css';
import test from "../../../assets/other/test.png";
import javaIcon from "../../../assets/other/java.png";
import pythonIcon from "../../../assets/other/python.png";
import designIcon from "../../../assets/other/design.png";
import analyticsIcon from "../../../assets/other/analytics.png";
import testingIcon from "../../../assets/other/testing.png";
import managerIcon from "../../../assets/other/manager.png";
import course4 from "../../../assets/other/course4.png";
import course3 from "../../../assets/other/thirdCourse.png";
import course2 from "../../../assets/other/secondCourse.png";

const StudentSliderCard = ({ student, isActive, onClick }) => {
    if (!student) {
        return null;
    }

    console.log('СТУДЕНТ ДАННЫЕ:', student);
    console.log('Название специальности:', student.speciality);

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

    const getSkillIcon = (specialityName) => {
        if (!specialityName) {
            console.log('Нет названия специальности, выбрана Java иконка (по умолчанию)');
            return javaIcon;
        }

        const specLower = specialityName.toLowerCase();
        console.log('Выбор иконки для специальности:', specialityName);

        if (specLower.includes('java') || specLower.includes('джава')) {
            console.log('Выбрана Java иконка');
            return javaIcon;
        }

        if (specLower.includes('python') || specLower.includes('питон')) {
            console.log('Выбрана Python иконка');
            return pythonIcon;
        }

        if (specLower.includes('аналитик данных') || specLower.includes('аналитик') || specLower.includes('analytics')) {
            console.log('Выбрана Analytics иконка');
            return analyticsIcon;
        }

        if (specLower.includes('тестировщик') || specLower.includes('qa') || specLower.includes('testing')) {
            console.log('Выбрана Testing иконка');
            return testingIcon;
        }

        if (specLower.includes('менеджер проектов') || specLower.includes('project manager') || specLower.includes('менеджер')) {
            console.log('Выбрана Manager иконка');
            return managerIcon;
        }

        if (specLower.includes('дизайнер') || specLower.includes('design') ||
            specLower.includes('веб-разработчик') || specLower.includes('web') ||
            specLower.includes('таргетолог') || specLower.includes('target')) {
            console.log('Выбрана Design иконка');
            return designIcon;
        }

        console.log('Выбрана Java иконка (по умолчанию)');
        return javaIcon;
    };

    const imageSrc = getStudentImageUrl(student);
    const courseImage = getCourseImage(student.course);
    const skillIcon = getSkillIcon(student.speciality);
    const specialityName = student.speciality || 'Специальность не указана';

    console.log('Выбранная иконка:', skillIcon);
    console.log('Название специальности для отображения:', specialityName);

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
                    <img src={courseImage} className="student-slider-card__courseIco" alt=""/>
                    {isActive && <span>{getCourseText(student.course)}</span>}
                </div>

                <div className="student-slider-card__extraIco">
                    <img src={skillIcon} alt=""/>
                </div>
            </div>

            <div className="student-slider-card__text">
                <div className="student-slider-card__name">
                    {fullName}
                </div>

                <div className="student-slider-card__job">
                    {specialityName}
                </div>
            </div>
        </div>
    )
}

export default StudentSliderCard;