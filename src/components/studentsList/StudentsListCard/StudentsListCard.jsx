import React from "react";
import test from "../../../assets/other/test.png";
import {Link} from "react-router-dom";
import './studentsListCard.css';
import course4 from "../../../assets/other/course4.png"
import { getImageUrl } from "../../../config/api.js";

const StudentsListCard = ({ student }) => {
    if (!student) {
        return null;
    }

    // Формируем полное имя
    const fullName = `${student.firstName || ''} ${student.lastName || ''}`.trim() || 'Имя не указано';
    
    // Получаем изображение студента через API эндпоинт или используем дефолтное
    const imagePath = student.imagePath || student.image;
    const imageSrc = imagePath ? getImageUrl(imagePath) : test;
    
    // Обрезаем биографию для предпросмотра
    const bioPreview = student.bio 
        ? (student.bio.length > 150 ? student.bio.substring(0, 150) + '...' : student.bio)
        : 'Описание отсутствует';

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
                    {student.skills && student.skills.length > 0 ? (
                        student.skills.map((skill) => (
                            <span key={skill.id} className="skill-tag">{skill.name}</span>
                        ))
                    ) : (
                        <span className="skill-tag">Навыки не указаны</span>
                    )}
                </div>

                <div className="studentsCard__description">
                    <p>
                        {bioPreview}
                        {student.bio && student.bio.length > 150 && (
                            <span className="read-more">Читать дальше</span>
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