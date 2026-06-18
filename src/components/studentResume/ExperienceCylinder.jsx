import React, { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import { formatExperiencePeriodText } from '../../utils/formatExperiencePeriod.js';

const ITEM_HEIGHT = 210;
const ANGLE_STEP = 18;
const RADIUS = Math.round((ITEM_HEIGHT / 2) / Math.tan((ANGLE_STEP / 2) * (Math.PI / 180)));
const WHEEL_THROTTLE_MS = 250;
const MOBILE_BREAKPOINT = 768;
const SWIPE_THRESHOLD_PX = 40;

const useMediaQuery = (query) => {
    const [matches, setMatches] = useState(() => {
        if (typeof window === 'undefined') return false;
        return window.matchMedia(query).matches;
    });

    useEffect(() => {
        const media = window.matchMedia(query);
        const onChange = () => setMatches(media.matches);
        onChange();
        media.addEventListener('change', onChange);
        return () => media.removeEventListener('change', onChange);
    }, [query]);

    return matches;
};

const ExperienceCard = React.forwardRef(({ exp, index, isActive, isWheel, style, onFocus }, ref) => (
    <article
        ref={ref}
        id={isActive ? `experience-item-${index}` : undefined}
        data-exp-index={index}
        className={[
            'StudentResume__experienceItem',
            'StudentResume__experienceItem--card',
            isWheel ? 'StudentResume__experienceItem--wheel' : '',
            isActive ? 'active' : '',
        ].filter(Boolean).join(' ')}
        style={style}
        tabIndex={isActive ? 0 : -1}
        onFocus={() => onFocus(index)}
        aria-hidden={!isActive && isWheel ? true : undefined}
    >
        <div className="StudentResume__experienceTimeline">
            <div className="StudentResume__experienceYears">
                {formatExperiencePeriodText(exp.startDate, exp.endDate, exp.current)}
            </div>
        </div>

        <div className="StudentResume__experienceInfo">
            {exp.company?.trim() && (
                <h3 className="StudentResume__experienceCompany">{exp.company}</h3>
            )}
            {exp.position?.trim() && (
                <h4 className="StudentResume__experiencePosition">{exp.position}</h4>
            )}
            {exp.description && (
                <p className="StudentResume__experienceDescription">{exp.description}</p>
            )}
        </div>
    </article>
));

ExperienceCard.displayName = 'ExperienceCard';

const ExperienceCylinder = ({ items = [] }) => {
    const [activeIndex, setActiveIndex] = useState(0);
    const pickerRef = useRef(null);
    const cylinderRef = useRef(null);
    const navRef = useRef(null);
    const itemRefs = useRef([]);
    const segmentRefs = useRef([]);
    const dotRefs = useRef([]);
    const wheelThrottleRef = useRef(false);
    const touchStartRef = useRef(null);

    const isMobile = useMediaQuery(`(max-width: ${MOBILE_BREAKPOINT}px)`);
    const prefersReducedMotion = useMediaQuery('(prefers-reduced-motion: reduce)');

    const totalItems = items.length;

    useEffect(() => {
        if (activeIndex >= totalItems) {
            setActiveIndex(0);
        }
    }, [activeIndex, totalItems]);

    itemRefs.current = itemRefs.current.slice(0, totalItems);
    segmentRefs.current = segmentRefs.current.slice(0, Math.max(0, totalItems - 1));
    dotRefs.current = dotRefs.current.slice(0, totalItems);

    const applyCylinderTransforms = useCallback(() => {
        if (isMobile || !cylinderRef.current) return;

        const cylinderAngle = activeIndex * ANGLE_STEP;
        cylinderRef.current.style.transform = `rotateX(${cylinderAngle}deg)`;

        itemRefs.current.forEach((item, index) => {
            if (!item) return;
            const itemAngle = index * ANGLE_STEP;
            item.style.transform = `rotateX(${-itemAngle}deg) translateZ(${RADIUS}px)`;
            item.style.opacity = index === activeIndex ? '1' : '0.7';
            item.classList.toggle('active', index === activeIndex);
        });
    }, [activeIndex, isMobile]);

    const updateNavigationLayout = useCallback(() => {
        const nav = navRef.current;
        if (!nav || totalItems === 0) return;

        const dots = dotRefs.current.filter(Boolean);
        const segments = segmentRefs.current.filter(Boolean);
        if (dots.length === 0) return;

        const asideRect = nav.getBoundingClientRect();
        const topPad = 10;
        const bottomPad = 10;
        const availHeight = asideRect.height - topPad - bottomPad;
        const dotPositions = [];

        dots.forEach((dot, index) => {
            const progress = totalItems > 1 ? index / (totalItems - 1) : 0.5;
            const yPos = topPad + progress * availHeight;
            dot.style.position = 'absolute';
            dot.style.top = `${yPos - 8}px`;
            dot.style.left = '50%';
            dot.style.transform = 'translateX(-50%)';
            dotPositions.push(yPos);
        });

        segments.forEach((segment, index) => {
            if (index < dotPositions.length - 1) {
                segment.style.top = `${dotPositions[index]}px`;
                segment.style.height = `${dotPositions[index + 1] - dotPositions[index]}px`;
                segment.style.left = '50%';
                segment.style.transform = 'translateX(-50%)';
            }
        });
    }, [totalItems]);

    useLayoutEffect(() => {
        if (!isMobile) {
            itemRefs.current.forEach((item, index) => {
                if (!item) return;
                const itemAngle = index * ANGLE_STEP;
                item.style.transform = `rotateX(${-itemAngle}deg) translateZ(${RADIUS}px)`;
            });
            applyCylinderTransforms();
        }

        updateNavigationLayout();
    }, [applyCylinderTransforms, isMobile, totalItems, updateNavigationLayout, activeIndex]);

    useEffect(() => {
        if (isMobile) return undefined;

        const onResize = () => {
            updateNavigationLayout();
            applyCylinderTransforms();
        };

        window.addEventListener('resize', onResize);
        return () => window.removeEventListener('resize', onResize);
    }, [applyCylinderTransforms, isMobile, updateNavigationLayout]);

    const goToIndex = useCallback((index) => {
        if (index < 0 || index >= totalItems || index === activeIndex) return;
        setActiveIndex(index);
    }, [activeIndex, totalItems]);

    const stepIndex = useCallback((delta) => {
        setActiveIndex((prev) => {
            const next = prev + delta;
            if (next < 0 || next >= totalItems) return prev;
            return next;
        });
    }, [totalItems]);

    useEffect(() => {
        const picker = pickerRef.current;
        if (!picker || isMobile || totalItems <= 1) return undefined;

        const onWheel = (event) => {
            event.preventDefault();
            if (wheelThrottleRef.current) return;
            wheelThrottleRef.current = true;

            if (event.deltaY > 0) {
                stepIndex(1);
            } else if (event.deltaY < 0) {
                stepIndex(-1);
            }

            window.setTimeout(() => {
                wheelThrottleRef.current = false;
            }, WHEEL_THROTTLE_MS);
        };

        picker.addEventListener('wheel', onWheel, { passive: false });
        return () => picker.removeEventListener('wheel', onWheel);
    }, [isMobile, stepIndex, totalItems]);

    useEffect(() => {
        const picker = pickerRef.current;
        if (!picker || !isMobile || totalItems <= 1) return undefined;

        const onTouchStart = (event) => {
            const touch = event.changedTouches[0];
            touchStartRef.current = { x: touch.clientX, y: touch.clientY };
        };

        const onTouchEnd = (event) => {
            const start = touchStartRef.current;
            touchStartRef.current = null;
            if (!start) return;

            const touch = event.changedTouches[0];
            const deltaX = touch.clientX - start.x;
            const deltaY = touch.clientY - start.y;

            if (Math.abs(deltaX) < SWIPE_THRESHOLD_PX || Math.abs(deltaX) < Math.abs(deltaY)) {
                return;
            }

            if (deltaX < 0) {
                stepIndex(1);
            } else {
                stepIndex(-1);
            }
        };

        picker.addEventListener('touchstart', onTouchStart, { passive: true });
        picker.addEventListener('touchend', onTouchEnd, { passive: true });

        return () => {
            picker.removeEventListener('touchstart', onTouchStart);
            picker.removeEventListener('touchend', onTouchEnd);
        };
    }, [isMobile, stepIndex, totalItems]);

    useEffect(() => {
        const picker = pickerRef.current;
        if (!picker || totalItems <= 1) return undefined;

        const onKeyDown = (event) => {
            if (event.key === 'ArrowDown' || event.key === 'ArrowRight') {
                event.preventDefault();
                stepIndex(1);
            } else if (event.key === 'ArrowUp' || event.key === 'ArrowLeft') {
                event.preventDefault();
                stepIndex(-1);
            }
        };

        picker.addEventListener('keydown', onKeyDown);
        return () => picker.removeEventListener('keydown', onKeyDown);
    }, [stepIndex, totalItems]);

    if (totalItems === 0) {
        return null;
    }

    const transitionClass = prefersReducedMotion
        ? 'StudentResume__experienceCylinder--reducedMotion'
        : '';

    const activeItem = items[activeIndex];

    return (
        <div
            className={`StudentResume__experienceWithTimeline${isMobile ? ' StudentResume__experienceWithTimeline--mobile' : ''}`}
        >
            <div
                ref={pickerRef}
                className="StudentResume__experiencePicker"
                role="listbox"
                aria-label="Опыт работы"
                aria-activedescendant={isMobile ? `experience-item-${activeIndex}` : undefined}
                tabIndex={0}
            >
                {isMobile ? (
                    <div className="StudentResume__experienceMobileCard">
                        <ExperienceCard
                            key={activeItem.id || activeIndex}
                            exp={activeItem}
                            index={activeIndex}
                            isActive
                            isWheel={false}
                            onFocus={goToIndex}
                        />
                    </div>
                ) : (
                    <div
                        ref={cylinderRef}
                        className={`StudentResume__experienceCylinder ${transitionClass}`.trim()}
                        style={{ height: `${ITEM_HEIGHT}px` }}
                    >
                        {items.map((exp, index) => (
                            <ExperienceCard
                                key={exp.id || index}
                                exp={exp}
                                index={index}
                                isActive={activeIndex === index}
                                isWheel
                                onFocus={goToIndex}
                                style={{ height: `${ITEM_HEIGHT}px` }}
                                ref={(el) => { itemRefs.current[index] = el; }}
                            />
                        ))}
                    </div>
                )}
            </div>

            <div
                ref={navRef}
                className="StudentResume__experienceTimelineNav"
                aria-label="Навигация по опыту"
            >
                <div className="StudentResume__experienceTimelineLine" aria-hidden="true" />

                {totalItems > 1 && Array.from({ length: totalItems - 1 }, (_, index) => (
                    <div
                        key={`segment-${index}`}
                        ref={(el) => { segmentRefs.current[index] = el; }}
                        className={[
                            'StudentResume__experienceTimelineSegment',
                            index === activeIndex - 1 || index === activeIndex ? 'StudentResume__experienceTimelineSegment--dashed' : '',
                        ].filter(Boolean).join(' ')}
                        aria-hidden="true"
                    />
                ))}

                {items.map((_, index) => (
                    <button
                        key={`exp-dot-${index}`}
                        ref={(el) => { dotRefs.current[index] = el; }}
                        type="button"
                        className={`StudentResume__experienceTimelineDot ${activeIndex === index ? 'active' : ''}`}
                        onClick={() => goToIndex(index)}
                        aria-label={`Опыт ${index + 1}`}
                        aria-current={activeIndex === index ? 'true' : undefined}
                    />
                ))}
            </div>
        </div>
    );
};

export default ExperienceCylinder;
