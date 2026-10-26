import { useEffect, useRef, useState } from 'react';
import trafaretSrc from '../../../../assets/photoExamples/trafaret.png';
import './photoCropModal.css';

/* Окно обрезки = реальный аватар 210×230 (как studentProfileResume__avatar) */
const CROP_W = 210;
const CROP_H = 230;
const OUT_W = 420;
const OUT_H = 460;
const STAGE_W = 512;
const STAGE_H = 360;
const CROP_LEFT = (STAGE_W - CROP_W) / 2;
const CROP_TOP = (STAGE_H - CROP_H) / 2;
const CROP_RADIUS = 18;
const MIN_VIEW_ZOOM = 0.55;
const MAX_VIEW_ZOOM = 2.4;
const MIN_PHOTO_SCALE = 0.15;
const MAX_PHOTO_SCALE = 4;

const HANDLE_CURSORS = {
    n: 'ns-resize',
    s: 'ns-resize',
    e: 'ew-resize',
    w: 'ew-resize',
    ne: 'nesw-resize',
    sw: 'nesw-resize',
    nw: 'nwse-resize',
    se: 'nwse-resize',
};

const PhotoCropModal = ({ src, onCrop, onReset }) => {
    const imgRef = useRef(null);
    const stageRef = useRef(null);
    const interactionRef = useRef(null);
    const stateRef = useRef({
        photoX: 0,
        photoY: 0,
        photoScale: 1,
        viewZoom: 1,
        naturalW: 0,
        naturalH: 0,
    });

    const [ready, setReady] = useState(false);
    const [photoX, setPhotoX] = useState(0);
    const [photoY, setPhotoY] = useState(0);
    const [photoScale, setPhotoScale] = useState(1);
    const [viewZoom, setViewZoom] = useState(1);
    const [natural, setNatural] = useState({ w: 0, h: 0 });

    const syncState = (partial) => {
        stateRef.current = { ...stateRef.current, ...partial };
        if (partial.photoX != null) setPhotoX(partial.photoX);
        if (partial.photoY != null) setPhotoY(partial.photoY);
        if (partial.photoScale != null) setPhotoScale(partial.photoScale);
        if (partial.viewZoom != null) setViewZoom(partial.viewZoom);
        if (partial.naturalW != null || partial.naturalH != null) {
            setNatural({
                w: partial.naturalW ?? stateRef.current.naturalW,
                h: partial.naturalH ?? stateRef.current.naturalH,
            });
        }
    };

    useEffect(() => {
        setReady(false);
        setPhotoX(0);
        setPhotoY(0);
        setPhotoScale(1);
        setViewZoom(1);
        setNatural({ w: 0, h: 0 });
        stateRef.current = {
            photoX: 0,
            photoY: 0,
            photoScale: 1,
            viewZoom: 1,
            naturalW: 0,
            naturalH: 0,
        };
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
            applyViewZoom(event.deltaY > 0 ? 0.92 : 1.08);
        };

        stage.addEventListener('wheel', onWheel, { passive: false });
        return () => stage.removeEventListener('wheel', onWheel);
    }, [ready]);

    const fitImage = (img) => {
        const nw = img.naturalWidth;
        const nh = img.naturalHeight;
        if (!nw || !nh) return;

        const cover = Math.max(CROP_W / nw, CROP_H / nh);
        const displayW = nw * cover;
        const displayH = nh * cover;
        const next = {
            naturalW: nw,
            naturalH: nh,
            photoScale: cover,
            photoX: CROP_LEFT + (CROP_W - displayW) / 2,
            photoY: CROP_TOP + (CROP_H - displayH) / 2,
            viewZoom: 1,
        };
        syncState(next);
        setReady(true);
    };

    const applyViewZoom = (factor) => {
        const current = stateRef.current.viewZoom;
        const next = Math.min(MAX_VIEW_ZOOM, Math.max(MIN_VIEW_ZOOM, current * factor));
        syncState({ viewZoom: next });
    };

    const stageToWorld = (stageX, stageY) => {
        const z = stateRef.current.viewZoom || 1;
        return {
            x: STAGE_W / 2 + (stageX - STAGE_W / 2) / z,
            y: STAGE_H / 2 + (stageY - STAGE_H / 2) / z,
        };
    };

    const getPointerStagePos = (event) => {
        const rect = stageRef.current.getBoundingClientRect();
        return {
            x: event.clientX - rect.left,
            y: event.clientY - rect.top,
        };
    };

    useEffect(() => {
        const onPointerMove = (event) => {
            const interaction = interactionRef.current;
            if (!interaction || !stageRef.current) return;

            const stagePos = getPointerStagePos(event);
            const world = stageToWorld(stagePos.x, stagePos.y);

            if (interaction.type === 'pan') {
                const dx = world.x - interaction.startWorldX;
                const dy = world.y - interaction.startWorldY;
                syncState({
                    photoX: interaction.originPhotoX + dx,
                    photoY: interaction.originPhotoY + dy,
                });
                return;
            }

            if (interaction.type === 'resize') {
                const dist = Math.max(8, Math.hypot(world.x - interaction.centerX, world.y - interaction.centerY));
                const nextScale = Math.min(
                    MAX_PHOTO_SCALE,
                    Math.max(MIN_PHOTO_SCALE, interaction.originScale * (dist / interaction.startDist)),
                );
                const w = interaction.naturalW * nextScale;
                const h = interaction.naturalH * nextScale;
                syncState({
                    photoScale: nextScale,
                    photoX: interaction.centerX - w / 2,
                    photoY: interaction.centerY - h / 2,
                });
            }
        };

        const onPointerUp = () => {
            interactionRef.current = null;
        };

        window.addEventListener('pointermove', onPointerMove);
        window.addEventListener('pointerup', onPointerUp);
        window.addEventListener('pointercancel', onPointerUp);
        return () => {
            window.removeEventListener('pointermove', onPointerMove);
            window.removeEventListener('pointerup', onPointerUp);
            window.removeEventListener('pointercancel', onPointerUp);
        };
    }, []);

    const onPhotoPointerDown = (event) => {
        if (!ready) return;
        event.stopPropagation();
        event.currentTarget.setPointerCapture?.(event.pointerId);
        const stagePos = getPointerStagePos(event);
        const world = stageToWorld(stagePos.x, stagePos.y);
        interactionRef.current = {
            type: 'pan',
            startWorldX: world.x,
            startWorldY: world.y,
            originPhotoX: stateRef.current.photoX,
            originPhotoY: stateRef.current.photoY,
        };
    };

    const onHandlePointerDown = (handle) => (event) => {
        if (!ready) return;
        event.stopPropagation();
        event.preventDefault();
        event.currentTarget.setPointerCapture?.(event.pointerId);

        const { photoX: px, photoY: py, photoScale: ps, naturalW: nw, naturalH: nh } = stateRef.current;
        const w = nw * ps;
        const h = nh * ps;
        const cx = px + w / 2;
        const cy = py + h / 2;
        const stagePos = getPointerStagePos(event);
        const world = stageToWorld(stagePos.x, stagePos.y);
        const dist = Math.max(8, Math.hypot(world.x - cx, world.y - cy));

        interactionRef.current = {
            type: 'resize',
            handle,
            originScale: ps,
            originPhotoX: px,
            originPhotoY: py,
            centerX: cx,
            centerY: cy,
            startDist: dist,
            naturalW: nw,
            naturalH: nh,
        };
    };

    const handleCrop = () => {
        const img = imgRef.current;
        const { photoX: px, photoY: py, photoScale: ps, viewZoom: z } = stateRef.current;
        if (!img || !ready || !ps) return;

        // Crop window in stage coords → world coords (viewZoom around stage center)
        const worldCropLeft = STAGE_W / 2 + (CROP_LEFT - STAGE_W / 2) / z;
        const worldCropTop = STAGE_H / 2 + (CROP_TOP - STAGE_H / 2) / z;
        const worldCropW = CROP_W / z;
        const worldCropH = CROP_H / z;

        const sx = (worldCropLeft - px) / ps;
        const sy = (worldCropTop - py) / ps;
        const sw = worldCropW / ps;
        const sh = worldCropH / ps;

        const canvas = document.createElement('canvas');
        canvas.width = OUT_W;
        canvas.height = OUT_H;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';

        // Rounded clip to match preview window
        ctx.beginPath();
        const r = (CROP_RADIUS / CROP_W) * OUT_W;
        const w = OUT_W;
        const h = OUT_H;
        ctx.moveTo(r, 0);
        ctx.arcTo(w, 0, w, h, r);
        ctx.arcTo(w, h, 0, h, r);
        ctx.arcTo(0, h, 0, 0, r);
        ctx.arcTo(0, 0, w, 0, r);
        ctx.closePath();
        ctx.clip();

        ctx.drawImage(img, sx, sy, sw, sh, 0, 0, OUT_W, OUT_H);
        onCrop?.(canvas.toDataURL('image/jpeg', 0.92));
    };

    if (!src) return null;

    const displayW = natural.w * photoScale;
    const displayH = natural.h * photoScale;

    // Затемнение только по площади фото вне окна обрезки
    const photoShadeClipPath = (() => {
        if (!ready || !displayW || !displayH) return undefined;
        const z = viewZoom || 1;
        const worldCropLeft = STAGE_W / 2 + (CROP_LEFT - STAGE_W / 2) / z;
        const worldCropTop = STAGE_H / 2 + (CROP_TOP - STAGE_H / 2) / z;
        const holeW = CROP_W / z;
        const holeH = CROP_H / z;
        const x = worldCropLeft - photoX;
        const y = worldCropTop - photoY;
        return `polygon(evenodd, 0 0, ${displayW}px 0, ${displayW}px ${displayH}px, 0 ${displayH}px, 0 0, ${x}px ${y}px, ${x}px ${y + holeH}px, ${x + holeW}px ${y + holeH}px, ${x + holeW}px ${y}px, ${x}px ${y}px)`;
    })();

    return (
        <div className="photoCropModal" role="dialog" aria-modal="true" aria-labelledby="photo-crop-title">
            <div className="photoCropModal__layout">
            <div className="photoCropModal__card">
                <h2 id="photo-crop-title" className="photoCropModal__title">
                    Выровняйте лицо по трафарету
                </h2>

                <div className="photoCropModal__body">
                <div
                    className="photoCropModal__stage"
                    ref={stageRef}
                    style={{ width: STAGE_W, height: STAGE_H }}
                >
                    <div
                        className="photoCropModal__world"
                        style={{ transform: `scale(${viewZoom})` }}
                    >
                        <div
                            className="photoCropModal__photo"
                            style={{
                                width: displayW || undefined,
                                height: displayH || undefined,
                                transform: `translate(${photoX}px, ${photoY}px)`,
                                opacity: ready ? 1 : 0,
                            }}
                            onPointerDown={onPhotoPointerDown}
                        >
                            <img
                                ref={imgRef}
                                src={src}
                                alt=""
                                className="photoCropModal__image"
                                draggable={false}
                                onLoad={(event) => fitImage(event.currentTarget)}
                            />
                            {photoShadeClipPath ? (
                                <div
                                    className="photoCropModal__photoShade"
                                    style={{ clipPath: photoShadeClipPath }}
                                    aria-hidden="true"
                                />
                            ) : null}
                        </div>
                    </div>

                    <div className="photoCropModal__crop" aria-hidden="true">
                        <div
                            className="photoCropModal__cropHole"
                            style={{ width: CROP_W, height: CROP_H, left: CROP_LEFT, top: CROP_TOP }}
                        />
                        <img
                            className="photoCropModal__silhouette"
                            src={trafaretSrc}
                            alt=""
                            draggable={false}
                            style={{
                                left: CROP_LEFT + CROP_W * 0.11,
                                top: CROP_TOP + CROP_H * 0.08 + 20,
                                width: CROP_W * 0.78,
                            }}
                        />
                    </div>

                    {/* Синяя рамка фото поверх затемнения — её двигаем под окно обрезки */}
                    <div
                        className="photoCropModal__world photoCropModal__world--chrome"
                        style={{ transform: `scale(${viewZoom})` }}
                    >
                        <div
                            className="photoCropModal__photoFrame"
                            style={{
                                width: displayW || undefined,
                                height: displayH || undefined,
                                transform: `translate(${photoX}px, ${photoY}px)`,
                                opacity: ready ? 1 : 0,
                            }}
                            onPointerDown={onPhotoPointerDown}
                        >
                            <div className="photoCropModal__photoBounds" aria-hidden="true" />
                            {ready ? (
                                <>
                                    {['n', 's', 'e', 'w', 'ne', 'nw', 'se', 'sw'].map((handle) => (
                                        <button
                                            key={handle}
                                            type="button"
                                            className={`photoCropModal__handle photoCropModal__handle--${handle}`}
                                            style={{ cursor: HANDLE_CURSORS[handle] }}
                                            aria-label={`Изменить размер фото (${handle})`}
                                            onPointerDown={onHandlePointerDown(handle)}
                                        />
                                    ))}
                                </>
                            ) : null}
                        </div>
                    </div>
                </div>

                </div>
            </div>

            <div className="photoCropModal__actions">
                <button
                    type="button"
                    className="photoCropModal__btn photoCropModal__btn--crop"
                    onClick={handleCrop}
                    disabled={!ready}
                >
                    Обрезать
                </button>
                <button type="button" className="photoCropModal__btn photoCropModal__btn--reset" onClick={onReset}>
                    Сбросить
                </button>
            </div>
            </div>
        </div>
    );
};

export default PhotoCropModal;
