export const API_BASE_URL = '/api/';

/**
 * Получить URL изображения через эндпоинт /main/photo/{image_path}
 * @param {string} imagePath - Путь к изображению из поля image в теле ответа
 * @returns {string} Полный URL изображения
 */
export const getImageUrl = (imagePath) => {
    if (!imagePath) {
        return null;
    }
    // Если путь уже полный URL, возвращаем как есть
    if (imagePath.startsWith('http://') || imagePath.startsWith('https://')) {
        return imagePath;
    }
    // Если путь начинается с /main/photo/, используем его напрямую
    if (imagePath.startsWith('/main/photo/')) {
        return `${API_BASE_URL}${imagePath.replace(/^\//, '')}`;
    }
    // Иначе добавляем /main/photo/ перед путем
    const cleanPath = imagePath.startsWith('/') ? imagePath.slice(1) : imagePath;
    return `${API_BASE_URL}main/photo/${cleanPath}`;
};

