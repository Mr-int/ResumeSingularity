import { useEffect, useId, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import './birthDatePicker.css';

const WEEKDAYS = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'];
const MONTHS = [
    'Январь', 'Февраль', 'Март', 'Апрель', 'Май', 'Июнь',
    'Июль', 'Август', 'Сентябрь', 'Октябрь', 'Ноябрь', 'Декабрь',
];

const parseISO = (value) => {
    if (!value || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return null;
    const [y, m, d] = value.split('-').map(Number);
    const date = new Date(y, m - 1, d);
    if (date.getFullYear() !== y || date.getMonth() !== m - 1 || date.getDate() !== d) return null;
    return date;
};

const toISO = (date) => {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
};

const formatDisplay = (value) => {
    const date = parseISO(value);
    if (!date) return '';
    return [
        String(date.getDate()).padStart(2, '0'),
        String(date.getMonth() + 1).padStart(2, '0'),
        date.getFullYear(),
    ].join('.');
};

const startOfDay = (date) => new Date(date.getFullYear(), date.getMonth(), date.getDate());

const mondayOffset = (year, month) => {
    const day = new Date(year, month, 1).getDay();
    return day === 0 ? 6 : day - 1;
};

const BirthDatePicker = ({
    id = 'student-birth-date',
    value = '',
    onChange,
    placeholder = 'ДД.ММ.ГГГГ',
}) => {
    const today = useMemo(() => startOfDay(new Date()), []);
    const minYear = today.getFullYear() - 100;
    const maxYear = today.getFullYear() - 14;
    const years = useMemo(
        () => Array.from({ length: maxYear - minYear + 1 }, (_, i) => maxYear - i),
        [minYear, maxYear],
    );

    const selected = parseISO(value);
    const [open, setOpen] = useState(false);
    const [view, setView] = useState('days');
    const [viewYear, setViewYear] = useState(selected?.getFullYear() ?? maxYear - 4);
    const [viewMonth, setViewMonth] = useState(selected?.getMonth() ?? 0);
    const [coords, setCoords] = useState({ top: 0, left: 0, width: 280 });
    const rootRef = useRef(null);
    const popoverRef = useRef(null);
    const listboxId = useId();

    const close = () => {
        setOpen(false);
        setView('days');
    };

    const updatePosition = () => {
        const trigger = rootRef.current;
        if (!trigger) return;
        const rect = trigger.getBoundingClientRect();
        const width = Math.max(rect.width, 280);
        const gap = 8;
        const estimatedHeight = 320;
        const spaceBelow = window.innerHeight - rect.bottom - gap;
        const openUp = spaceBelow < estimatedHeight && rect.top > spaceBelow;
        const top = openUp
            ? Math.max(8, rect.top - gap - estimatedHeight)
            : rect.bottom + gap;
        let left = rect.left;
        if (left + width > window.innerWidth - 8) {
            left = Math.max(8, window.innerWidth - width - 8);
        }
        setCoords({ top, left, width });
    };

    useLayoutEffect(() => {
        if (!open) return undefined;
        updatePosition();
        const onScroll = () => updatePosition();
        window.addEventListener('resize', onScroll);
        window.addEventListener('scroll', onScroll, true);
        return () => {
            window.removeEventListener('resize', onScroll);
            window.removeEventListener('scroll', onScroll, true);
        };
    }, [open, view]);

    useEffect(() => {
        if (!open) return undefined;

        const onPointerDown = (event) => {
            const t = event.target;
            if (rootRef.current?.contains(t) || popoverRef.current?.contains(t)) return;
            close();
        };
        const onKeyDown = (event) => {
            if (event.key === 'Escape') close();
        };

        document.addEventListener('pointerdown', onPointerDown);
        document.addEventListener('keydown', onKeyDown);
        return () => {
            document.removeEventListener('pointerdown', onPointerDown);
            document.removeEventListener('keydown', onKeyDown);
        };
    }, [open]);

    const openPicker = () => {
        const base = selected || new Date(maxYear - 4, 0, 1);
        setViewYear(Math.min(maxYear, Math.max(minYear, base.getFullYear())));
        setViewMonth(base.getMonth());
        setView('days');
        setOpen(true);
    };

    const selectDate = (date) => {
        onChange?.(toISO(date));
        close();
    };

    const shiftMonth = (delta) => {
        const next = new Date(viewYear, viewMonth + delta, 1);
        const y = next.getFullYear();
        if (y < minYear || y > maxYear) return;
        setViewYear(y);
        setViewMonth(next.getMonth());
    };

    const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
    const offset = mondayOffset(viewYear, viewMonth);
    const cells = [];
    for (let i = 0; i < offset; i += 1) cells.push(null);
    for (let day = 1; day <= daysInMonth; day += 1) cells.push(day);
    while (cells.length % 7 !== 0) cells.push(null);

    const popover = open
        ? createPortal(
            <div
                ref={popoverRef}
                className="birthDatePicker__popover"
                role="dialog"
                aria-label="Календарь даты рождения"
                style={{ top: coords.top, left: coords.left, width: coords.width }}
            >
                <div className="birthDatePicker__header">
                    {view === 'days' ? (
                        <>
                            <button type="button" className="birthDatePicker__nav" onClick={() => shiftMonth(-1)} aria-label="Предыдущий месяц">
                                ‹
                            </button>
                            <div className="birthDatePicker__title">
                                <button type="button" className="birthDatePicker__titleBtn" onClick={() => setView('months')}>
                                    {MONTHS[viewMonth]}
                                </button>
                                <button type="button" className="birthDatePicker__titleBtn" onClick={() => setView('years')}>
                                    {viewYear}
                                </button>
                            </div>
                            <button type="button" className="birthDatePicker__nav" onClick={() => shiftMonth(1)} aria-label="Следующий месяц">
                                ›
                            </button>
                        </>
                    ) : (
                        <>
                            <button type="button" className="birthDatePicker__nav" onClick={() => setView('days')} aria-label="Назад к дням">
                                ‹
                            </button>
                            <div className="birthDatePicker__title">
                                <span className="birthDatePicker__titleBtn is-static">
                                    {view === 'months' ? 'Месяц' : 'Год'}
                                </span>
                            </div>
                            <span className="birthDatePicker__nav birthDatePicker__nav--spacer" />
                        </>
                    )}
                </div>

                {view === 'days' ? (
                    <>
                        <div className="birthDatePicker__weekdays">
                            {WEEKDAYS.map((day) => (
                                <span key={day}>{day}</span>
                            ))}
                        </div>
                        <div className="birthDatePicker__grid" role="grid">
                            {cells.map((day, index) => {
                                if (day == null) {
                                    return <span key={`e-${index}`} className="birthDatePicker__day is-empty" />;
                                }
                                const date = new Date(viewYear, viewMonth, day);
                                const iso = toISO(date);
                                const isSelected = value === iso;
                                const isToday = toISO(today) === iso;
                                const disabled = date > today || date.getFullYear() < minYear;
                                return (
                                    <button
                                        key={iso}
                                        type="button"
                                        className={
                                            'birthDatePicker__day'
                                            + (isSelected ? ' is-selected' : '')
                                            + (isToday ? ' is-today' : '')
                                        }
                                        disabled={disabled}
                                        onClick={() => selectDate(date)}
                                    >
                                        {day}
                                    </button>
                                );
                            })}
                        </div>
                    </>
                ) : null}

                {view === 'months' ? (
                    <div className="birthDatePicker__months" id={listboxId}>
                        {MONTHS.map((name, month) => (
                            <button
                                key={name}
                                type="button"
                                className={`birthDatePicker__chip${viewMonth === month ? ' is-selected' : ''}`}
                                onClick={() => {
                                    setViewMonth(month);
                                    setView('days');
                                }}
                            >
                                {name.slice(0, 3)}
                            </button>
                        ))}
                    </div>
                ) : null}

                {view === 'years' ? (
                    <div className="birthDatePicker__years" id={listboxId}>
                        {years.map((year) => (
                            <button
                                key={year}
                                type="button"
                                className={`birthDatePicker__chip${viewYear === year ? ' is-selected' : ''}`}
                                onClick={() => {
                                    setViewYear(year);
                                    setView('days');
                                }}
                            >
                                {year}
                            </button>
                        ))}
                    </div>
                ) : null}
            </div>,
            document.body,
        )
        : null;

    return (
        <div className={`birthDatePicker${open ? ' is-open' : ''}`} ref={rootRef}>
            <button
                id={id}
                type="button"
                className={`birthDatePicker__trigger${value ? ' has-value' : ''}`}
                aria-haspopup="dialog"
                aria-expanded={open}
                onClick={() => {
                    if (open) {
                        close();
                        return;
                    }
                    openPicker();
                }}
            >
                <span>{formatDisplay(value) || placeholder}</span>
                <svg className="birthDatePicker__icon" width="18" height="18" viewBox="0 0 24 24" aria-hidden="true">
                    <rect x="3" y="5" width="18" height="16" rx="3" fill="none" stroke="currentColor" strokeWidth="1.6" />
                    <path d="M3 10h18M8 3v4M16 3v4" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
                </svg>
            </button>
            {popover}
        </div>
    );
};

export default BirthDatePicker;
