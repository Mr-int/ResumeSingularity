import React from "react";
import './studentSliderCard.css';
import { getImageUrl } from '../../../config/api.js';
import SpecialityBadge from '../../common/SpecialityBadge.jsx';

const PLACEHOLDER_AVATAR = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='200' height='200' viewBox='0 0 200 200'%3E%3Ccircle fill='%23444' cx='100' cy='100' r='100'/%3E%3Ccircle fill='%23666' cx='100' cy='82' r='28'/%3E%3Cellipse fill='%23666' cx='100' cy='165' rx='45' ry='38'/%3E%3C/svg%3E";

const StudentSliderCard = ({ student, isActive, onClick }) => {
    if (!student) {
        return null;
    }

    const fullName = `${student.firstName || ''} ${student.lastName || ''}`.trim() || 'Имя не указано';

    const getStudentImageUrl = (studentData) => {
        if (!studentData) return PLACEHOLDER_AVATAR;

        const imagePath = studentData.imagePath || studentData.image || studentData.photo;

        if (!imagePath) return PLACEHOLDER_AVATAR;

        return getImageUrl(imagePath) || PLACEHOLDER_AVATAR;
    };

    const getCourseNumber = (course) => {
        switch (course) {
            case 'FIRST':
            case '1':
                return '1';
            case 'SECOND':
            case '2':
                return '2';
            case 'THIRD':
            case '3':
                return '3';
            case 'FOURTH':
            case '4':
                return '4';
            default:
                return '4';
        }
    };

    const getExtraIcoGradientModifier = (specialityName) => {
        if (!specialityName) return '';
        const specLower = specialityName.toLowerCase();
        if (specLower.includes('менеджер проектов') || specLower.includes('project manager') || specLower.includes('менеджер')) {
            return 'student-slider-card__extraIco--manager';
        }
        if (specLower.includes('маркетолог') || specLower.includes('marketing')) {
            return 'student-slider-card__extraIco--marketing';
        }
        if (specLower.includes('тестировщик') || specLower.includes('qa') || specLower.includes('testing')) {
            return 'student-slider-card__extraIco--tester';
        }
        if (specLower.includes('веб-разработчик') || specLower.includes('web')) {
            return 'student-slider-card__extraIco--web';
        }
        if (specLower.includes('java') || specLower.includes('джава')) {
            return 'student-slider-card__extraIco--java';
        }
        if (specLower.includes('python') || specLower.includes('питон') || specLower.includes('pyhton')) {
            return 'student-slider-card__extraIco--python';
        }
        if (specLower.includes('дизайнер') || specLower.includes('design') ||
            specLower.includes('графический')) {
            return 'student-slider-card__extraIco--designer';
        }
        if (specLower.includes('аналитик данных') || specLower.includes('аналитик') || specLower.includes('analytics')) {
            return 'student-slider-card__extraIco--analyst';
        }
        return '';
    };

    const imageSrc = getStudentImageUrl(student);
    const courseNumber = getCourseNumber(student.course);
    const specialityName = student.speciality || 'Специальность не указана';
    const extraIcoModifier = getExtraIcoGradientModifier(specialityName);
    const specialityForBadge = {
        name: specialityName,
        icon_path: student.specialityIconPath ?? student.speciality_icon_path ?? student.iconPath,
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

                <div className="student-slider-card__course">
                    <span className={`student-slider-card__courseBadge student-slider-card__courseBadge--${courseNumber}`}>{courseNumber}</span>
                    {isActive && (
                        <span className="student-slider-card__courseText">
                            курс
                        </span>
                    )}
                </div>

                <div className={`student-slider-card__extraIco ${extraIcoModifier}`}>
                    <SpecialityBadge speciality={specialityForBadge} />
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
