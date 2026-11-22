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

export function labelOf(map, key, fallback = 'Не указано') {
    if (key == null || key === '') return fallback;
    return map[key] || String(key);
}

export function namesById(ids, options) {
    const byId = new Map((options || []).map((item) => [Number(item.id), item.name]));
    const names = (ids || []).map((id) => byId.get(Number(id)) || String(id));
    return names.length ? names.join(', ') : '—';
}

export function projectImageSrc(image) {
    if (!image) return null;
    if (image.imageUrl) return image.imageUrl;
    return getImageUrl(image.imagePath);
}

export function sortedImages(images) {
    return [...(images || [])].sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0));
}

export function formatWhen(value) {
    if (!value) return 'без ограничения';
    return String(value).replace('T', ' ').slice(0, 16);
}

export function toApiDateTime(value) {
    if (!value) return null;
    const text = String(value).trim();
    if (!text) return null;
    if (text.length === 16) return `${text}:00`;
    return text;
}

export function fromApiDateTime(value) {
    if (!value) return '';
    const text = String(value);
    return text.length >= 16 ? text.slice(0, 16) : text;
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

export function formFromRequest(row) {
    let ready = '';
    if (row?.readyToRequestStudents === true) ready = 'yes';
    if (row?.readyToRequestStudents === false) ready = 'no';
    return {
        tasks: row?.tasks ?? '',
        qualificationRequirements: row?.qualificationRequirements ?? '',
        workConditions: row?.workConditions ?? '',
        studentCount: String(row?.studentCount ?? 1),
        cooperationFormat: row?.cooperationFormat ?? '',
        readyToRequestStudents: ready,
        scheduleNote: row?.scheduleNote ?? '',
        extraInfo: row?.extraInfo ?? '',
        publishedFrom: fromApiDateTime(row?.publishedFrom),
        publishedTo: fromApiDateTime(row?.publishedTo),
        specialityIds: (row?.specialityIds ?? []).map(Number),
        cityIds: (row?.cityIds ?? []).map(Number),
    };
}

export function payloadFromForm(form) {
    const tasks = form.tasks.trim();
    const qualificationRequirements = form.qualificationRequirements.trim();
    const workConditions = form.workConditions.trim();
    const studentCount = Number(form.studentCount);
    const specialityIds = [...new Set(form.specialityIds.map(Number))].filter((id) => Number.isInteger(id) && id > 0);
    const cityIds = [...new Set(form.cityIds.map(Number))].filter((id) => Number.isInteger(id) && id > 0);
    const publishedFrom = toApiDateTime(form.publishedFrom);
    const publishedTo = toApiDateTime(form.publishedTo);

    if (!tasks || !qualificationRequirements || !workConditions) {
        throw new Error('Заполните задачи, требования и условия работы');
    }
    if (!Number.isInteger(studentCount) || studentCount < 1) {
        throw new Error('Укажите число студентов от 1');
    }
    if (!specialityIds.length) throw new Error('Выберите хотя бы одну специальность');
    if (!cityIds.length) throw new Error('Выберите хотя бы один город');
    if (publishedFrom && publishedTo && publishedFrom > publishedTo) {
        throw new Error('Начало публикации позже её конца');
    }

    let readyToRequestStudents = null;
    if (form.readyToRequestStudents === 'yes') readyToRequestStudents = true;
    if (form.readyToRequestStudents === 'no') readyToRequestStudents = false;

    return {
        tasks,
        qualificationRequirements,
        workConditions,
        studentCount,
        cooperationFormat: form.cooperationFormat || null,
        readyToRequestStudents,
        scheduleNote: form.scheduleNote.trim() || null,
        extraInfo: form.extraInfo.trim() || null,
        publishedFrom,
        publishedTo,
        specialityIds,
        cityIds,
    };
}
