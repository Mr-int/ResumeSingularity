import React, { useState, useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import ApplicationForm from '../applicationForm/ApplicationForm.jsx';
import { getStudentById } from '../../services/studentApi.js';
import mailIcon from "../../assets/icons/mailIcon.svg";
import './floatingButton.css';

const FloatingButton = () => {
    const [showForm, setShowForm] = useState(false);
    const [isExpanded, setIsExpanded] = useState(false);
    const [isClosing, setIsClosing] = useState(false);
    const [isHidden, setIsHidden] = useState(false);
    const [studentName, setStudentName] = useState(null);
    const [studentId, setStudentId] = useState(null);
    const wrapperRef = useRef(null);
    const location = useLocation();

    const isStudentPage = location.pathname.includes('/studentsResume/');
    const currentStudentId = isStudentPage ? location.pathname.split('/studentsResume/')[1]?.split('/')[0] : null;

    useEffect(() => {
        if (isStudentPage && currentStudentId) {
            const fetchStudentName = async () => {
                try {
                    const student = await getStudentById(currentStudentId);
                    const fullName = `${student.firstName || ''} ${student.lastName || ''}`.trim();
                    setStudentName(fullName || null);
                    setStudentId(currentStudentId);
                } catch (err) {
                    console.error('Failed to fetch student name:', err);
                    setStudentName(null);
                    setStudentId(null);
                }
            };
            fetchStudentName();
        } else {
            setStudentName(null);
            setStudentId(null);
        }
    }, [isStudentPage, currentStudentId]);

    const startClosing = () => {
        setIsClosing(true);
        setIsExpanded(false);
    };

    useEffect(() => {
        if (!isClosing) return;
        const t = setTimeout(() => setIsClosing(false), 520);
        return () => clearTimeout(t);
    }, [isClosing]);

    useEffect(() => {
        if (!isExpanded || showForm) return;
        const handleClickOutside = (e) => {
            if (!wrapperRef.current) return;
            if (wrapperRef.current.contains(e.target)) return;
            if (e.target.closest('.applicationForm__overlay')) return;
            startClosing();
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [isExpanded, showForm]);

    const handleMainClick = () => {
        if (isExpanded) {
            setShowForm(true);
        } else {
            setIsExpanded(true);
        }
    };

    const handleCloseForm = () => {
        setShowForm(false);
        startClosing();
    };

    const handleCloseButtonClick = (e) => {
        e.stopPropagation();
        setIsHidden(true);
    };

    const handleSubmit = async (formData) => {
        console.log('Application submitted:', formData);
        return Promise.resolve();
    };

    if (!studentId || isHidden) {
        return null;
    }

    return (
        <div className="floatingButton__wrapper" ref={wrapperRef}>
            <div
                className={`floatingButton__pill${isExpanded ? ' floatingButton__pill_expanded' : ''}${isClosing ? ' floatingButton__pill_closing' : ''}`}
            >
                <button
                    type="button"
                    className={`floatingButton floatingButton_main${isExpanded ? ' floatingButton_main_expanded' : ''}`}
                    onClick={handleMainClick}
                    aria-label="Оставить заявку"
                >
                    <span className="floatingButton__icon">
                        <img src={mailIcon} alt="" />
                    </span>
                    {isExpanded && (
                        <span className="floatingButton__text">Оставить заявку</span>
                    )}
                </button>
            </div>
            {isExpanded && (
                <button
                    type="button"
                    className="floatingButton__close"
                    onClick={handleCloseButtonClick}
                    aria-label="Скрыть кнопку"
                >
                    <span className="floatingButton__closeIcon" aria-hidden>×</span>
                </button>
            )}
            {showForm && (
                <ApplicationForm
                    studentName={studentName}
                    studentId={studentId}
                    onClose={handleCloseForm}
                    onSubmit={handleSubmit}
                />
            )}
        </div>
    );
};

export default FloatingButton;
