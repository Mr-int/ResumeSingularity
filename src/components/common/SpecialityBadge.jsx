import React from 'react';
import { getImageUrl } from '../../config/api.js';
import './specialityBadge.css';

/**
 * Иконка специальности из API (speciality.icon_path / specialityIconPath).
 */
const SpecialityBadge = ({ speciality, className = '', alt = '' }) => {
    const iconPath =
        speciality?.icon_path ??
        speciality?.iconPath ??
        (typeof speciality === 'string' ? null : null);

    const label =
        typeof speciality === 'string'
            ? speciality
            : speciality?.name || speciality?.title || '';

    const src = iconPath ? getImageUrl(iconPath) : null;

    if (!src) {
        return null;
    }

    return (
        <img
            src={src}
            alt={alt || label || 'Специальность'}
            className={`specialityBadge${className ? ` ${className}` : ''}`}
            loading="lazy"
        />
    );
};

export default SpecialityBadge;
