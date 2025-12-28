import React, { useState } from "react";
import test from "../../../assets/other/test.png";
import { Link } from "react-router-dom";
import './studentsListCard.css';
import course4 from "../../../assets/other/course4.png";
import course3 from "../../../assets/other/thirdCourse.png";
import course2 from "../../../assets/other/secondCourse.png";

const StudentsListCard = ({ student }) => {
    const [showFullBio, setShowFullBio] = useState(false);

    if (!student) {
        return null;
    }

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

    const fullName = `${student.firstName || ''} ${student.lastName || ''}`.trim() || 'Имя не указано';
    const imageSrc = getStudentImageUrl(student);
    const courseImage = getCourseImage(student.course);

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
            <div className="studentsCard__top-section">
                <img className="studentsCard__image" src={imageSrc} alt={`Фото ${fullName}`} />
                <div className="studentsCard__info">
                    <div className="studentsCard__header">
                        <h2 className="studentsCard__title">
                            {fullName}
                            <img className="course4" src={courseImage} alt=""/>
                        </h2>
                        <p className="studentsCard__subtitle">{student.speciality || 'Специальность не указана'}</p>
                    </div>

                    <div className="studentsCard__skills">
                        {skills.map((skill) => (
                            <span key={skill.id} className="skill-tag">{skill.name}</span>
                        ))}
                        {hasMoreSkills && (
                            <span className="skill-more">... и еще ({student.skills.length - 4})</span>
                        )}
                    </div>
                </div>
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
    )
}

export default StudentsListCard;