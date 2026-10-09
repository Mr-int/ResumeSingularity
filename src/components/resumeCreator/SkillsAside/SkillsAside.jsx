import { useEffect, useState } from 'react';
import './skillsAside.css';

const PolygonIcon = () => (
    <svg className="skillsAside__iconPolygon" viewBox="0 0 24 24" aria-hidden="true">
        <path d="M12 2L2 9l4 11h12l4-11z" />
    </svg>
);

const MemoIcon = () => (
    <svg className="skillsAside__iconMemo" viewBox="0 0 24 24" aria-hidden="true">
        <path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-5 14H7v-2h7v2zm3-4H7v-2h10v2zm0-4H7V7h10v2z" />
    </svg>
);

const ArrowIcon = () => (
    <svg className="skillsAside__arrow" viewBox="0 0 24 24" aria-hidden="true">
        <path d="M6 9l6 6 6-6" />
    </svg>
);

const RemoveIcon = () => (
    <svg viewBox="0 0 10 10" aria-hidden="true">
        <path d="M1 1l8 8M9 1L1 9" />
    </svg>
);

const toContent = (item) => {
    if (typeof item.content === 'string' && item.content.trim()) return item.content.trim();
    if (Array.isArray(item.bullets) && item.bullets.length) return item.bullets.join(' ');
    return '';
};

const SkillsAside = ({
    skills = [],
    selectedSkills = [],
    memoItems = [],
    onToggle,
}) => {
    const [openId, setOpenId] = useState(null);

    useEffect(() => {
        setOpenId(null);
    }, [memoItems]);

    const selectedList = selectedSkills
        .map((id) => skills.find((skill) => String(skill.id) === String(id)))
        .filter(Boolean);

    return (
        <aside className="skillsAside">
            <div className="skillsAside__block">
                <div className="skillsAside__blockHeader">
                    <PolygonIcon />
                    <h2 className="skillsAside__blockTitle">Выбранные навыки</h2>
                </div>

                <div className="skillsAside__selectedGrid">
                    {selectedList.length === 0 ? (
                        <div className="skillsAside__selectedEmpty">Пока ничего не выбрано</div>
                    ) : (
                        selectedList.map((skill) => (
                            <button
                                key={skill.id}
                                type="button"
                                className="skillsAside__selectedBadge"
                                aria-label={`Убрать ${skill.name}`}
                                onClick={() => onToggle?.(skill.id)}
                            >
                                <span>{skill.name}</span>
                                <span className="skillsAside__remove" aria-hidden="true">
                                    <RemoveIcon />
                                </span>
                            </button>
                        ))
                    )}
                </div>
            </div>

            <div className="skillsAside__block">
                <div className="skillsAside__blockHeader">
                    <MemoIcon />
                    <h2 className="skillsAside__blockTitle">Памятка</h2>
                </div>

                <div className="skillsAside__accordion">
                    {memoItems.map((item) => {
                        const isOpen = openId === item.id;
                        const content = toContent(item);

                        return (
                            <div
                                key={item.id}
                                className={`skillsAside__accordionItem${isOpen ? ' is-open' : ''}`}
                            >
                                <button
                                    type="button"
                                    className="skillsAside__accordionSummary"
                                    aria-expanded={isOpen}
                                    onClick={() => setOpenId(isOpen ? null : item.id)}
                                >
                                    <span className="skillsAside__accordionText">{item.title}</span>
                                    <ArrowIcon />
                                </button>
                                {isOpen && content ? (
                                    <div className="skillsAside__accordionContent">{content}</div>
                                ) : null}
                            </div>
                        );
                    })}
                </div>
            </div>
        </aside>
    );
};

export default SkillsAside;
