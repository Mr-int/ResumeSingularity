import { normalizePhone } from './phoneFormat.js';

export const BUSYNESS_OPTIONS = [
    { value: 'FREE', label: 'Свободен' },
    { value: 'FREELANCE', label: 'Фриланс' },
    { value: 'EMPLOYED', label: 'Занят' },
];

export const COURSE_OPTIONS = [
    { value: 'FIRST', label: '1 курс' },
    { value: 'SECOND', label: '2 курс' },
    { value: 'THIRD', label: '3 курс' },
    { value: 'FOURTH', label: '4 курс' },
];

export const emptyExperienceRow = () => ({
    key: `exp-${Date.now()}-${Math.random()}`,
    companyName: '',
    position: '',
    additionalInfo: '',
    startDate: '',
    endDate: '',
});

export const emptyInstitutionRow = () => ({
    key: `edu-${Date.now()}-${Math.random()}`,
    institution: '',
    webUrl: '',
    additionalInfo: '',
    startYear: '',
    endYear: '',
});

export const emptyStudentResumeForm = () => ({
    firstName: '',
    lastName: '',
    email: '',
    city: '',
    hhLink: '',
    birthDate: '',
    bio: '',
    busyness: 'FREE',
    course: '',
    phoneNumber: '',
    telegramUsername: '',
    specialityId: '',
    skillsIds: [],
});

export const mapExperiencePayload = (rows) =>
    rows
        .filter((row) => row.position.trim() && row.companyName.trim() && row.startDate)
        .map((row) => ({
            companyName: row.companyName.trim(),
            position: row.position.trim(),
            additionalInfo: row.additionalInfo.trim() || undefined,
            startDate: row.startDate,
            endDate: row.endDate || undefined,
        }));

export const mapInstitutionPayload = (rows) =>
    rows
        .filter((row) => row.institution.trim() && row.webUrl.trim() && row.startYear && row.endYear)
        .map((row) => ({
            institution: row.institution.trim(),
            webUrl: row.webUrl.trim(),
            additionalInfo: row.additionalInfo.trim() || undefined,
            startYear: Number(row.startYear),
            endYear: Number(row.endYear),
        }));

export const mapProfileToEditForm = (profile) => {
    if (!profile) return null;
    const hasProfile =
        profile.specialityId != null ||
        profile.firstName ||
        profile.lastName ||
        profile.email ||
        profile.phoneNumber;
    if (!hasProfile) return null;
    return {
        firstName: profile.firstName || '',
        lastName: profile.lastName || '',
        email: profile.email || '',
        city: profile.city || '',
        hhLink: profile.hhLink || '',
        birthDate: profile.birthDate || '',
        bio: profile.bio || '',
        busyness: profile.busyness || 'FREE',
        course: profile.course && profile.course !== 'NEW' ? profile.course : '',
        phoneNumber: profile.phoneNumber || '',
        telegramUsername: profile.telegramUsername || '',
        specialityId: profile.specialityId != null ? String(profile.specialityId) : '',
        skillsIds: Array.isArray(profile.skills)
            ? profile.skills.map((s) => s.id).filter((id) => id != null)
            : Array.isArray(profile.skillsIds)
              ? profile.skillsIds
              : [],
        experiences: profile.experiences || [],
        institutions: profile.institutions || [],
    };
};

export const buildStudentResumePayload = (form, experienceRows, institutionRows) => {
    const phoneRaw = form.phoneNumber.trim();
    const phoneNumber = phoneRaw ? normalizePhone(phoneRaw) : undefined;
    return {
    firstName: form.firstName.trim(),
    lastName: form.lastName.trim(),
    email: form.email.trim(),
    city: form.city.trim() || undefined,
    hhLink: form.hhLink.trim() || undefined,
    birthDate: form.birthDate || undefined,
    bio: form.bio.trim() || undefined,
    busyness: form.busyness,
    course: form.course || undefined,
    phoneNumber,
    telegramUsername: form.telegramUsername.trim().replace(/^@/, '') || undefined,
    specialityId: Number(form.specialityId),
    skillsIds: form.skillsIds.length ? form.skillsIds : [],
    experiences: mapExperiencePayload(experienceRows),
    institutions: mapInstitutionPayload(institutionRows),
};
};
