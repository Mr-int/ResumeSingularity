import './photoUploader.css';
import ImageDropzone from './ImageDropzone/ImageDropzone.jsx';
import PhotoExamples from './PhotoExamples/PhotoExamples.jsx';
import PhotoReadyCard from './PhotoReadyCard/PhotoReadyCard.jsx';

const PhotoUploader = ({
    examples = [],
    photoSrc = null,
    photoName = '',
    onFileSelect,
    onExampleSelect,
    onReplacePhoto,
}) => {
    const hasPhoto = Boolean(photoSrc);

    return (
        <section className="photoUploader">
            <h2>Загрузка фото</h2>
            {hasPhoto ? (
                <PhotoReadyCard
                    src={photoSrc}
                    fileName={photoName || 'photo.jpeg'}
                    onReplace={onReplacePhoto}
                />
            ) : (
                <ImageDropzone onFileSelect={onFileSelect} />
            )}
            <PhotoExamples examples={examples} onSelect={onExampleSelect} />
        </section>
    );
};

export default PhotoUploader;
