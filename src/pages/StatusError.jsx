import { useEffect, useRef } from 'react';
import { Link, useLocation, useParams } from 'react-router-dom';
import './statusError.css';

const STATUS_CONTENT = {
    404: {
        mode: 'sad',
        title: 'Страница не найдена',
        message: 'Мы проверили все направления, но этот адрес никуда не ведёт. Возможно, ссылка устарела.',
    },
    403: {
        mode: 'locked',
        title: 'Доступ ограничен',
        message: 'У вас нет пропуска в эту директорию. Проход закрыт. Вернитесь в безопасную зону.',
    },
    500: {
        mode: 'dizzy',
        title: 'Критический сбой',
        message: 'Внутренние системы сервера перегружены. Мы уже разбираемся, что вызвало эту кашу.',
    },
    503: {
        mode: 'sleep',
        title: 'Система спит',
        message: 'Сервер отключён на плановое обслуживание инфраструктуры. Загляните чуть позже.',
    },
};

const normalizeCode = (value) => {
    const code = String(value || '404');
    return STATUS_CONTENT[code] ? code : '404';
};

const StatusError = ({ code: codeProp }) => {
    const { code: codeParam } = useParams();
    const location = useLocation();
    const code = normalizeCode(codeProp ?? codeParam);
    const base = STATUS_CONTENT[code];
    const override = location.state && typeof location.state === 'object' ? location.state : null;
    const content = {
        ...base,
        title: override?.title || base.title,
        message: override?.message || base.message,
    };
    const circleRef = useRef(null);
    const slashRef = useRef(null);

    useEffect(() => {
        document.title = `Status: ${code}`;
    }, [code]);

    useEffect(() => {
        if (content.mode !== 'locked') return;

        const circle = circleRef.current;
        const slash = slashRef.current;
        [circle, slash].forEach((el) => {
            if (!el) return;
            el.style.animation = 'none';
            void el.offsetWidth;
            el.style.animation = '';
        });
    }, [content.mode, code]);

    return (
        <main className="statusError">
            <div className="statusError__wrapper">
                <div className="statusError__characterZone">
                    <div className="statusError__zzz" aria-hidden="true">
                        <span className="statusError__zLetter statusError__zLetter--1">z</span>
                        <span className="statusError__zLetter statusError__zLetter--2">z</span>
                        <span className="statusError__zLetter statusError__zLetter--3">Z</span>
                    </div>

                    <div className={`statusError__faceRoot statusError__faceRoot--${content.mode}`}>
                        <div className="statusError__eyesRow">
                            <div className="statusError__eye statusError__eye--left" />
                            <div className="statusError__eye statusError__eye--right" />
                            <div className="statusError__tear" />
                            <div className="statusError__sweat" />
                        </div>

                        <div className="statusError__mouth" />

                        <div className="statusError__prohibition" aria-hidden="true">
                            <svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
                                <circle
                                    ref={circleRef}
                                    className="statusError__prohCircle"
                                    cx="50"
                                    cy="50"
                                    r="40"
                                />
                                <line
                                    ref={slashRef}
                                    className="statusError__prohSlash"
                                    x1="22"
                                    y1="78"
                                    x2="78"
                                    y2="22"
                                />
                            </svg>
                        </div>
                    </div>
                </div>

                <div className="statusError__text" key={code}>
                    <div className="statusError__code">Error {code}</div>
                    <h1 className="statusError__title">{content.title}</h1>
                    <p className="statusError__message">{content.message}</p>
                </div>

                <div className="statusError__actions">
                    {override?.ctaTo && override?.ctaLabel ? (
                        <Link to={override.ctaTo} className="statusError__homeLink">
                            {override.ctaLabel}
                        </Link>
                    ) : null}
                    <Link
                        to="/"
                        className={
                            override?.ctaTo
                                ? 'statusError__homeLink statusError__homeLink--secondary'
                                : 'statusError__homeLink'
                        }
                    >
                        На главную
                    </Link>
                </div>
            </div>
        </main>
    );
};

export default StatusError;
