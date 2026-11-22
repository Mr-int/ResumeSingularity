import { getImageUrl } from '../config/api.js';

export const REQUEST_STATUS = {
    OPEN: 'Открыта',
    CLOSED: 'Закрыта',
    ARCHIVED: 'В архиве',
};

export const RESPONSE_STATUS = {
    PENDING: 'Ждёт решения',
    ACCEPTED: 'Принят',
    REJECTED: 'Отказ',
};

export const COOPERATION_FORMAT = {
    SEMESTER_PROJECT: 'Проект на семестр',
    SUMMER_PRACTICE: 'Летняя практика',
    INTERNSHIP: 'Стажировка',
    VACANCY: 'Вакансия',
    OTHER: 'Другое',
};

const asArray = (value) => (Array.isArray(value) ? value : []);

export function labelOf(map, key, fallback = 'Не указано') {
    if (key == null || key === '') return fallback;
    return Object.prototype.hasOwnProperty.call(map, key) ? map[key] : String(key);
}

/**
 * Имена справочника по ID. Неизвестные ID не выводим «как есть»,
 * чтобы в интерфейсе не появлялись сырые числовые идентификаторы.
 */
export function namesById(ids, options = []) {
    const byId = new Map();
    asArray(options).forEach((item) => {
        if (item?.id == null || !item?.name) return;
        byId.set(String(item.id), String(item.name));
    });

    const names = [];
    asArray(ids).forEach((id) => {
        if (id == null || id === '') return;
        const name = byId.get(String(id));
        if (name && !names.includes(name)) names.push(name);
    });

    return names.length ? names.join(', ') : '—';
}

export function projectImageSrc(image) {
    if (!image) return null;
    if (typeof image === 'string') return image || null;
    if (image.imageUrl) return String(image.imageUrl);
    if (image.url) return String(image.url);
    if (image.imagePath) return getImageUrl(image.imagePath);
    return null;
}

export function sortedImages(images) {
    return asArray(images)
        .filter((image) => image && typeof image === 'object')
        .slice()
        .sort((a, b) => {
            const first = Number.isFinite(Number(a.sortOrder)) ? Number(a.sortOrder) : 0;
            const second = Number.isFinite(Number(b.sortOrder)) ? Number(b.sortOrder) : 0;
            return first - second;
        });
}

const LOCAL_DATE_TIME = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}/;

export function formatWhen(value) {
    if (!value) return 'без ограничения';
    const text = String(value);
    if (!LOCAL_DATE_TIME.test(text)) return '—';
    const date = new Date(text.length === 16 ? `${text}:00` : text);
    if (Number.isNaN(date.getTime())) return '—';
    return text.replace('T', ' ').slice(0, 16);
}

export function toApiDateTime(value) {
    if (value == null) return null;
    const text = String(value).trim();
    if (!text) return null;
    if (!LOCAL_DATE_TIME.test(text)) return null;

    // datetime-local хранит локальное время без зоны — не преобразуем его в UTC,
    // чтобы сервер получил те же часы, которые выбрал пользователь.
    const withSeconds = text.length === 16 ? `${text}:00` : text.slice(0, 19);
    const date = new Date(withSeconds);
    if (Number.isNaN(date.getTime())) return null;
    return withSeconds;
}

export function fromApiDateTime(value) {
    if (!value) return '';
    const text = String(value);
    if (!LOCAL_DATE_TIME.test(text)) return '';
    return text.slice(0, 16);
}

export function emptyRequestForm() {
    return {
        tasks: '',
        qualificationRequirements: '',
        workConditions: '',
        studentCount: '1',
        cooperationFormat: '',
        readyToRequestStudents: '',
        scheduleNote: '',
        extraInfo: '',
        publishedFrom: '',
        publishedTo: '',
        specialityIds: [],
        cityIds: [],
    };
}

const idsFrom = (value) =>
    asArray(value)
        .map((item) => (item && typeof item === 'object' ? item.id : item))
        .map(Number)
        .filter((id) => Number.isInteger(id) && id > 0);

export function formFromRequest(row) {
    let ready = '';
    if (row?.readyToRequestStudents === true) ready = 'yes';
    if (row?.readyToRequestStudents === false) ready = 'no';

    const count = Number(row?.studentCount);
    return {
        tasks: row?.tasks ?? '',
        qualificationRequirements: row?.qualificationRequirements ?? '',
        workConditions: row?.workConditions ?? '',
        studentCount: String(Number.isInteger(count) && count > 0 ? count : 1),
        cooperationFormat: row?.cooperationFormat ?? '',
        readyToRequestStudents: ready,
        scheduleNote: row?.scheduleNote ?? '',
        extraInfo: row?.extraInfo ?? '',
        publishedFrom: fromApiDateTime(row?.publishedFrom),
        publishedTo: fromApiDateTime(row?.publishedTo),
        specialityIds: idsFrom(row?.specialityIds),
        cityIds: idsFrom(row?.cityIds),
    };
}

export function payloadFromForm(form) {
    const source = form || {};
    const tasks = String(source.tasks ?? '').trim();
    const qualificationRequirements = String(source.qualificationRequirements ?? '').trim();
    const workConditions = String(source.workConditions ?? '').trim();
    const studentCount = Number(source.studentCount);
    const specialityIds = [...new Set(idsFrom(source.specialityIds))];
    const cityIds = [...new Set(idsFrom(source.cityIds))];
    const publishedFrom = toApiDateTime(source.publishedFrom);
    const publishedTo = toApiDateTime(source.publishedTo);

    if (!tasks || !qualificationRequirements || !workConditions) {
        throw new Error('Заполните задачи, требования и условия работы');
    }
    if (!Number.isInteger(studentCount) || studentCount < 1) {
        throw new Error('Укажите число студентов от 1');
    }
    if (!specialityIds.length) throw new Error('Выберите хотя бы одну специальность');
    if (!cityIds.length) throw new Error('Выберите хотя бы один город');
    if (source.publishedFrom && !publishedFrom) {
        throw new Error('Проверьте дату начала публикации');
    }
    if (source.publishedTo && !publishedTo) {
        throw new Error('Проверьте дату окончания публикации');
    }
    if (publishedFrom && publishedTo && publishedFrom > publishedTo) {
        throw new Error('Начало публикации позже её конца');
    }

    let readyToRequestStudents = null;
    if (source.readyToRequestStudents === 'yes') readyToRequestStudents = true;
    if (source.readyToRequestStudents === 'no') readyToRequestStudents = false;

    const optionalText = (value) => String(value ?? '').trim() || null;

    return {
        tasks,
        qualificationRequirements,
        workConditions,
        studentCount,
        cooperationFormat: source.cooperationFormat || null,
        readyToRequestStudents,
        scheduleNote: optionalText(source.scheduleNote),
        extraInfo: optionalText(source.extraInfo),
        publishedFrom,
        publishedTo,
        specialityIds,
        cityIds,
    };
}

/**
 * Frontend-проверка владельца заявки: сервер всё равно обязан
 * авторизовать каждое действие. Если бэкенд не возвращает ID владельца,
 * решение остаётся за сервером — интерфейс действия не скрывает.
 */
const OWNER_FIELDS = [
    'recruiterId',
    'employerId',
    'companyId',
    'ownerId',
    'createdById',
    'userId',
];

export function belongsToUser(row, userId) {
    const known = OWNER_FIELDS
        .map((field) => row?.[field])
        .filter((value) => value !== undefined && value !== null && value !== '');
    if (!known.length || !userId) return true;
    return known.some((value) => String(value) === String(userId));
}
