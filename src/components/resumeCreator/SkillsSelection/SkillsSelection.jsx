import { useState } from 'react';
import './skillsSelection.css';

const SearchIcon = () => (
    <svg className="skillsSelection__searchIcon" viewBox="0 0 24 24" aria-hidden="true">
        <path d="M15.5 14h-.79l-.28-.27C15.41 12.59 16 11.11 16 9.5 16 5.91 13.09 3 9.5 3S3 5.91 3 9.5 5.91 16 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z" />
    </svg>
);

const SkillsSelection = ({
    skills = [],
    selectedSkills = [],
    onAdd,
}) => {
    const [query, setQuery] = useState('');
    const normalizedQuery = query.trim().toLowerCase();

    const filteredSkills = skills.filter((skill) =>
        (skill?.name || '').toLowerCase().includes(normalizedQuery)
    );

    return (
        <section className="skillsSelection">
            <h2 className="skillsSelection__title">Добавьте навыки</h2>
            <p className="skillsSelection__subtitle">
                Эти навыки будут находиться в вашем резюме
            </p>

            <div className="skillsSelection__searchWrap">
                <SearchIcon />
                <input
                    className="skillsSelection__search"
                    type="search"
                    placeholder="Поиск"
                    autoComplete="off"
                    value={query}
                    onChange={(event) => setQuery(event.target.value)}
                />
            </div>

            <div className="skillsSelection__pool">
                {filteredSkills.length === 0 ? (
                    <div className="skillsSelection__poolEmpty">Ничего не найдено</div>
                ) : (
                    filteredSkills.map((skill) => {
                        const skillId = skill.id;
                        const isAdded = selectedSkills.some((id) => String(id) === String(skillId));

                        return (
                            <button
                                key={skillId}
                                type="button"
                                className={`skillsSelection__poolBadge${isAdded ? ' is-added' : ''}`}
                                disabled={isAdded}
                                onClick={() => {
                                    if (!isAdded) onAdd?.(skillId);
                                }}
                            >
                                {skill.name}
                            </button>
                        );
                    })
                )}
            </div>
        </section>
    );
};

export default SkillsSelection;
