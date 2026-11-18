import { useEffect, useId, useMemo, useRef, useState } from 'react';
import './citySelect.css';

const CitySelect = ({
    id = 'student-city',
    value = '',
    options = [],
    onChange,
    placeholder = 'Выберите город',
}) => {
    const [open, setOpen] = useState(false);
    const rootRef = useRef(null);
    const listId = useId();

    const displayValue = String(value || '').trim();
    const menuOptions = useMemo(() => {
        const names = (Array.isArray(options) ? options : [])
            .map((name) => String(name || '').trim())
            .filter(Boolean);
        if (displayValue && !names.includes(displayValue)) {
            return [displayValue, ...names];
        }
        return names;
    }, [options, displayValue]);

    useEffect(() => {
        if (!open) return undefined;

        const onPointerDown = (event) => {
            if (rootRef.current?.contains(event.target)) return;
            setOpen(false);
        };
        const onKeyDown = (event) => {
            if (event.key === 'Escape') setOpen(false);
        };

        document.addEventListener('pointerdown', onPointerDown);
        document.addEventListener('keydown', onKeyDown);
        return () => {
            document.removeEventListener('pointerdown', onPointerDown);
            document.removeEventListener('keydown', onKeyDown);
        };
    }, [open]);

    return (
        <div
            className={`citySelect${open ? ' is-open' : ''}${displayValue ? ' has-value' : ''}`}
            ref={rootRef}
        >
            <button
                id={id}
                type="button"
                className="citySelect__trigger"
                aria-haspopup="listbox"
                aria-expanded={open}
                aria-controls={listId}
                onClick={() => setOpen((prev) => !prev)}
            >
                <span className="citySelect__value">
                    {displayValue || placeholder}
                </span>
            </button>

            {open ? (
                <div
                    id={listId}
                    className="citySelect__menu"
                    role="listbox"
                    aria-label="Город"
                >
                    {menuOptions.map((name) => {
                        const selected = displayValue === name;
                        return (
                            <button
                                key={name}
                                type="button"
                                role="option"
                                aria-selected={selected}
                                className={
                                    'citySelect__option'
                                    + (selected ? ' is-selected' : '')
                                }
                                onClick={() => {
                                    onChange?.(name);
                                    setOpen(false);
                                }}
                            >
                                {name}
                            </button>
                        );
                    })}
                </div>
            ) : null}
        </div>
    );
};

export default CitySelect;
