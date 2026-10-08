const rawBase = import.meta.env.BASE_URL || '/';

/** Публичный префикс из Vite `base`: `/` или `/plt/`. */
export const APP_BASE_URL = rawBase.endsWith('/') ? rawBase : `${rawBase}/`;

/** Basename для React Router. На корне сайта не задаётся. */
export const routerBasename =
    APP_BASE_URL === '/' ? undefined : APP_BASE_URL.replace(/\/$/, '');

/** Абсолютный путь браузера с учётом префикса площадки. */
export const appPath = (path) => {
    const suffix = String(path).replace(/^\//, '');
    return `${APP_BASE_URL}${suffix}`;
};
