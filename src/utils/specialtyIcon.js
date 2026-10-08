import javaIcon from '../assets/specialities/java.png';
import pythonIcon from '../assets/specialities/python.png';
import designIcon from '../assets/specialities/design.png';
import webIcon from '../assets/specialities/web.png';
import analyticsIcon from '../assets/specialities/dataAnalyst.png';
import managementIcon from '../assets/specialities/management.png';
import projectManagerIcon from '../assets/specialities/projectManager.png';
import marketingIcon from '../assets/specialities/marketing.png';
import targetologistIcon from '../assets/specialities/targetologist.png';
import cppIcon from '../assets/specialities/c++.png';

/** Иконка специальности по названию (как на карточках в слайдере). */
export const getSpecialtyIcon = (specialityName) => {
    if (!specialityName) return null;

    const specLower = String(specialityName).toLowerCase();

    if (specLower.includes('java') || specLower.includes('джава')) return javaIcon;
    if (specLower.includes('python') || specLower.includes('питон') || specLower.includes('pyhton')) {
        return pythonIcon;
    }
    if (specLower.includes('c++') || specLower.includes('с++') || specLower.includes('cpp')) return cppIcon;
    if (specLower.includes('аналитик') || specLower.includes('analytics')) return analyticsIcon;
    if (specLower.includes('тестировщик') || specLower.includes('qa') || specLower.includes('testing')) {
        return managementIcon;
    }
    if (
        specLower.includes('менеджер проектов')
        || specLower.includes('project manager')
        || (specLower.includes('менеджер') && !specLower.includes('маркетолог'))
    ) {
        return projectManagerIcon;
    }
    if (specLower.includes('маркетолог') || specLower.includes('marketing')) return marketingIcon;
    if (specLower.includes('таргетолог') || specLower.includes('target')) return targetologistIcon;
    if (specLower.includes('веб') || specLower.includes('web') || specLower.includes('frontend') || specLower.includes('фронт')) {
        return webIcon;
    }
    if (specLower.includes('backend') || specLower.includes('бекенд') || specLower.includes('бэкенд')) {
        return javaIcon;
    }
    if (specLower.includes('дизайнер') || specLower.includes('design') || specLower.includes('графический')) {
        return designIcon;
    }

    return null;
};
