import { getImageUrl } from '../config/api.js';

const CARD_THEMES = ['gamecheb', 'resume', 'vr'];

/**
 * @param {{ images?: Array, imagePath?: string, imageUrl?: string } | null | undefined} project
 */
export function getProjectImages(project) {
    if (!project) return [];
    if (Array.isArray(project.images) && project.images.length > 0) {
        return [...project.images].sort(
            (a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0),
        );
    }
    if (project.imageUrl || project.imagePath) {
        return [{ imagePath: project.imagePath, imageUrl: project.imageUrl, sortOrder: 0 }];
    }
    return [];
}

export function resolveProjectImageUrl(image) {
    if (!image) return null;
    if (image.imageUrl) return image.imageUrl;
    return getImageUrl(image.imagePath);
}

export function getProjectCoverUrl(project) {
    if (project?.imageSrc) return project.imageSrc;
    const images = getProjectImages(project);
    return images.length ? resolveProjectImageUrl(images[0]) : null;
}

export function getProjectTheme(index) {
    return CARD_THEMES[index % CARD_THEMES.length];
}
