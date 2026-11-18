import dmitry from '../../assets/employerLanding/dmitry-nvG23uSh.webp';
import victoria from '../../assets/employerLanding/victoria-DObxGTen.webp';
import artemy from '../../assets/employerLanding/artemy-C0QOx-MM.webp';
import mikhail from '../../assets/employerLanding/mikhail-CiQVpqLF.webp';
import maria from '../../assets/employerLanding/maria-DUfeMMdg.webp';
import boris from '../../assets/employerLanding/boris-fwp4StYu.webp';
import javaJob from '../../assets/employerLanding/java-job-wYXHV7Xy.png';
import javaGrade from '../../assets/employerLanding/java-grade-DVQ2p5J3.png';
import pythonJob from '../../assets/employerLanding/python-job-BZazhPrZ.png';
import pythonGrade from '../../assets/employerLanding/python-grade-9vvyeWTk.png';
import backendJob from '../../assets/employerLanding/backend-job-Cgrqg0gw.png';
import backendGrade from '../../assets/employerLanding/backend-grade-CSuBksys.png';
import designJob from '../../assets/employerLanding/design-job.svg';
import designGrade from '../../assets/employerLanding/design-grade.svg';
import uxJob from '../../assets/employerLanding/ux-job-SPmOMK4n.png';
import webJob from '../../assets/employerLanding/web-job-BZLVxNw_.png';
import slideshifter from '../../assets/employerLanding/project-slideshifter-DbxoYdzT.webp';
import keisenpai from '../../assets/employerLanding/project-keisenpai-DDo3_J4o.webp';
import arProject from '../../assets/employerLanding/project-ar-CXGiwQAq.webp';
import folder from '../../assets/employerLanding/folder-hover-DV2o-WV3.png';
import pencil from '../../assets/employerLanding/pencil-hover-BiLLQF0L.png';
import cursor from '../../assets/employerLanding/cursor-hover-CWPbwdpX.png';
import smile from '../../assets/employerLanding/smile-effect-Cq5lISj_.png';
import oleg from '../../assets/employerLanding/oleg-new-BaRIKPj_.png';
import olga from '../../assets/employerLanding/olga.png';
import timur from '../../assets/employerLanding/timur-new-CEbMlTDC.png';
import yana from '../../assets/employerLanding/yana-new-KOpeHQxV.png';

export const students = [
  {
    id: 'dmitry',
    name: 'Дмитрий Александров',
    lines: ['Дмитрий', 'Александров'],
    role: 'Java-разработчик',
    course: '1 курс',
    photo: dmitry,
    job: javaJob,
    grade: javaGrade,
    theme: 'amber',
    jobShadow: true,
    project: {
      title: 'Бот для записи на занятия',
      kind: 'code',
      description: 'Бот Запис — это помощник который записывает студентов колледжа на занятия, и напоминает о них. Так же автоматически добавляет слоты в календарь ученика.',
    },
  },
  {
    id: 'victoria',
    name: 'Виктория Анисимова',
    lines: ['Виктория', 'Анисимова'],
    role: 'Python-разработчик',
    course: '2 курс',
    photo: victoria,
    job: pythonJob,
    grade: pythonGrade,
    theme: 'green',
    jobShadow: true,
    project: {
      title: 'Листаем презентацию жестами',
      image: slideshifter,
      description: 'SlideShifter — это программа сделанная для управления презентацией жестами, была разработана на замену базовым кликерам.',
    },
  },
  {
    id: 'artemy',
    name: 'Артемий Трихалкин',
    lines: ['Артемий', 'Трихалкин'],
    role: 'Backend-разработчик',
    course: '3 курс',
    photo: artemy,
    job: backendJob,
    grade: backendGrade,
    theme: 'pink',
    project: {
      title: 'Изучай японский с аниме-аватаром',
      image: keisenpai,
      description: 'Keisenpai — это интерактивная платформа-лаборатория, которая помогает людям комфортно изучать японский язык онлайн.',
    },
  },
  {
    id: 'mikhail',
    name: 'Михаил Степанов',
    lines: ['Михаил', 'Степанов'],
    role: 'Графический дизайнер',
    course: 'Выпускник',
    photo: mikhail,
    job: designJob,
    grade: designGrade,
    theme: 'blue',
    project: {
      title: 'Табличка на памятник с AR-шоу',
      image: arProject,
      description: 'Дизайн таблички-лайтбокса для памятника А. Г. Николаева, который привлекает внимание туристов и прохожих отсканировать QR и увидеть AR-шоу.',
    },
  },
];

export const formats = [
  {
    id: 'project',
    title: 'Проектная активность',
    lines: ['Проектная', 'активность'],
    period: 'В течение семестра',
    description: 'Поручите студентам конкретные задачи в течение учёбы',
    image: folder,
  },
  {
    id: 'practice',
    title: 'Профессиональная практика',
    lines: ['Профессиональная', 'практика'],
    period: 'В течение каникул',
    description: 'Познакомьте студентов с работой компании на реальных задачах',
    image: pencil,
  },
  {
    id: 'internship',
    title: 'Учебная стажировка',
    lines: ['Учебная', 'стажировка'],
    period: 'Во время обучения',
    description: 'Пригласите студента в команду с нагрузкой, совместимой с учёбой',
    image: cursor,
  },
  {
    id: 'vacancy',
    title: 'Полноценная вакансия',
    lines: ['Полноценная', 'вакансия'],
    description: 'Найдите начинающего специалиста для долгосрочного сотрудничества',
    image: smile,
    smile: true,
  },
];

export const partners = [
  {
    id: 'oleg',
    quote: 'Студенческая команда показала техническую грамотность и готовность работать с реальными банковскими требованиями. Результат соответствует целям ТЗ и обладает потенциалом для пилотного внедрения',
    name: 'Олег Галкин',
    organization: 'Представитель Альфа-Банк',
    portrait: oleg,
  },
  {
    id: 'olga',
    quote: 'Команда студентов разработала для нас чат-бота. Ребята всегда были на связи и сами замечали, что нужно доработать. Спасибо за качественную работу — будем рады видеть вас в нашем коллективе',
    name: 'Ольга Филиппова',
    organization: 'Минтруд Чувашии',
    portrait: olga,
  },
  {
    id: 'timur',
    quote: 'Практикант быстро осваивал новые технологии и ответственно подходил к задачам, соблюдая сроки и требования. Самостоятельно восполнил недостающие знания, не перегружая тимлида вопросами. Проявлял инициативу при поиске оптимальных решений.',
    name: 'Тимур Сагитов',
    organization: 'Представитель sudo teach IT',
    portrait: timur,
  },
  {
    id: 'yana',
    quote: 'Работать со студенческой командой было одно удовольствие. У нас был проект с огромным количеством контента, текстов и структурой лендинга на четыре страницы. Всё удалось! Очень рада результату и благодарна девушкам за работу. Передаю им привет и желаю успехов в дальнейшем карьерном пути.',
    name: 'Яна Сергиевская',
    organization: 'Руководитель проектов\n«Палисадники в Переделкино»',
    portrait: yana,
  },
];

export const steps = [
  ['01', 'Зарегистрируйтесь'],
  ['02', 'Выберите студента или оставьте предложение'],
  ['03', 'Свяжитесь со студентом'],
];

export const stepDescriptions = [
  'Получите доступ к полным резюме и проектам',
  'Подберите сотрудников на ваш тип задач, либо поручите это нам',
  'Возьмите студента на собеседование',
];

const extraCards = [
  { id: 'maria', lines: ['Мария', 'Матвеева'], role: 'UX/UI-дизайнер', photo: maria, job: uxJob, jobShadow: true, grade: backendGrade },
  { id: 'boris', lines: ['Борис', 'Григорьев'], role: 'Веб-разработчик', photo: boris, job: webJob, jobShadow: true, grade: javaGrade },
];

const fanSource = [students[1], students[3], students[2], extraCards[0], extraCards[1], students[0]];

export const fanCards = Array.from({ length: 14 }, (_, index) => fanSource[index % fanSource.length]);
