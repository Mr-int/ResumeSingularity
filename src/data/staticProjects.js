import GameChebImg from '../assets/other/GameCheb.png';
import VrImg from '../assets/other/vrProject.png';
import resumeProjectImg from '../assets/logos/singularityLogo.svg';
import { getProjectsForViewer } from '../services/projectsApi.js';
import { getProjectCoverUrl, getProjectTheme } from '../utils/projectUtils.js';

export const STATIC_PROJECTS = [
    {
        id: 'static-1',
        title: 'GameCheb',
        section: 'Игры',
        summary:
            'Это туристический сервис нового поколения для регионов России, где прогулки по городам превращаются в увлекательное приключение.',
        body: 'Мы создаем сервис с интерактивными маршрутами и голосовым гидом, который помогает исследовать города России. С телефоном и наушниками ты открываешь как популярные, так и малоизвестные места, а гид рассказывает всё, что интересно в путешествии.\n\nНаша миссия — сохранить чувашскую культуру в настоящем через современный бизнес и туризм.',
        tags: ['Культура', 'Бизнес', 'IT'],
        imageSrc: GameChebImg,
        theme: 'gamecheb',
    },
    {
        id: 'static-2',
        title: 'Singularity Resume',
        section: 'Веб-разработка',
        summary:
            'Этот сайт создавали студенты нашего колледжа. Начиная с идеи, продолжая дизайном, и заканчивая разработкой.',
        body: 'Платформа-каталог резюме студентов IT-колледжа Singularity: работодатели могут быстро просматривать карточки, фильтровать по стеку и направлению, открывать унифицированные резюме и отправлять заявки на стажировку.\n\nЗадача проекта — минимизировать время поиска кандидата и упростить коммуникацию между работодателем, куратором и студентом.',
        tags: ['Python', 'JavaScript', 'React', 'Figma', 'PostgreSQL'],
        imageSrc: resumeProjectImg,
        theme: 'resume',
    },
    {
        id: 'static-3',
        title: 'VR-музей',
        section: 'VR / AR',
        summary:
            'Иммерсивный образовательный опыт: искусство и история в виртуальной реальности.',
        body: 'VR-музей — это современный образовательный инструмент, делающий изучение искусства и истории увлекательным.\n\nВиртуальная реальность позволяет рассматривать эпохи и культуру, а также проживать события внутри картин. Такой формат сочетает обучение, интерактив и практику, усиливает интерес и понимание материала.',
        tags: ['Unreal Engine 5', 'VR', 'C++'],
        imageSrc: VrImg,
        theme: 'vr',
    },
];

export function getStaticProjectById(id) {
    return STATIC_PROJECTS.find((project) => String(project.id) === String(id)) ?? null;
}

export function isStaticProjectId(id) {
    return String(id).startsWith('static');
}

/** Формат для модалки и карточек сетки. */
export function toProjectViewModel(project, index = 0) {
    if (!project) return null;
    return {
        ...project,
        skills: (project.tags ?? project.skills ?? []).map((tag, tagIndex) =>
            typeof tag === 'string'
                ? { id: tagIndex, name: tag }
                : tag,
        ),
        images: project.imageSrc
            ? [{ imageUrl: project.imageSrc, sortOrder: 0 }]
            : project.images ?? [],
        theme: project.theme ?? getProjectTheme(index),
    };
}

export function mapApiProjectToViewModel(project, index = 0) {
    if (!project) return null;
    const cover = getProjectCoverUrl(project);
    return toProjectViewModel(
        {
            ...project,
            summary: project.summary || '',
            body: project.body || project.summary || '',
            imageSrc: cover,
            tags: (project.skills ?? []).map((skill) => skill.name).filter(Boolean),
            theme: getProjectTheme(index),
        },
        index,
    );
}

/** Каталог проектов только из API (без устаревших статических карточек). */
export async function loadAllProjectsCatalog() {
    try {
        const rows = await getProjectsForViewer();
        return rows
            .map((row, index) => mapApiProjectToViewModel(row, index))
            .filter(Boolean);
    } catch (error) {
        console.warn('[Projects] API catalog unavailable', error);
        return [];
    }
}
