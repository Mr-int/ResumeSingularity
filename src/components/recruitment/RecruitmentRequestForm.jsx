import {
    COOPERATION_FORMAT,
} from '../../pages/catalogFormat.js';

function toggleId(ids, id) {
    const next = ids.map(Number);
    const value = Number(id);
    if (next.includes(value)) return next.filter((item) => item !== value);
    return [...next, value];
}

const RecruitmentRequestForm = ({ form, onChange, specialities, cities, disabled }) => {
    const set = (patch) => onChange({ ...form, ...patch });

    return (
        <div className="catalog__form">
            <div className="catalog__field">
                <label htmlFor="rr-tasks">Задачи</label>
                <textarea id="rr-tasks" required rows={4} disabled={disabled} value={form.tasks} onChange={(e) => set({ tasks: e.target.value })} />
            </div>
            <div className="catalog__field">
                <label htmlFor="rr-qual">Требования к квалификации</label>
                <textarea id="rr-qual" required rows={4} disabled={disabled} value={form.qualificationRequirements} onChange={(e) => set({ qualificationRequirements: e.target.value })} />
            </div>
            <div className="catalog__field">
                <label htmlFor="rr-work">Условия работы</label>
                <textarea id="rr-work" required rows={4} disabled={disabled} value={form.workConditions} onChange={(e) => set({ workConditions: e.target.value })} />
            </div>
            <div className="catalog__split">
                <div className="catalog__field">
                    <label htmlFor="rr-count">Сколько студентов нужно</label>
                    <input id="rr-count" type="number" min="1" required disabled={disabled} value={form.studentCount} onChange={(e) => set({ studentCount: e.target.value })} />
                </div>
                <div className="catalog__field">
                    <label htmlFor="rr-format">Формат</label>
                    <select id="rr-format" disabled={disabled} value={form.cooperationFormat} onChange={(e) => set({ cooperationFormat: e.target.value })}>
                        <option value="">Не указан</option>
                        {Object.entries(COOPERATION_FORMAT).map(([id, label]) => (
                            <option key={id} value={id}>{label}</option>
                        ))}
                    </select>
                </div>
                <div className="catalog__field">
                    <label htmlFor="rr-ready">Готовы запросить студентов</label>
                    <select id="rr-ready" disabled={disabled} value={form.readyToRequestStudents} onChange={(e) => set({ readyToRequestStudents: e.target.value })}>
                        <option value="">Не указано</option>
                        <option value="yes">Да</option>
                        <option value="no">Нет</option>
                    </select>
                </div>
            </div>
            <div className="catalog__field">
                <label>Специальности</label>
                <div className="catalog__checks">
                    {specialities.map((item) => (
                        <label key={item.id}>
                            <input
                                type="checkbox"
                                disabled={disabled}
                                checked={form.specialityIds.map(Number).includes(Number(item.id))}
                                onChange={() => set({ specialityIds: toggleId(form.specialityIds, item.id) })}
                            />
                            {item.name}
                        </label>
                    ))}
                </div>
            </div>
            <div className="catalog__field">
                <label>Города</label>
                <div className="catalog__checks">
                    {cities.map((item) => (
                        <label key={item.id}>
                            <input
                                type="checkbox"
                                disabled={disabled}
                                checked={form.cityIds.map(Number).includes(Number(item.id))}
                                onChange={() => set({ cityIds: toggleId(form.cityIds, item.id) })}
                            />
                            {item.name}
                        </label>
                    ))}
                </div>
            </div>
            <div className="catalog__field">
                <label htmlFor="rr-schedule">Сроки работы</label>
                <textarea id="rr-schedule" rows={3} disabled={disabled} value={form.scheduleNote} onChange={(e) => set({ scheduleNote: e.target.value })} />
            </div>
            <div className="catalog__field">
                <label htmlFor="rr-extra">Прочая информация</label>
                <textarea id="rr-extra" rows={3} disabled={disabled} value={form.extraInfo} onChange={(e) => set({ extraInfo: e.target.value })} />
            </div>
            <div className="catalog__split">
                <div className="catalog__field">
                    <label htmlFor="rr-from">Публикация с</label>
                    <input id="rr-from" type="datetime-local" disabled={disabled} value={form.publishedFrom} onChange={(e) => set({ publishedFrom: e.target.value })} />
                </div>
                <div className="catalog__field">
                    <label htmlFor="rr-to">Публикация до</label>
                    <input id="rr-to" type="datetime-local" disabled={disabled} value={form.publishedTo} onChange={(e) => set({ publishedTo: e.target.value })} />
                </div>
            </div>
        </div>
    );
};

export default RecruitmentRequestForm;
