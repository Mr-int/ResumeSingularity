const CLONE_CLASS = 'skillChipFly';
const CRUMBLE_CLASS = 'skillChipCrumble';

const ensureStyles = () => {
    if (typeof document === 'undefined') return;
    if (document.getElementById('skillChipAnimStyles')) return;
    const style = document.createElement('style');
    style.id = 'skillChipAnimStyles';
    style.textContent = `
      .${CLONE_CLASS} {
        position: fixed;
        z-index: 9999;
        pointer-events: none;
        display: inline-flex;
        align-items: center;
        justify-content: center;
        height: 32px;
        padding: 0 24px;
        border-radius: 34px;
        background: #131313;
        color: #ffffff;
        font-family: 'StratosSemiLight', sans-serif;
        font-size: 12px;
        letter-spacing: 0.24px;
        white-space: nowrap;
        box-shadow: 0 10px 28px rgba(0, 0, 0, 0.35);
        will-change: transform, opacity;
        transition:
          transform 0.55s cubic-bezier(0.22, 1, 0.36, 1),
          opacity 0.35s ease,
          background-color 0.35s ease,
          color 0.35s ease;
      }
      .${CRUMBLE_CLASS} {
        position: fixed;
        z-index: 9999;
        pointer-events: none;
        border-radius: 2px;
        background: #ffffff;
        will-change: transform, opacity;
      }
    `;
    document.head.appendChild(style);
};

const waitFrames = (count = 2) => new Promise((resolve) => {
    const step = (left) => {
        if (left <= 0) {
            resolve();
            return;
        }
        requestAnimationFrame(() => step(left - 1));
    };
    step(count);
});

/**
 * Плавный перелёт чипа из fromRect в элемент toEl (или toRect / getToEl).
 */
export const flySkillChip = async ({
    fromRect,
    toEl,
    toRect,
    getToEl,
    label,
    duration = 550,
}) => {
    if (typeof document === 'undefined' || !fromRect) return;
    ensureStyles();

    const clone = document.createElement('div');
    clone.className = CLONE_CLASS;
    clone.textContent = label || '';
    clone.style.left = `${fromRect.left}px`;
    clone.style.top = `${fromRect.top}px`;
    clone.style.width = `${Math.max(fromRect.width, 48)}px`;
    clone.style.height = `${Math.max(fromRect.height, 28)}px`;
    clone.style.transform = 'translate(0, 0) scale(1)';
    document.body.appendChild(clone);
    clone.getBoundingClientRect();

    let target = toEl || null;
    let targetRect = toRect || null;

    for (let i = 0; i < 8 && !targetRect; i += 1) {
        await waitFrames(1);
        target = getToEl?.() || toEl || target;
        if (target) {
            target.classList?.add?.('is-arriving');
            targetRect = target.getBoundingClientRect?.();
        }
    }

    if (!targetRect) {
        clone.remove();
        target?.classList?.remove?.('is-arriving');
        return;
    }

    const dx = targetRect.left - fromRect.left;
    const dy = targetRect.top - fromRect.top;
    const sx = targetRect.width / Math.max(fromRect.width, 1);
    const sy = targetRect.height / Math.max(fromRect.height, 1);

    clone.style.background = '#ffffff';
    clone.style.color = '#2f2f2f';
    clone.style.transform = `translate(${dx}px, ${dy}px) scale(${sx}, ${sy})`;

    await new Promise((resolve) => {
        window.setTimeout(resolve, duration);
    });
    clone.remove();
    target?.classList?.remove?.('is-arriving');
};

/**
 * «Рассыпание» чипа на крошки (как удаление на iPhone).
 */
export const crumbleSkillChip = async ({ fromEl, fromRect, crumbCount = 22 }) => {
    if (typeof document === 'undefined') return;
    ensureStyles();

    const rect = fromRect || fromEl?.getBoundingClientRect?.();
    if (!rect) return;

    if (fromEl) {
        fromEl.style.visibility = 'hidden';
    }

    const crumbs = [];
    for (let i = 0; i < crumbCount; i += 1) {
        const crumb = document.createElement('span');
        crumb.className = CRUMBLE_CLASS;
        const size = 2 + Math.random() * 5;
        crumb.style.width = `${size}px`;
        crumb.style.height = `${size}px`;
        crumb.style.left = `${rect.left + Math.random() * rect.width}px`;
        crumb.style.top = `${rect.top + Math.random() * rect.height}px`;
        crumb.style.opacity = '1';
        crumb.style.transform = 'translate(0, 0) scale(1)';
        crumb.style.transition = [
            `transform ${0.45 + Math.random() * 0.4}s cubic-bezier(0.2, 0.7, 0.2, 1)`,
            `opacity ${0.45 + Math.random() * 0.35}s ease`,
        ].join(', ');
        document.body.appendChild(crumb);
        crumbs.push(crumb);
    }

    crumbs.forEach((c) => c.getBoundingClientRect());

    crumbs.forEach((crumb) => {
        const angle = Math.random() * Math.PI * 2;
        const distance = 28 + Math.random() * 70;
        const dx = Math.cos(angle) * distance;
        const dy = Math.sin(angle) * distance + (20 + Math.random() * 40);
        const rot = (Math.random() - 0.5) * 240;
        crumb.style.transform = `translate(${dx}px, ${dy}px) rotate(${rot}deg) scale(${0.15 + Math.random() * 0.35})`;
        crumb.style.opacity = '0';
    });

    await new Promise((resolve) => {
        window.setTimeout(resolve, 700);
    });
    crumbs.forEach((c) => c.remove());
};
