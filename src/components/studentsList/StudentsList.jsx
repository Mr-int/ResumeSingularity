import React, { useState, useEffect } from "react";
import "./studentsList.css";
import searchIcon from "../../assets/icons/searchIcon.svg";
import filterIcon from "../../assets/icons/filterIcon.svg";
import StudentsListCard from "./StudentsListCard/StudentsListCard.jsx";
import { getAllStudents } from "../../services/studentApi.js";

const StudentsList = () => {
    const [students, setStudents] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchStudents = async () => {
            try {
                setLoading(true);
                const data = await getAllStudents();
                setStudents(data);
            } catch (err) {
                setError(err.message);
                console.error('Failed to fetch students:', err);
            } finally {
                setLoading(false);
            }
        };

        fetchStudents();
    }, []);

    if (loading) {
        return (
            <section className="studentsList-section">
                <div className="studentsList">
                    <p>Загрузка студентов...</p>
                </div>
            </section>
        );
    }

    if (error) {
        return (
            <section className="studentsList-section">
                <div className="studentsList">
                    <p>Ошибка загрузки: {error}</p>
                </div>
            </section>
        );
    }

    return (
        <section className="studentsList-section">
            <div className="studentsList">
                <header className="studentsList__header">
                    <h2 className="studentsList__title">Студенты</h2>

                    <div className="studentsList__search-wrapper">
                        <div className="studentsList__search-icon">
                            <img src={searchIcon} alt="search"/>
                        </div>

                        <input
                            type="text"
                            className="studentsList__search"
                            placeholder="Профессия / Стэк ..."
                        />
                    </div>

                    <button className="studentsList__filter">
                        Фильтр
                        <img src={filterIcon} alt=" "/>
                    </button>
                </header>

                <div className="studentsList__cardsWrapper">
                    {students.length > 0 ? (
                        students.map((student) => (
                            <StudentsListCard key={student.id} student={student} />
                        ))
                    ) : (
                        <p>Студенты не найдены</p>
                    )}
                </div>
            </div>
        </section>
    )
}

export default StudentsList;