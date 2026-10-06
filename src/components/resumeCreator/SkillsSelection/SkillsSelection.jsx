import { useState } from 'react';
import './skillsSelection.css';

const SkillsSelection = ({
    skills = [],
    selectedSkills = [],
    onToggle,
}) => {
    const [query, setQuery] = useState('');
    const filteredSkills = skills.filter((skill) =>
        (skill?.name || '').toLowerCase().includes(query.toLowerCase())
    );

    return (
        <section className="skillsSelection">
            <h2>Навыки</h2>
            <input
                className="skillsSelection__search"
                type="search"
                placeholder="Поиск по навыкам"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
            />
            <div className="skillsSelection__grid">
                {filteredSkills.map((skill) => {
                    const isActive = selectedSkills.includes(skill.id);

                    return (
                        <button
                            key={skill.id}
                            type="button"
                            className={`skillsSelection__tag ${isActive ? 'is-active' : ''}`}
                            onClick={() => onToggle?.(skill.id)}
                        >
                            {skill.name}
                        </button>
                    );
                })}
            </div>
        </section>
    );
};

export default SkillsSelection;
