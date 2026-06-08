import React, { useMemo } from 'react';

function buildCompletenessItems(profile, portfolioCount = 0) {
    const skills = Array.isArray(profile?.skills) ? profile.skills : [];
    return [
        {
            id: 'name',
            label: 'Имя и фамилия',
            done: Boolean(profile?.firstName?.trim() && profile?.lastName?.trim()),
        },
        {
            id: 'photo',
            label: 'Фото профиля',
            done: Boolean(profile?.imagePath),
        },
        {
            id: 'about',
            label: 'Раздел «Обо мне»',
            done: (profile?.bio || '').trim().length >= 30,
        },
        {
            id: 'city',
            label: 'Город',
            done: Boolean((profile?.city || '').trim()),
        },
        {
            id: 'speciality',
            label: 'Специальность',
            done: Boolean(profile?.specialityId ?? profile?.speciality),
        },
        {
            id: 'skills',
            label: 'Навыки (хотя бы один)',
            done: skills.length > 0,
        },
        {
            id: 'portfolio',
            label: 'Портфолио или ссылки',
            done: portfolioCount > 0,
        },
        {
            id: 'hh',
            label: 'Ссылка на hh.ru',
            done: Boolean((profile?.hhLink || '').trim()),
        },
    ];
}

const StudentProfileMetaFooter = ({
    profile,
    portfolioCount = 0,
    publicProfileConsent,
    onConsentChange,
    consentSaving,
    consentError,
}) => {
    const items = useMemo(
        () => buildCompletenessItems(profile, portfolioCount),
        [profile, portfolioCount],
    );
    const doneCount = items.filter((item) => item.done).length;
    const totalCount = items.length;
    const percent = totalCount ? Math.round((doneCount / totalCount) * 100) : 0;

    const handleShowcaseToggle = () => {
        if (consentSaving) return;
        onConsentChange?.(!publicProfileConsent);
    };

    return (
        <div className="accountPage__profileMeta">
            <div className="accountPage__completeness">
                <div className="accountPage__completenessHead">
                    <span className="accountPage__completenessLabel">Готовность резюме</span>
                    <span className="accountPage__completenessValue">
                        {doneCount}/{totalCount}
                    </span>
                </div>
                <p className="accountPage__completenessHint">
                    Заполните пункты ниже — так рекрутеры быстрее найдут ваш профиль. Сейчас готово{' '}
                    {percent}%.
                </p>
                <div className="accountPage__completenessTrack" aria-hidden="true">
                    <div className="accountPage__completenessFill" style={{ width: `${percent}%` }} />
                </div>
                <ul className="accountPage__completenessList">
                    {items.map((item) => (
                        <li
                            key={item.id}
                            className={`accountPage__completenessItem${item.done ? ' accountPage__completenessItem--done' : ''}`}
                        >
                            <span className="accountPage__completenessMark" aria-hidden="true">
                                {item.done ? '✓' : '○'}
                            </span>
                            {item.label}
                        </li>
                    ))}
                </ul>
            </div>

            <div className="accountPage__showcaseCard">
                <button
                    type="button"
                    role="switch"
                    aria-checked={Boolean(publicProfileConsent)}
                    aria-label="Публичная витрина"
                    className={`accountPage__showcaseSwitch${publicProfileConsent ? ' accountPage__showcaseSwitch--on' : ''}`}
                    disabled={consentSaving}
                    onClick={handleShowcaseToggle}
                />
                <span className="accountPage__showcaseText">
                    <span className="accountPage__showcaseTitle">Публичная витрина</span>
                    <span className="accountPage__showcaseDesc">
                        Показывать мою карточку на главной странице без входа на сайт. Можно включить и
                        выключить в любой момент.
                    </span>
                </span>
            </div>

            {consentError ? (
                <div className="accountPage__error accountPage__profileMetaError" role="alert">
                    {consentError}
                </div>
            ) : null}
        </div>
    );
};

export default StudentProfileMetaFooter;
