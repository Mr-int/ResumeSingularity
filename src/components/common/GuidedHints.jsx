import React, { useEffect, useState } from 'react';
import { syncAuthSession, isHintsDisabled } from '../../services/authApi.js';
import { patchStudentMe } from '../../services/accountApi.js';
import './guidedHints.css';

const HINTS = {
    resume: [
        'Укажите реальные контакты — рекрутеры смогут связаться после заявки.',
        'Выберите специальность и навыки — так вас найдут в каталоге.',
        'Курс NEW скрывает профиль до модерации администратором.',
        'После одобрения включите показ на публичной витрине в настройках.',
    ],
    vacancy: [
        'Заполните название и описание — модератор проверит вакансию перед публикацией.',
        'Отметьте «Видна без регистрации», если хотите показывать вакансию гостям.',
        'После создания отправьте черновик на модерацию в «Мои вакансии».',
    ],
};

const storageKey = (formId) => `resumeGuidedHintsSeen:${formId}`;

/**
 * Подсказки при первом создании резюме/вакансии; кнопка «Показать снова»; учёт hintsDisabled с auth/me.
 */
const GuidedHints = ({ formId, title = 'Подсказки' }) => {
    const [visible, setVisible] = useState(false);
    const [dismissed, setDismissed] = useState(false);
    const [hintsOff, setHintsOff] = useState(false);

    const items = HINTS[formId] || [];

    useEffect(() => {
        let cancelled = false;
        (async () => {
            await syncAuthSession();
            if (cancelled) return;
            const disabled = isHintsDisabled();
            setHintsOff(disabled);
            if (disabled) {
                setVisible(false);
                return;
            }
            const seen = localStorage.getItem(storageKey(formId)) === '1';
            if (!seen) {
                setVisible(true);
            }
        })();
        return () => {
            cancelled = true;
        };
    }, [formId]);

    const markSeen = () => {
        localStorage.setItem(storageKey(formId), '1');
        setDismissed(true);
        setVisible(false);
    };

    const showAgain = () => {
        setDismissed(false);
        setVisible(true);
    };

    const disableGlobally = async () => {
        try {
            await patchStudentMe({ hintsDisabled: true });
            setHintsOff(true);
            setVisible(false);
        } catch {
            localStorage.setItem('resumeHintsDisabledLocal', '1');
            setHintsOff(true);
            setVisible(false);
        }
    };

    if (!items.length || hintsOff) {
        return null;
    }

    return (
        <aside className="guidedHints" aria-label={title}>
            {visible && !dismissed ? (
                <div className="guidedHints__panel">
                    <div className="guidedHints__head">
                        <strong>{title}</strong>
                        <button type="button" className="guidedHints__close" onClick={markSeen} aria-label="Скрыть">
                            ×
                        </button>
                    </div>
                    <ul className="guidedHints__list">
                        {items.map((text) => (
                            <li key={text}>{text}</li>
                        ))}
                    </ul>
                    <div className="guidedHints__actions">
                        <button type="button" className="guidedHints__btn" onClick={markSeen}>
                            Понятно
                        </button>
                        <button type="button" className="guidedHints__btn guidedHints__btn--muted" onClick={disableGlobally}>
                            Больше не показывать
                        </button>
                    </div>
                </div>
            ) : (
                <button type="button" className="guidedHints__showAgain" onClick={showAgain}>
                    Показать подсказки
                </button>
            )}
        </aside>
    );
};

export default GuidedHints;
