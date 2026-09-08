export const API_BASE_URL = '/api/';

/**
 * Получить URL изображения через эндпоинт /main/photo/{image_path}
 * @param {string} imagePath - Путь к изображению из поля imagePath в теле ответа
 * @returns {string} Полный URL изображения
 */
export const getImageUrl = (imagePath) => {
    if (!imagePath) return null;

    if (imagePath.startsWith('http://') || imagePath.startsWith('https://')) {
        return imagePath;
    }

    const cleanPath = imagePath.startsWith('/') ? imagePath.slice(1) : imagePath;
    return `${API_BASE_URL}main/photo/${cleanPath}`;
};

