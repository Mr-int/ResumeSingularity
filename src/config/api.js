export const API_BASE_URL = '/api/';

/**
 * Получить URL изображения через эндпоинт /main/photo/{image_path}
 * @param {string} imagePath - Путь к изображению из поля imagePath в теле ответа
 * @returns {string} Полный URL изображения
 */
export const getImageUrl = (imagePath) => {
    if (!imagePath) {
        console.log('[getImageUrl] No imagePath provided');
        return null;
    }
    
    console.log('[getImageUrl] Input imagePath:', imagePath);
    
    // Если путь уже полный URL, возвращаем как есть
    if (imagePath.startsWith('http://') || imagePath.startsWith('https://')) {
        console.log('[getImageUrl] Full URL detected, returning as is');
        return imagePath;
    }
    
    // Убираем начальный слеш, если он есть
    const cleanPath = imagePath.startsWith('/') ? imagePath.slice(1) : imagePath;
    
    // Формируем URL: /api/main/photo/{imagePath}
    const finalUrl = `${API_BASE_URL}main/photo/${cleanPath}`;
    console.log('[getImageUrl] Final URL:', finalUrl);
    
    return finalUrl;
};

