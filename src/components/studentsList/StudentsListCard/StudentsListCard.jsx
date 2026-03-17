import React, { useState } from "react";
const PLACEHOLDER_AVATAR = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='200' height='200' viewBox='0 0 200 200'%3E%3Ccircle fill='%23444' cx='100' cy='100' r='100'/%3E%3Ccircle fill='%23666' cx='100' cy='82' r='28'/%3E%3Cellipse fill='%23666' cx='100' cy='165' rx='45' ry='38'/%3E%3C/svg%3E";
import { Link } from "react-router-dom";
import './studentsListCard.css';

const StudentsListCard = ({ student }) => {
    const [showFullBio, setShowFullBio] = useState(false);

    if (!student) {
        return null;
    }

    const getStudentImageUrl = (studentData) => {
        if (!studentData) return PLACEHOLDER_AVATAR;

        const imagePath = studentData.imagePath || studentData.image || studentData.photo;

        if (!imagePath) return PLACEHOLDER_AVATAR;

        if (imagePath.startsWith('http')) {
            return imagePath;
        }

        const baseUrl = 'https://api.singularity-resume.ru/main/photo';
        const studentId = studentData.id;

        if (!studentId) return PLACEHOLDER_AVATAR;

        return `${baseUrl}/${studentId}.jpg`;
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

    const fullName = `${student.firstName || ''} ${student.lastName || ''}`.trim() || 'Имя не указано';
    const imageSrc = getStudentImageUrl(student);
    const courseNumber = getCourseNumber(student.course);

    // ~3 строки в блоке описания (line-clamp: 3, ~70–80 символов на строку)
    const MAX_BIO_PREVIEW_LENGTH = 220;

    const truncateAtWord = (text, maxLen) => {
        if (!text || text.length <= maxLen) return text;
        const truncated = text.substring(0, maxLen);
        const lastSpace = truncated.lastIndexOf(' ');
        const cutIndex = lastSpace > 0 ? lastSpace : maxLen;
        let result = text.substring(0, cutIndex).trim();
        // убираем запятую и др. в конце
        result = result.replace(/[,\s;:]+$/, '').trim();
        // убираем точки в конце — перед ссылкой будут ровно три точки
        result = result.replace(/\.+$/, '').trim();
        return result;
    };

    const isBioTruncated = student.bio && student.bio.length > MAX_BIO_PREVIEW_LENGTH;
    const bioPreview = student.bio
        ? (isBioTruncated && !showFullBio
            ? truncateAtWord(student.bio, MAX_BIO_PREVIEW_LENGTH)
            : student.bio)
        : 'Описание отсутствует';

    const maxVisibleSkills = 5;
    const showAllIfOneRemaining = student.skills && student.skills.length === maxVisibleSkills + 1; // 6 скиллов — показываем все
    const skills = student.skills && student.skills.length > 0
        ? student.skills.slice(0, showAllIfOneRemaining ? student.skills.length : maxVisibleSkills)
        : [{ id: 1, name: 'Навыки не указаны' }];
    const hasMoreSkills = student.skills && student.skills.length > maxVisibleSkills && !showAllIfOneRemaining;

    return (
        <div className="studentsCard">
            <img className="studentsCard__image" src={imageSrc} alt={`Фото ${fullName}`} />
            <div className="studentsCard__content">
                <div className="studentsCard__header">
                    <h2 className="studentsCard__title">
                        {fullName}
                        <span className={`studentsCard__courseBadge studentsCard__courseBadge--${courseNumber}`}>{courseNumber}</span>
                    </h2>
                    <p className="studentsCard__subtitle">{student.speciality || 'Специальность не указана'}</p>
                </div>

                <div className="studentsCard__skills">
                    {skills.map((skill) => (
                        <span key={skill.id} className="skill-tag">{skill.name}</span>
                    ))}
                    {hasMoreSkills && (
                        <span className="skill-more">... и еще ({student.skills.length - maxVisibleSkills})</span>
                    )}
                </div>

                <div className="studentsCard__description">
                    <p>
                        {bioPreview}
                        {isBioTruncated && !showFullBio && (
                            <span className="studentsCard__read-more">
                                {' ... '}
                                <Link to={`/studentsResume/${student.id}`} className="read-more-link">Читать дальше</Link>
                            </span>
                        )}
                    </p>
                </div>

                <Link to={`/studentsResume/${student.id}`} className="studentsCard__button">
                    <span className="studentsCard__buttonText">Смотреть резюме</span>
                </Link>
            </div>
        </div>
    )
}

export default StudentsListCard;