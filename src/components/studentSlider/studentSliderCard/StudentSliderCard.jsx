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

    const getSkillIcon = (specialityName) => {
        if (!specialityName) {
            return javaIcon;
        }

        const specLower = specialityName.toLowerCase();

        if (specLower.includes('java') || specLower.includes('джава')) {
            return javaIcon;
        }

        if (specLower.includes('python') || specLower.includes('питон')) {
            return pythonIcon;
        }

        if (specLower.includes('аналитик данных') || specLower.includes('аналитик') || specLower.includes('analytics')) {
            return analyticsIcon;
        }

        if (specLower.includes('тестировщик') || specLower.includes('qa') || specLower.includes('testing')) {
            return testingIcon;
        }

        if (specLower.includes('менеджер проектов') || specLower.includes('project manager') || specLower.includes('менеджер')) {
            return managerIcon;
        }

        if (specLower.includes('дизайнер') || specLower.includes('design') ||
            specLower.includes('веб-разработчик') || specLower.includes('web') ||
            specLower.includes('таргетолог') || specLower.includes('target')) {
            return designIcon;
        }

        return javaIcon;
    };

    const getExtraIcoGradientModifier = (specialityName) => {
        if (!specialityName) return '';
        const specLower = specialityName.toLowerCase();
        if (specLower.includes('менеджер проектов') || specLower.includes('project manager') || specLower.includes('менеджер')) {
            return 'student-slider-card__extraIco--manager';
        }
        if (specLower.includes('дизайнер') || specLower.includes('design') ||
            specLower.includes('веб-разработчик') || specLower.includes('web') ||
            specLower.includes('графический')) {
            return 'student-slider-card__extraIco--designer';
        }
        return '';
    };

    const imageSrc = getStudentImageUrl(student);
    const courseImage = getCourseImage(student.course);
    const skillIcon = getSkillIcon(student.speciality);
    const specialityName = student.speciality || 'Специальность не указана';
    const extraIcoModifier = getExtraIcoGradientModifier(student.speciality);

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
                    {isActive && (
                        <span className="student-slider-card__courseText">
                            курс
                        </span>
                    )}
                </div>

                <div className={`student-slider-card__extraIco ${extraIcoModifier}`}>
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