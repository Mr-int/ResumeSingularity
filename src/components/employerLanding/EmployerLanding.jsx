import { useEffect, useLayoutEffect, useReducer, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import AppHeader from '../header/Header.jsx';
import { AUTH_CHANGE_EVENT, getStoredRole, isAuthenticated } from '../../services/authApi.js';
import { LandingButton, scrollToSection } from './LandingButton.jsx';
import { fanCards, formats, partners, stepDescriptions, steps, students } from './landingData.js';
import logo from '../../assets/employerLanding/logo-BP31CTL4.svg';
import logoFooter from '../../assets/employerLanding/logo-footer-D5pzOq6b.svg';
import heroPortrait from '../../assets/employerLanding/hero-cards-2-a7-WB3X3.png';
import heroPhoto from '../../assets/employerLanding/hero-cards-1-CuadYg_C.jpg';
import heroSymbols from '../../assets/employerLanding/project-symbols-C5FQKJ8b.svg';
import heroDecorTop from '../../assets/employerLanding/hero-decoration-top.svg';
import heroDecorSymbols from '../../assets/employerLanding/hero-decoration-symbols.svg';
import heroKey from '../../assets/employerLanding/hero-key-DFbITLLN.png';
import heroBottom from '../../assets/employerLanding/hero-bottom-CqERG1aV.svg';
import designJob from '../../assets/employerLanding/design-job.svg';
import designGrade from '../../assets/employerLanding/design-grade.svg';
import arrowUp from '../../assets/employerLanding/arrow-up.svg';
import workSide from '../../assets/employerLanding/work-side-C4jbWlsS.svg';
import pink from '../../assets/employerLanding/pink-BAcFL0oG.png';
import blue from '../../assets/employerLanding/blue-Dex7Kiai.png';
import orange from '../../assets/employerLanding/orange-BfvMtxWF.png';
import clouds from '../../assets/employerLanding/clouds-BKnMDreN.webp';
import quote from '../../assets/employerLanding/quote.png';
import './employerLanding.css';

const LOGIN = '/login';
const REGISTER = '/registration';
const ringFront = 'M230.39016 93.2769 C247 64.5 288 65 305 77 C324 90.4 319.5 106.5 308.2285 118.6892';
const ringBack = `${ringFront} C283 146 229 138 227 111 C226.5 104 227.5 98.3 230.39016 93.2769 Z`;
const holePath = 'M225 103 C226.5 99.5 228.2 97.1 230.39016 93.2769 C247 64.5 288 65 305 77 C324 90.4 319.5 106.5 308.2285 118.6892 C304.5 122.7 301.5 125.2 298 127';

const NAV = [
  { id: 'projects', label: 'Проекты', section: 'students-projects', title: 'students-title' },
  { id: 'offers', label: 'Предложения', section: 'work-types', title: 'work-types-title' },
  { id: 'reviews', label: 'Отзывы', section: 'partners', title: 'partners-title' },
];

function Ring({ hole, back }) {
  const origin = hole === 'student' ? [230.39016, 93.2769] : [308.2285, 118.6892];
  const viewBox = hole ? `${origin[0] - 11.5} ${origin[1] - 11.5} 23 23` : '0 0 677 456';
  const d = hole ? holePath : back ? ringBack : ringFront;
  return (
    <svg className={hole ? 'keychain-hole__continuation' : 'keychain-ring__arch'} viewBox={viewBox} aria-hidden="true">
      {[0, 1, 2].map((index) => <path key={index} d={d} />)}
    </svg>
  );
}

/** Публичный маркетинговый header — только для гостей и не-рекрутеров. */
function LandingHeader() {
  return (
    <header className="site-header">
      <div className="site-header__brand">
        <a href="#main" aria-label="Сингулярити Резюме — главная">
          <img src={logo} width="206" height="34" alt="Сингулярити Резюме" />
        </a>
      </div>
      <nav className="site-header__nav" aria-label="Основная навигация">
        {NAV.map((item) => (
          <button key={item.id} type="button" onClick={() => scrollToSection(item.section, item.title)}>
            {item.label}
          </button>
        ))}
      </nav>
      <div className="site-header__actions">
        <LandingButton className="button--header" to={REGISTER}>Регистрация</LandingButton>
        <LandingButton className="button--header" variant="quiet" to={LOGIN}>Войти</LandingButton>
      </div>
    </header>
  );
}

function HeroVisual() {
  const visualRef = useRef(null);
  const [scale, setScale] = useState(1);
  useEffect(() => {
    const node = visualRef.current;
    const observer = new ResizeObserver(([entry]) => setScale(entry.contentRect.width / 584));
    observer.observe(node);
    return () => observer.disconnect();
  }, []);
  return (
    <div className="hero-visual" ref={visualRef}>
      <div className="hero-artboard" style={{ transform: `scale(${scale})` }}>
        <img className="hero-decoration hero-decoration--top" src={heroDecorTop} alt="" aria-hidden="true" />
        <img className="hero-decoration hero-decoration--symbols" src={heroDecorSymbols} alt="" aria-hidden="true" />
        <img className="hero-decoration hero-decoration--bottom" src={heroBottom} alt="" aria-hidden="true" />
        <div className="keychain-scene">
          <div className="keychain-ring keychain-ring--back" aria-hidden="true"><Ring back /></div>
          <article className="project-keychain" aria-label="Проект Михаила Степанова">
            <span className="project-keychain__hole" aria-hidden="true"><Ring hole="project" /></span>
            <img className="project-keychain__symbols" src={heroSymbols} alt="" aria-hidden="true" />
            <div className="project-keychain__photo">
              <img src={heroPhoto} alt="Табличка с QR-кодом и дополненной реальностью" width="1734" height="976" />
            </div>
            <div className="project-keychain__copy">
              <p className="project-keychain__label">Проект</p>
              <h2>Дизайн таблички<br />на памятник с AR-шоу</h2>
              <Link to={REGISTER}>Смотреть работу <img src={arrowUp} alt="" aria-hidden="true" /></Link>
            </div>
          </article>
          <img className="keychain-key" src={heroKey} alt="" aria-hidden="true" />
          <article className="student-keychain" aria-label="Михаил Степанов — графический дизайнер">
            <div className="student-keychain__portrait">
              <img src={heroPortrait} alt="Михаил Степанов" width="940" height="1016" />
            </div>
            <div className="student-keychain__badges" aria-hidden="true">
              <img className="student-keychain__job" src={designJob} alt="" />
              <img className="student-keychain__grade" src={designGrade} alt="" />
            </div>
            <span className="student-keychain__hole" aria-hidden="true"><Ring hole="student" /></span>
            <div className="student-keychain__copy">
              <h2>Михаил<br />Степанов</h2>
              <p>Графический дизайнер</p>
            </div>
          </article>
          <div className="keychain-ring keychain-ring--front" aria-hidden="true"><Ring /></div>
        </div>
      </div>
    </div>
  );
}

function Hero() {
  return (
    <section className="hero" aria-labelledby="hero-title">
      <div className="hero__inner">
        <div className="hero__copy">
          <div className="hero__message">
            <h1 id="hero-title">
              Найдите<br /><span>сотрудника</span><br />среди студентов<br />колледжа
            </h1>
            <p className="hero__description">
              Дизайнеры, разработчики, маркетологи и другие студенты — для проектов, практики и работы в вашей команде.
            </p>
          </div>
          <div className="hero__actions">
            <LandingButton arrow="up-right" to={REGISTER}>Зарегистрироваться</LandingButton>
            <LandingButton variant="outline" arrow="down" onClick={() => scrollToSection('students-projects', 'students-title')}>
              Узнать больше
            </LandingButton>
          </div>
        </div>
        <HeroVisual />
      </div>
    </section>
  );
}

function CodePreview() {
  return (
    <div className="code-preview" aria-label="Пример кода бота для записи на занятия">
      <div className="code-preview__filename">booking_bot.py</div>
      <pre>
        <code>
          <span className="code-keyword">async def</span>
          {' book_slot():\n  slot = '}
          <span className="code-keyword">await</span>
          {' choose_time()\n  '}
          <span className="code-keyword">await</span>
          {' confirm(slot)\n\n'}
          <span className="code-success">Запись подтверждена</span>
        </code>
      </pre>
    </div>
  );
}

function StudentsRail() {
  const [active, setActive] = useState('dmitry');
  const railRef = useRef(null);
  const viewportRef = useRef(null);
  const pointer = useRef({ x: null, y: null });

  function updateFade() {
    const rail = railRef.current;
    const viewport = viewportRef.current;
    if (!rail || !viewport) return;
    viewport.dataset.fadeLeft = String(rail.scrollLeft > 1);
    viewport.dataset.fadeRight = String(rail.scrollWidth - rail.clientWidth - rail.scrollLeft > 1);
  }

  useEffect(() => {
    const observer = new ResizeObserver(updateFade);
    observer.observe(railRef.current);
    updateFade();
    return () => observer.disconnect();
  }, []);

  function onPointerMove(event) {
    if (event.pointerType === 'touch' || !matchMedia('(hover: hover) and (pointer: fine)').matches) return;
    if (pointer.current.x === event.clientX && pointer.current.y === event.clientY) return;
    pointer.current = { x: event.clientX, y: event.clientY };
    const card = event.target.closest('[data-student]');
    if (card && card.dataset.student !== active) setActive(card.dataset.student);
  }

  return (
    <section className="students-projects" id="students-projects" aria-labelledby="students-title">
      <div className="students-projects__inner">
        <header className="students-projects__heading">
          <h2 id="students-title" tabIndex={-1}>
            <span>Студенты</span><br />и проекты, которые за них говорят.
          </h2>
          <p>Оцените работу, познакомьтесь с автором и предложите вашу задачу.</p>
        </header>
        <div className="students-projects__viewport" ref={viewportRef}>
          <div
            className="students-projects__rail"
            ref={railRef}
            onPointerMove={onPointerMove}
            onScroll={updateFade}
            role="region"
            aria-label="Студенты и их проекты — горизонтальный список"
            tabIndex={0}
          >
            {students.map((student) => {
              const open = active === student.id;
              return (
                <article key={student.id} data-student={student.id} className={`student-card student-card--${student.theme}${open ? ' is-expanded' : ''}`}>
                  <div className="student-card__person">
                    <button
                      type="button"
                      className="student-card__select"
                      onClick={() => setActive(student.id)}
                      aria-expanded={open}
                      aria-label={`Показать проект: ${student.name}`}
                    >
                      <span className="student-card__portrait">
                        <img className={`student-card__photo${student.id === 'artemy' ? ' student-card__photo--backend' : ''}`} src={student.photo} width="212" height="230" alt={student.name} loading="lazy" />
                        <span className="student-card__badges" aria-hidden="true">
                          <img className={`student-card__job${student.jobShadow ? ' student-card__job--shadow' : ''}`} src={student.job} alt="" />
                          <img className="student-card__grade" src={student.grade} alt="" />
                        </span>
                      </span>
                      <span className="student-card__identity">
                        <span className="student-card__name">{student.lines[0]}<br />{student.lines[1]}</span>
                        <span className="student-card__role">{student.role}</span>
                        {open ? <span className="student-card__course">{student.course}</span> : null}
                      </span>
                    </button>
                    {open ? (
                      <Link className="student-card__project-link" to={REGISTER}>
                        Смотреть проект <img src={arrowUp} alt="" aria-hidden="true" />
                      </Link>
                    ) : null}
                  </div>
                  <div className="student-card__project" aria-hidden={!open}>
                    {student.project.kind === 'code' ? <CodePreview /> : (
                      <img className="student-card__project-image" src={student.project.image} alt={student.project.title} width="403" height="204" loading="lazy" />
                    )}
                    <div className="student-card__project-copy">
                      <h3>{student.project.title}</h3>
                      <p>{student.project.description}</p>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        </div>
        <div className="students-projects__actions">
          <LandingButton arrow="up-right" to={REGISTER}>Все студенты</LandingButton>
          <LandingButton variant="outline" arrow="up-right" to={REGISTER}>Все проекты</LandingButton>
        </div>
      </div>
    </section>
  );
}

function WorkTypes() {
  const [active, setActive] = useState('project');
  const sectionRef = useRef(null);
  const pointer = useRef({ x: null, y: null });

  useEffect(() => {
    const node = sectionRef.current;
    const reduced = matchMedia('(prefers-reduced-motion: reduce)');
    const observer = new IntersectionObserver(([entry]) => {
      node.dataset.ambient = entry.isIntersecting && !reduced.matches ? 'running' : 'paused';
    });
    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  function onPointerMove(event) {
    if (event.pointerType === 'touch' || !matchMedia('(hover: hover) and (pointer: fine)').matches) return;
    if (pointer.current.x === event.clientX && pointer.current.y === event.clientY) return;
    pointer.current = { x: event.clientX, y: event.clientY };
    const card = event.target.closest('[data-format]');
    if (card) setActive(card.dataset.format);
  }

  return (
    <section className="work-types" id="work-types" aria-labelledby="work-types-title" ref={sectionRef}>
      <div className="work-types__panel">
        <div className="work-types__backdrop" aria-hidden="true" />
        <header className="work-types__heading">
          <h2 id="work-types-title" tabIndex={-1}>Начните с задачи<br />или сразу с вакансии.</h2>
          <p>Выберите формат под ваши интересы и возможности.</p>
        </header>
        <img className="work-types__decor work-types__decor--side" src={workSide} alt="" aria-hidden="true" />
        <div className="work-types__cards" onPointerMove={onPointerMove}>
          {formats.map((format) => {
            const open = active === format.id;
            return (
              <div key={format.id} className={`cooperation-slot cooperation-slot--${format.id}`}>
                <div className="cooperation-card__surface">
                  <article
                    data-format={format.id}
                    className={`cooperation-card cooperation-card--${format.id}${open ? ' is-expanded' : ''}`}
                    aria-labelledby={`format-${format.id}`}
                    onFocusCapture={() => setActive(format.id)}
                  >
                    <button type="button" className="cooperation-card__toggle" onClick={() => setActive(format.id)}>
                      <div className="cooperation-card__copy">
                        <h3 id={`format-${format.id}`}>{format.lines[0]}<br />{format.lines[1]}</h3>
                        {format.period ? <p className="cooperation-card__period">{format.period}</p> : null}
                        <p className="cooperation-card__description">{format.description}</p>
                      </div>
                    </button>
                    <img
                      className={`cooperation-card__illustration${format.smile ? ' cooperation-card__illustration--smile' : ''}`}
                      src={format.image}
                      alt=""
                      aria-hidden="true"
                    />
                    {open ? (
                      <LandingButton variant="quiet" className="cooperation-card__action cooperation-card__action--link" arrow="up-right" to={REGISTER}>
                        Отправить предложение
                      </LandingButton>
                    ) : null}
                  </article>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

function CooperationScene({ step }) {
  const scenes = [pink, blue, orange];
  return (
    <div className={`cooperation-scene cooperation-scene--${step + 1}`} aria-hidden="true">
      <img className="cooperation-scene__background" src={scenes[step]} alt="" />
      <div className="cooperation-device">
        <div className="cooperation-device__screen">
          {step === 0 ? (
            <>
              <img className="cooperation-device__logo" src={logo} alt="" />
              <p className="cooperation-device__headline">Найдите <span>сотрудника</span></p>
              <span className="cooperation-screen-button cooperation-screen-button--register">Зарегистрироваться</span>
            </>
          ) : null}
          {step === 1 ? (
            <>
              {students.slice(0, 3).map((student, index) => (
                <div key={student.id} className={`cooperation-mini cooperation-mini--${index}`}>
                  <div className="cooperation-mini__portrait">
                    <img src={student.photo} alt="" />
                  </div>
                  <p className="cooperation-mini__name">{student.lines[0]}</p>
                  <p className="cooperation-mini__role">{student.role}</p>
                </div>
              ))}
              <span className="cooperation-screen-button cooperation-screen-button--resume">Резюме</span>
              <span className="cooperation-screen-button cooperation-screen-button--offer">Предложение</span>
            </>
          ) : null}
          {step === 2 ? (
            <>
              <div className="cooperation-conversation__person">
                <div className="cooperation-conversation__avatar">
                  <img src={students[3].photo} alt="" />
                  <span />
                </div>
                <div>
                  <p>Дмитрий Александров</p>
                  <span>C++ разработчик</span>
                </div>
              </div>
              <p className="cooperation-conversation__date">Сегодня</p>
              <p className="cooperation-message cooperation-message--outgoing">
                Привет, хорошее портфолио, не против если мы поставим собеседование?
                <time>10:12</time>
              </p>
              <p className="cooperation-message cooperation-message--incoming">
                Да, я не против
                <time>10:24</time>
              </p>
              <span className="cooperation-screen-button cooperation-screen-button--interview">Назначить собеседование</span>
            </>
          ) : null}
        </div>
      </div>
    </div>
  );
}

function StartCooperation() {
  const sectionRef = useRef(null);
  const [step, setStep] = useState(0);
  const [complete, setComplete] = useState(false);

  useLayoutEffect(() => {
    const node = sectionRef.current;
    const media = matchMedia('(min-width: 1001px) and (min-height: 720px) and (prefers-reduced-motion: no-preference)');
    let frame = 0;
    let start = 0;
    let distance = 0;
    const update = () => {
      frame = 0;
      if (!media.matches) return;
      const progress = Math.max(0, Math.min(1, (window.scrollY - start) / distance));
      const next = progress < 0.3 ? 0 : progress < 0.63 ? 1 : 2;
      setStep(next);
      setComplete(progress >= 0.88);
    };
    const onScroll = () => {
      if (!frame && media.matches) frame = requestAnimationFrame(update);
    };
    const measure = () => {
      node.toggleAttribute('data-scroll-story', media.matches);
      if (!media.matches) {
        node.style.removeProperty('height');
        setComplete(false);
        return;
      }
      distance = Math.round(window.innerHeight * 2);
      node.style.height = `${window.innerHeight + distance}px`;
      start = node.getBoundingClientRect().top + window.scrollY;
      update();
    };
    measure();
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', measure);
    media.addEventListener('change', measure);
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', measure);
      media.removeEventListener('change', measure);
      node.removeAttribute('data-scroll-story');
      node.style.removeProperty('height');
    };
  }, []);

  return (
    <section className="start-cooperation" id="start-cooperation" ref={sectionRef} aria-labelledby="start-title">
      <div className="start-cooperation__viewport">
        <div className="start-cooperation__inner">
          <div className="start-cooperation__content">
            <h2 id="start-title">Давайте начнем<br />сотрудничество</h2>
            <div className="start-cooperation__guide">
              <ol className="cooperation-steps">
                {steps.map(([number, title], index) => (
                  <li key={number} className={`cooperation-step${step === index ? ' is-current' : ''}`}>
                    <button type="button" className="cooperation-step__trigger" onClick={() => { setStep(index); setComplete(false); }}>
                      <span className="cooperation-step__number">{number}</span>
                      <span className="cooperation-step__title">{title}</span>
                    </button>
                  </li>
                ))}
              </ol>
              <p className="start-cooperation__description">{stepDescriptions[step]}</p>
            </div>
            <div className={`start-cooperation__completion${complete ? ' is-visible' : ''}`}>
              <LandingButton className="start-cooperation__action" arrow="up-right" to={REGISTER}>Зарегистрироваться</LandingButton>
            </div>
          </div>
          <CooperationScene step={step} />
        </div>
      </div>
    </section>
  );
}

function Partners() {
  const railRef = useRef(null);
  const [fade, setFade] = useState({ left: false, right: true });
  function update() {
    const rail = railRef.current;
    if (!rail) return;
    const left = rail.scrollLeft > 1;
    const right = rail.scrollWidth - rail.clientWidth - rail.scrollLeft > 1;
    setFade((prev) => (prev.left === left && prev.right === right ? prev : { left, right }));
  }
  useEffect(() => {
    const observer = new ResizeObserver(update);
    observer.observe(railRef.current);
    update();
    return () => observer.disconnect();
  }, []);
  return (
    <section className="partners" id="partners" aria-labelledby="partners-title">
      <div className="partners__inner">
        <h2 id="partners-title" tabIndex={-1}><span>Партнеры</span><br />о совместной работе</h2>
        <div className="partners__viewport" data-fade-left={fade.left} data-fade-right={fade.right}>
          <div className="partners__rail" ref={railRef} onScroll={update} tabIndex={0} role="region" aria-label="Отзывы партнеров — горизонтальная прокрутка">
            {partners.map((partner) => (
              <figure key={partner.id} className="partner-review">
                <blockquote>
                  <span className="partner-review__quote" aria-hidden="true"><img src={quote} width="24" height="24" alt="" /></span>
                  <p>{partner.quote}</p>
                </blockquote>
                <figcaption className="partner-review__author">
                  <img src={partner.portrait} width="128" height="128" alt="" loading="lazy" />
                  <div className="partner-review__identity">
                    <p className="partner-review__name">{partner.name}</p>
                    <p className="partner-review__organization">{partner.organization}</p>
                  </div>
                </figcaption>
              </figure>
            ))}
          </div>
        </div>
        <LandingButton className="partners__action" arrow="up-right" to={REGISTER}>Стать партнером</LandingButton>
      </div>
    </section>
  );
}

function FinalCta() {
  return (
    <section className="final-cta" id="find-your-team" aria-labelledby="final-cta-title">
      <div className="final-cta__clouds" aria-hidden="true">
        <img src={clouds} width="1707" height="934" alt="" loading="lazy" />
      </div>
      <div className="final-cta__heading">
        <h2 id="final-cta-title" tabIndex={-1}>Найдите того,<br />кто усилит вашу команду</h2>
        <LandingButton className="final-cta__action" arrow="up-right" to={REGISTER}>Зарегистрироваться</LandingButton>
      </div>
      <div className="final-cta__fan" aria-hidden="true">
        {fanCards.map((card, index) => {
          const angle = (index - 2) * (360 / 14);
          const radians = angle * Math.PI / 180;
          return (
            <div
              key={`${card.id}-${index}`}
              className="showcase-card"
              style={{ transform: `translate(${649 * Math.sin(radians) - 116}px, ${690 * (1 - Math.cos(radians))}px) rotate(${angle}deg)` }}
            >
              <div className="showcase-card__portrait">
                <img className={`showcase-card__photo${card.id === 'artemy' ? ' showcase-card__photo--backend' : ''}`} src={card.photo} width="212" height="230" alt="" loading="lazy" />
                <div className="showcase-card__badges">
                  <img className={`showcase-card__job${card.jobShadow ? ' showcase-card__job--shadow' : ''}`} src={card.job} alt="" />
                  <img className="showcase-card__grade" src={card.grade} alt="" />
                </div>
              </div>
              <div className="showcase-card__identity">
                <p className="showcase-card__name">{card.lines[0]}<br />{card.lines[1]}</p>
                <p className="showcase-card__role">{card.role}</p>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}

function Footer() {
  return (
    <footer className="site-footer" id="footer">
      <div className="site-footer__inner">
        <nav className="site-footer__nav" aria-label="Навигация в подвале">
          {NAV.map((item) => (
            <a
              key={item.id}
              href={`#${item.section}`}
              onClick={(event) => {
                if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
                event.preventDefault();
                scrollToSection(item.section, item.title);
              }}
            >
              {item.label}
            </a>
          ))}
        </nav>
        <div className="site-footer__contact">
          <p>Почта для связи</p>
          <a href="mailto:singularity.resume@mail.ru">singularity.resume@mail.ru</a>
        </div>
        <a className="site-footer__brand" href="#main" aria-label="Сингулярити Резюме — к началу страницы">
          <img src={logoFooter} width="304" height="53" alt="Сингулярити Резюме" loading="lazy" />
        </a>
      </div>
    </footer>
  );
}

export function EmployerLanding() {
  const [, refreshAuthState] = useReducer((value) => value + 1, 0);

  useEffect(() => {
    const readAuthSnapshot = () => `${isAuthenticated()}:${getStoredRole()}`;
    let lastSnapshot = readAuthSnapshot();
    const handleAuthChange = () => {
      const snapshot = readAuthSnapshot();
      if (snapshot === lastSnapshot) return;
      lastSnapshot = snapshot;
      refreshAuthState();
    };

    window.addEventListener(AUTH_CHANGE_EVENT, handleAuthChange);
    window.addEventListener('storage', handleAuthChange);
    return () => {
      window.removeEventListener(AUTH_CHANGE_EVENT, handleAuthChange);
      window.removeEventListener('storage', handleAuthChange);
    };
  }, []);

  // Авторизованный партнёр видит тот же header, что и на внутренних страницах.
  // Гости сохраняют прежний публичный лендинг; студенческий интерфейс не затрагивается.
  const isRecruiter = isAuthenticated() && getStoredRole() === 'RECRUITER';

  return (
    <div className="employer-landing">
      <a className="skip-link" href="#main">Перейти к содержимому</a>
      {isRecruiter ? <AppHeader /> : <LandingHeader />}
      <main id="main" tabIndex={-1}>
        <Hero />
        <StudentsRail />
        <WorkTypes />
        <StartCooperation />
        <Partners />
        <FinalCta />
      </main>
      <Footer />
    </div>
  );
}
