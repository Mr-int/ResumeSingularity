import { useEffect, useState } from 'react';
import agreeIcon from '../../../assets/icons/agree.png';
import cancelIcon from '../../../assets/icons/cancel.png';
import arrowSmallIcon from '../../../assets/icons/arrow_small.svg';
import './memoBlock.css';

const HeaderIcon = () => (
    <svg className="memoBlock__headerIcon" viewBox="0 0 24 24" aria-hidden="true">
        <path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-5 14H7v-2h7v2zm3-4H7v-2h10v2zm0-4H7V7h10v2z" />
    </svg>
);

const SuccessIcon = () => (
    <img
        src={agreeIcon}
        alt=""
        className="memoBlock__statusIcon memoBlock__statusIcon--success"
        width={16}
        height={16}
        aria-hidden="true"
    />
);

const ErrorIcon = () => (
    <img
        src={cancelIcon}
        alt=""
        className="memoBlock__statusIcon memoBlock__statusIcon--error"
        width={16}
        height={16}
        aria-hidden="true"
    />
);

const ArrowIcon = () => (
    <img
        src={arrowSmallIcon}
        alt=""
        className="memoBlock__arrow"
        width={19}
        height={6}
        aria-hidden="true"
    />
);

const toBullets = (item) => {
    if (Array.isArray(item.bullets) && item.bullets.length) return item.bullets;
    if (typeof item.content === 'string' && item.content.trim()) return [item.content];
    return [];
};

const MemoBlock = ({ title = 'Памятка', items = [] }) => {
    const [openId, setOpenId] = useState(items[0]?.id ?? null);

    useEffect(() => {
        setOpenId(items[0]?.id ?? null);
    }, [items]);

    return (
        <aside className="memoBlock">
            <div className="memoBlock__header">
                <HeaderIcon />
                <h2 className="memoBlock__title">{title}</h2>
            </div>

            {items.map((item) => {
                const isOpen = openId === item.id;
                const tone = item.tone === 'error' ? 'error' : 'success';
                const bullets = toBullets(item);

                return (
                    <div key={item.id} className={`memoBlock__item${isOpen ? ' is-open' : ''}`}>
                        <button
                            type="button"
                            className="memoBlock__summary"
                            aria-expanded={isOpen}
                            onClick={() => setOpenId(isOpen ? null : item.id)}
                        >
                            <span className="memoBlock__summaryMain">
                                {tone === 'error' ? <ErrorIcon /> : <SuccessIcon />}
                                <span className="memoBlock__summaryText">{item.title}</span>
                            </span>
                            <ArrowIcon />
                        </button>

                        {bullets.length > 0 ? (
                            <div
                                className="memoBlock__panel"
                                aria-hidden={!isOpen}
                            >
                                <div className="memoBlock__panelInner">
                                    <div className="memoBlock__content">
                                        <ul className="memoBlock__list">
                                            {bullets.map((line) => (
                                                <li key={line} className="memoBlock__listItem">{line}</li>
                                            ))}
                                        </ul>
                                    </div>
                                </div>
                            </div>
                        ) : null}
                    </div>
                );
            })}
        </aside>
    );
};

export default MemoBlock;
