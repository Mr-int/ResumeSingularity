import { useState } from 'react';
import './imageDropzone.css';

const MAX_BYTES = 4 * 1024 * 1024;
const ACCEPT = 'image/jpeg,image/png';

const isAllowedFile = (file) => {
    if (!file) return false;
    const typeOk = file.type === 'image/jpeg' || file.type === 'image/png';
    const sizeOk = file.size <= MAX_BYTES;
    return typeOk && sizeOk;
};

const ImageDropzone = ({ onFileSelect }) => {
    const [isDragging, setIsDragging] = useState(false);

    const pickFile = (file) => {
        if (!isAllowedFile(file)) return;
        onFileSelect?.(file);
    };

    const handleChange = (event) => {
        pickFile(event.target.files?.[0]);
        event.target.value = '';
    };

    const handleDragOver = (event) => {
        event.preventDefault();
        setIsDragging(true);
    };

    const handleDragLeave = (event) => {
        event.preventDefault();
        setIsDragging(false);
    };

    const handleDrop = (event) => {
        event.preventDefault();
        setIsDragging(false);
        pickFile(event.dataTransfer.files?.[0]);
    };

    return (
        <label
            className={`imageDropzone${isDragging ? ' is-dragging' : ''}`}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
        >
            <input type="file" accept={ACCEPT} onChange={handleChange} />
            <div className="imageDropzone__icon" aria-hidden="true">
                <div className="imageDropzone__iconBg" />
                <div className="imageDropzone__iconMain">
                    <svg viewBox="0 0 24 24">
                        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M17 8l-5-5-5 5M12 3v12" />
                    </svg>
                </div>
            </div>
            <span className="imageDropzone__text">формат jpeg/png, не более 4мб</span>
        </label>
    );
};

export default ImageDropzone;
