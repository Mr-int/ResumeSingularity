import './imageDropzone.css';

const ImageDropzone = ({ onFileSelect }) => {
    const handleChange = (event) => {
        const file = event.target.files?.[0];
        if (file) {
            onFileSelect?.(file);
        }
    };

    return (
        <label className="imageDropzone">
            <input type="file" accept="image/*" onChange={handleChange} />
            <span className="imageDropzone__title">Перетащите фото сюда</span>
            <span className="imageDropzone__hint">или нажмите, чтобы выбрать файл</span>
        </label>
    );
};

export default ImageDropzone;
