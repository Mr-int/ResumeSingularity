import { useState } from 'react';
import './memoBlock.css';

const MemoBlock = ({ title = 'Памятка', items = [] }) => {
    const [openId, setOpenId] = useState(items[0]?.id ?? null);

    return (
        <aside className="memoBlock">
            <h2 className="memoBlock__title">{title}</h2>
            {items.map((item) => {
                const isOpen = openId === item.id;

                return (
                    <div key={item.id} className={`memoBlock__item ${isOpen ? 'is-open' : ''}`}>
                        <button
                            type="button"
                            className="memoBlock__trigger"
                            onClick={() => setOpenId(isOpen ? null : item.id)}
                        >
                            {item.title}
                            <span className="memoBlock__chevron" aria-hidden="true">▾</span>
                        </button>
                        <div className="memoBlock__content">{item.content}</div>
                    </div>
                );
            })}
        </aside>
    );
};

export default MemoBlock;
