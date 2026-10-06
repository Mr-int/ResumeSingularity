import './photoUploader.css';
import ImageDropzone from './ImageDropzone/ImageDropzone.jsx';
import PhotoExamples from './PhotoExamples/PhotoExamples.jsx';

const PhotoUploader = ({ examples = [], onFileSelect, onExampleSelect }) => {
    return (
        <section className="photoUploader">
            <h2>Загрузка фото</h2>
            <ImageDropzone onFileSelect={onFileSelect} />
            <PhotoExamples examples={examples} onSelect={onExampleSelect} />
        </section>
    );
};

export default PhotoUploader;
