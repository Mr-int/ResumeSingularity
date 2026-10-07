import { useEffect, useRef, useState } from 'react';
import './photoCropModal.css';

/** Соотношение кадра как у cardPreview__photo: 159×173 */
const FRAME_W = 280;
const FRAME_H = Math.round((280 * 173) / 159);
const OUT_W = 318;
const OUT_H = Math.round((318 * 173) / 159);

const PhotoCropModal = ({ src, onCrop, onReset }) => {
    const imgRef = useRef(null);
    const stageRef = useRef(null);
    const dragRef = useRef(null);
    const transformRef = useRef({ x: 0, y: 0, scale: 1, minScale: 1 });
    const [ready, setReady] = useState(false);
    const [offset, setOffset] = useState({ x: 0, y: 0 });
    const [scale, setScale] = useState(1);
    const [natural, setNatural] = useState({ w: 0, h: 0 });

    useEffect(() => {
        setReady(false);
        setOffset({ x: 0, y: 0 });
        setScale(1);
        setNatural({ w: 0, h: 0 });
        transformRef.current = { x: 0, y: 0, scale: 1, minScale: 1 };
    }, [src]);

    useEffect(() => {
        const onKey = (event) => {
            if (event.key === 'Escape') onReset?.();
        };
        document.addEventListener('keydown', onKey);
        const prev = document.body.style.overflow;
        document.body.style.overflow = 'hidden';
        return () => {
            document.removeEventListener('keydown', onKey);
            document.body.style.overflow = prev;
        };
    }, [onReset]);

    useEffect(() => {
        const stage = stageRef.current;
        if (!stage) return undefined;

        const onWheel = (event) => {
            event.preventDefault();
            const rect = stage.getBoundingClientRect();
            const cx = event.clientX - rect.left;
            const cy = event.clientY - rect.top;
            applyZoom(event.deltaY > 0 ? 0.92 : 1.08, cx, cy);
        };

        stage.addEventListener('wheel', onWheel, { passive: false });
        return () => stage.removeEventListener('wheel', onWheel);
    }, [ready]);

    const clampOffset = (nextScale, nextOffset, nw, nh) => {
        const w = nw * nextScale;
        const h = nh * nextScale;
        return {
            x: Math.min(0, Math.max(FRAME_W - w, nextOffset.x)),
            y: Math.min(0, Math.max(FRAME_H - h, nextOffset.y)),
        };
    };

    const commitTransform = (next) => {
        transformRef.current = next;
        setOffset({ x: next.x, y: next.y });
        setScale(next.scale);
    };

    const fitImage = (img) => {
        const nw = img.naturalWidth;
        const nh = img.naturalHeight;
        const cover = Math.max(FRAME_W / nw, FRAME_H / nh);
        const next = {
            scale: cover,
            minScale: cover,
            x: (FRAME_W - nw * cover) / 2,
            y: (FRAME_H - nh * cover) / 2,
        };
        setNatural({ w: nw, h: nh });
        commitTransform(next);
        setReady(true);
    };

    const applyZoom = (factor, centerX = FRAME_W / 2, centerY = FRAME_H / 2) => {
        const current = transformRef.current;
        const nw = imgRef.current?.naturalWidth || natural.w || 0;
        const nh = imgRef.current?.naturalHeight || natural.h || 0;
        if (!nw || !nh) return;

        const nextScale = Math.min(current.scale * 4, Math.max(current.minScale, current.scale * factor));
        const rx = (centerX - current.x) / current.scale;
        const ry = (centerY - current.y) / current.scale;
        const raw = {
            x: centerX - rx * nextScale,
            y: centerY - ry * nextScale,
        };
        const clamped = clampOffset(nextScale, raw, nw, nh);
        commitTransform({
            ...current,
            scale: nextScale,
            x: clamped.x,
            y: clamped.y,
        });
    };

    const onPointerDown = (event) => {
        if (!ready) return;
        event.currentTarget.setPointerCapture?.(event.pointerId);
        dragRef.current = {
            x: event.clientX,
            y: event.clientY,
            ox: transformRef.current.x,
            oy: transformRef.current.y,
        };
    };

    const onPointerMove = (event) => {
        const drag = dragRef.current;
        if (!drag) return;
        const nw = natural.w || imgRef.current?.naturalWidth || 0;
        const nh = natural.h || imgRef.current?.naturalHeight || 0;
        const next = clampOffset(
            transformRef.current.scale,
            {
                x: drag.ox + (event.clientX - drag.x),
                y: drag.oy + (event.clientY - drag.y),
            },
            nw,
            nh,
        );
        commitTransform({ ...transformRef.current, ...next });
    };

    const onPointerUp = () => {
        dragRef.current = null;
    };

    const handleCrop = () => {
        const img = imgRef.current;
        const { x, y, scale: s } = transformRef.current;
        if (!img || !ready) return;

        const canvas = document.createElement('canvas');
        canvas.width = OUT_W;
        canvas.height = OUT_H;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';
        ctx.drawImage(img, -x / s, -y / s, FRAME_W / s, FRAME_H / s, 0, 0, OUT_W, OUT_H);
        onCrop?.(canvas.toDataURL('image/jpeg', 0.92));
    };

    if (!src) return null;

    return (
        <div className="photoCropModal" role="dialog" aria-modal="true" aria-labelledby="photo-crop-title">
            <div className="photoCropModal__card">
                <h2 id="photo-crop-title" className="photoCropModal__title">
                    Выровняйте фото по трафарету
                </h2>
                <p className="photoCropModal__hint">
                    Перетащите изображение и прокрутите колёсиком для масштаба
                </p>

                <div
                    className="photoCropModal__stage"
                    ref={stageRef}
                    style={{ width: FRAME_W, height: FRAME_H }}
                    onPointerDown={onPointerDown}
                    onPointerMove={onPointerMove}
                    onPointerUp={onPointerUp}
                    onPointerCancel={onPointerUp}
                >
                    <img
                        ref={imgRef}
                        src={src}
                        alt=""
                        className="photoCropModal__image"
                        draggable={false}
                        onLoad={(event) => fitImage(event.currentTarget)}
                        style={{
                            width: natural.w || undefined,
                            height: natural.h || undefined,
                            transform: `translate(${offset.x}px, ${offset.y}px) scale(${scale})`,
                            opacity: ready ? 1 : 0,
                        }}
                    />
                    <div className="photoCropModal__stencil" aria-hidden="true" />
                </div>

                <div className="photoCropModal__zoom">
                    <button type="button" className="photoCropModal__zoomBtn" onClick={() => applyZoom(0.9)} aria-label="Уменьшить">
                        −
                    </button>
                    <button type="button" className="photoCropModal__zoomBtn" onClick={() => applyZoom(1.1)} aria-label="Увеличить">
                        +
                    </button>
                </div>

                <div className="photoCropModal__actions">
                    <button type="button" className="photoCropModal__btn photoCropModal__btn--reset" onClick={onReset}>
                        Сбросить
                    </button>
                    <button
                        type="button"
                        className="photoCropModal__btn photoCropModal__btn--crop"
                        onClick={handleCrop}
                        disabled={!ready}
                    >
                        Обрезать
                    </button>
                </div>
            </div>
        </div>
    );
};

export default PhotoCropModal;
