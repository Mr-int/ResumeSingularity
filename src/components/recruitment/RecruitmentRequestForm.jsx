import { useId } from 'react';
import { COOPERATION_FORMAT } from '../../pages/catalogFormat.js';

function toggleId(ids, id) {
    const value = Number(id);
    if (!Number.isInteger(value) || value <= 0) return ids;
    const next = Array.isArray(ids) ? ids.map(Number) : [];
    if (next.includes(value)) return next.filter((item) => item !== value);
    return [...next, value];
}

const RecruitmentRequestForm = ({
    form,
    onChange,
    specialities = [],
    cities = [],
    disabled = false,
}) => {
    const base = useId();
    const fieldId = (name) => `${base}-${name}`;
    const set = (patch) => onChange({ ...form, ...patch });

    const checkGroup = (name, label, items, selected) => (
        <div className="catalog__field">
            <span className="catalog__fieldLabel" id={fieldId(name)}>{label}</span>
            <div className="catalog__checks" role="group" aria-labelledby={fieldId(name)}>
                {items.length === 0 ? (
                    <span className="catalog__meta">Справочник недоступен</span>
                ) : (
                    items.map((item) => {
                        const id = fieldId(`${name}-${item.id}`);
                        return (
                            <label key={item.id} className="catalog__check" htmlFor={id}>
                                <input
                                    id={id}
                                    type="checkbox"
                                    disabled={disabled}
                                    checked={selected.includes(Number(item.id))}
                                    onChange={() => set({ [`${name}Ids`]: toggleId(selected, item.id) })}
                                />
                                {item.name}
                            </label>
                        );
                    })
                )}
            </div>
        </div>
    );

    const selectedSpecialities = Array.isArray(form.specialityIds) ? form.specialityIds.map(Number) : [];
    const selectedCities = Array.isArray(form.cityIds) ? form.cityIds.map(Number) : [];

    return (
        <div className="catalog__form">
            <div className="catalog__field">
                <label className="catalog__fieldLabel" htmlFor={fieldId('tasks')}>Задачи *</label>
                <textarea
                    id={fieldId('tasks')}
                    required
                    rows={4}
                    disabled={disabled}
                    value={form.tasks}
                    onChange={(event) => set({ tasks: event.target.value })}
                />
            </div>
            <div className="catalog__field">
                <label className="catalog__fieldLabel" htmlFor={fieldId('qual')}>Требования к квалификации *</label>
                <textarea
                    id={fieldId('qual')}
                    required
                    rows={4}
                    disabled={disabled}
                    value={form.qualificationRequirements}
                    onChange={(event) => set({ qualificationRequirements: event.target.value })}
                />
            </div>
            <div className="catalog__field">
                <label className="catalog__fieldLabel" htmlFor={fieldId('work')}>Условия работы *</label>
                <textarea
                    id={fieldId('work')}
                    required
                    rows={4}
                    disabled={disabled}
                    value={form.workConditions}
                    onChange={(event) => set({ workConditions: event.target.value })}
                />
            </div>
            <div className="catalog__split">
                <div className="catalog__field">
                    <label className="catalog__fieldLabel" htmlFor={fieldId('count')}>Сколько студентов нужно *</label>
                    <input
                        id={fieldId('count')}
                        type="number"
                        min="1"
                        step="1"
                        required
                        disabled={disabled}
                        value={form.studentCount}
                        onChange={(event) => set({ studentCount: event.target.value })}
                    />
                </div>
                <div className="catalog__field">
                    <label className="catalog__fieldLabel" htmlFor={fieldId('format')}>Формат сотрудничества</label>
                    <select
                        id={fieldId('format')}
                        disabled={disabled}
                        value={form.cooperationFormat}
                        onChange={(event) => set({ cooperationFormat: event.target.value })}
                    >
                        <option value="">Не указан</option>
                        {Object.entries(COOPERATION_FORMAT).map(([id, label]) => (
                            <option key={id} value={id}>{label}</option>
                        ))}
                    </select>
                </div>
                <div className="catalog__field">
                    <label className="catalog__fieldLabel" htmlFor={fieldId('ready')}>Готовы запросить студентов</label>
                    <select
                        id={fieldId('ready')}
                        disabled={disabled}
                        value={form.readyToRequestStudents}
                        onChange={(event) => set({ readyToRequestStudents: event.target.value })}
                    >
                        <option value="">Не указано</option>
                        <option value="yes">Да</option>
                        <option value="no">Нет</option>
                    </select>
                </div>
            </div>

            {checkGroup('speciality', 'Специальности *', specialities, selectedSpecialities)}
            {checkGroup('city', 'Города *', cities, selectedCities)}

            <div className="catalog__field">
                <label className="catalog__fieldLabel" htmlFor={fieldId('schedule')}>Сроки работы</label>
                <textarea
                    id={fieldId('schedule')}
                    rows={3}
                    disabled={disabled}
                    value={form.scheduleNote}
                    onChange={(event) => set({ scheduleNote: event.target.value })}
                />
            </div>
            <div className="catalog__field">
                <label className="catalog__fieldLabel" htmlFor={fieldId('extra')}>Прочая информация</label>
                <textarea
                    id={fieldId('extra')}
                    rows={3}
                    disabled={disabled}
                    value={form.extraInfo}
                    onChange={(event) => set({ extraInfo: event.target.value })}
                />
            </div>
            <div className="catalog__split">
                <div className="catalog__field">
                    <label className="catalog__fieldLabel" htmlFor={fieldId('from')}>Публикация с</label>
                    <input
                        id={fieldId('from')}
                        type="datetime-local"
                        disabled={disabled}
                        value={form.publishedFrom}
                        onChange={(event) => set({ publishedFrom: event.target.value })}
                    />
                </div>
                <div className="catalog__field">
                    <label className="catalog__fieldLabel" htmlFor={fieldId('to')}>Публикация до</label>
                    <input
                        id={fieldId('to')}
                        type="datetime-local"
                        disabled={disabled}
                        value={form.publishedTo}
                        onChange={(event) => set({ publishedTo: event.target.value })}
                    />
                </div>
            </div>
        </div>
    );
};

export default RecruitmentRequestForm;
