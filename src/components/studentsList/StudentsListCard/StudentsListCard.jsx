import React, { useState } from "react";
import test from "../../../assets/other/test.png";
import { Link } from "react-router-dom";
import './studentsListCard.css';
import course4 from "../../../assets/other/course4.png";
import { getImageUrl } from "../../../config/api.js";

const StudentsListCard = ({ student }) => {
    const [showFullBio, setShowFullBio] = useState(false);

    if (!student) {
        return null;
    }

    const fullName = `${student.firstName || ''} ${student.lastName || ''}`.trim() || 'Имя не указано';
    const imagePath = student.imagePath || student.image;
    const imageSrc = imagePath ? getImageUrl(imagePath) : test;

    const isBioTruncated = student.bio && student.bio.length > 150;
    const bioPreview = student.bio
        ? (isBioTruncated && !showFullBio
            ? student.bio.substring(0, 150) + '...'
            : student.bio)
        : 'Описание отсутствует';

    const skills = student.skills && student.skills.length > 0
        ? student.skills.slice(0, 4)
        : [{ id: 1, name: 'Навыки не указаны' }];
    const hasMoreSkills = student.skills && student.skills.length > 4;

    return (
        <div className="studentsCard">
            <img className="studentsCard__image" src={imageSrc} alt={`Фото ${fullName}`} />
            <div className="studentsCard__content">
                <div className="studentsCard__header">
                    <h2 className="studentsCard__title">
                        {fullName}
                        <img className="course4" src={course4} alt=""/>
                    </h2>
                    <p className="studentsCard__subtitle">{student.speciality || 'Специальность не указана'}</p>
                </div>

                <div className="studentsCard__skills">
                    {skills.map((skill) => (
                        <span key={skill.id} className="skill-tag">{skill.name}</span>
                    ))}
                    {hasMoreSkills && (
                        <span className="skill-tag skill-more">+{student.skills.length - 4}</span>
                    )}
                </div>

                <div className="studentsCard__description">
                    <p>
                        {bioPreview}
                        {isBioTruncated && !showFullBio && (
                            <Link
                                to={`/studentsResume/${student.id}`}
                                className="read-more-link"
                            >
                                Читать дальше
                            </Link>
                        )}
                    </p>
                </div>

                <Link to={`/studentsResume/${student.id}`} className="studentsCard__button">
                    Смотреть резюме
                </Link>
            </div>
        </div>
    )
}

export default StudentsListCard;
