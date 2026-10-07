import { useCallback, useEffect, useRef, useState } from 'react';
import './specialtyList.css';

const MIN_THUMB = 48;

const SpecialtyList = ({ specialties = [], specialityId = null, onSpecialtyChange }) => {
    const listRef = useRef(null);
    const railRef = useRef(null);
    const dragRef = useRef(null);
    const [thumb, setThumb] = useState({ top: 0, height: MIN_THUMB, visible: false });

    const syncThumb = useCallback(() => {
        const el = listRef.current;
        if (!el) return;

        const { scrollTop, scrollHeight, clientHeight } = el;
        const overflow = scrollHeight - clientHeight;
        if (overflow <= 1) {
            setThumb((prev) => (prev.visible ? { ...prev, visible: false } : prev));
            return;
        }

        const height = Math.max(MIN_THUMB, (clientHeight / scrollHeight) * clientHeight);
        const maxTop = clientHeight - height;
        const top = maxTop * (scrollTop / overflow);
        setThumb({ top, height, visible: true });
    }, []);

    useEffect(() => {
        const el = listRef.current;
        if (!el) return undefined;

        syncThumb();
        el.addEventListener('scroll', syncThumb, { passive: true });
        const ro = new ResizeObserver(syncThumb);
        ro.observe(el);

        return () => {
            el.removeEventListener('scroll', syncThumb);
            ro.disconnect();
        };
    }, [syncThumb, specialties.length]);

    useEffect(() => {
        const onMove = (event) => {
            const drag = dragRef.current;
            const el = listRef.current;
            if (!drag || !el) return;

            const overflow = el.scrollHeight - el.clientHeight;
            if (overflow <= 0) return;

            const maxTop = el.clientHeight - drag.thumbHeight;
            const nextTop = Math.min(maxTop, Math.max(0, event.clientY - drag.startY + drag.originTop));
            el.scrollTop = (nextTop / maxTop) * overflow;
        };

        const onUp = () => {
            dragRef.current = null;
            document.body.style.removeProperty('user-select');
        };

        document.addEventListener('pointermove', onMove);
        document.addEventListener('pointerup', onUp);
        return () => {
            document.removeEventListener('pointermove', onMove);
            document.removeEventListener('pointerup', onUp);
        };
    }, []);

    const onThumbPointerDown = (event) => {
        event.preventDefault();
        event.stopPropagation();
        dragRef.current = {
            startY: event.clientY,
            originTop: thumb.top,
            thumbHeight: thumb.height,
        };
        document.body.style.userSelect = 'none';
    };

    const onRailPointerDown = (event) => {
        if (event.target !== railRef.current) return;
        const el = listRef.current;
        if (!el || !thumb.visible) return;

        const rect = railRef.current.getBoundingClientRect();
        const y = event.clientY - rect.top;
        const maxTop = el.clientHeight - thumb.height;
        const nextTop = Math.min(maxTop, Math.max(0, y - thumb.height / 2));
        const overflow = el.scrollHeight - el.clientHeight;
        el.scrollTop = (nextTop / maxTop) * overflow;
    };

    return (
        <div className="specialtyScroll">
            <div
                className={`specialtyScroll__rail${thumb.visible ? ' is-visible' : ''}`}
                ref={railRef}
                aria-hidden="true"
                onPointerDown={onRailPointerDown}
            >
                <div className="specialtyScroll__drop" />
                {thumb.visible ? (
                    <div
                        className="specialtyScroll__thumb"
                        style={{ top: thumb.top, height: thumb.height }}
                        onPointerDown={onThumbPointerDown}
                    />
                ) : null}
            </div>

            <div className="specialtyScroll__list" ref={listRef}>
                {specialties.map((item) => {
                    const id = item?.id;
                    const name = item?.name || '';
                    const isActive = specialityId != null && String(specialityId) === String(id);

                    return (
                        <button
                            key={id}
                            type="button"
                            className={`stepForm__specialtyItem${isActive ? ' is-active' : ''}`}
                            onClick={() => onSpecialtyChange?.(id)}
                        >
                            <span className="stepForm__specialtyDot" aria-hidden="true" />
                            <span className="stepForm__specialtyName">{name}</span>
                        </button>
                    );
                })}
            </div>
        </div>
    );
};

export default SpecialtyList;
