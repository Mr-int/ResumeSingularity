import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import ApplicationForm from '../applicationForm/ApplicationForm.jsx';
import { getStudentById } from '../../services/studentApi.js';
import mailIcon from "../../assets/icons/mailIcon.svg";
import './floatingButton.css';

const FloatingButton = () => {
    const [showForm, setShowForm] = useState(false);
    const [studentName, setStudentName] = useState(null);
    const location = useLocation();
    
    const isStudentPage = location.pathname.includes('/studentsResume/');
    const studentId = isStudentPage ? location.pathname.split('/studentsResume/')[1]?.split('/')[0] : null;

    useEffect(() => {
        if (isStudentPage && studentId) {
            const fetchStudentName = async () => {
                try {
                    const student = await getStudentById(studentId);
                    const fullName = `${student.firstName || ''} ${student.lastName || ''}`.trim();
                    setStudentName(fullName || null);
                } catch (err) {
                    console.error('Failed to fetch student name:', err);
                }
            };
            fetchStudentName();
        } else {
            setStudentName(null);
        }
    }, [isStudentPage, studentId]);

    const handleButtonClick = () => {
        setShowForm(true);
    };

    const handleCloseForm = () => {
        setShowForm(false);
    };

    const handleSubmit = async (formData) => {
        console.log('Submitting application:', formData, studentName ? { studentName } : {});
        return Promise.resolve();
    };

    return (
        <>
            <button 
                className="floatingButton"
                onClick={handleButtonClick}
                aria-label="Оставить заявку"
            >
                <span className="floatingButton__icon"><img src={mailIcon} alt=""/></span>
            </button>
            {showForm && (
                <ApplicationForm
                    studentName={studentName}
                    onClose={handleCloseForm}
                    onSubmit={handleSubmit}
                />
            )}
        </>
    );
};

export default FloatingButton;

