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
        box-sizing: border-box;
        padding: 0 16px;
        border-radius: 34px;
        background: #131313;
        color: #ffffff;
        font-family: 'StratosSemiLight', sans-serif;
        font-size: 12px;
        letter-spacing: 0.24px;
        line-height: 1.2;
        white-space: nowrap;
        box-shadow: 0 10px 28px rgba(0, 0, 0, 0.35);
        will-change: left, top, width, height, background-color, color, opacity;
        transition:
          left 0.42s cubic-bezier(0.22, 1, 0.36, 1),
          top 0.42s cubic-bezier(0.22, 1, 0.36, 1),
          width 0.42s cubic-bezier(0.22, 1, 0.36, 1),
          height 0.42s cubic-bezier(0.22, 1, 0.36, 1),
          background-color 0.3s ease,
          color 0.3s ease,
          opacity 0.2s ease;
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
 * Плавный перелёт чипа. Не блокирует UI — можно вызывать fire-and-forget.
 */
export const flySkillChip = async ({
    fromRect,
    toEl,
    toRect,
    getToEl,
    label,
    duration = 420,
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
    document.body.appendChild(clone);
    clone.getBoundingClientRect();

    let target = toEl || null;
    let targetRect = toRect || null;

    for (let i = 0; i < 10 && !targetRect; i += 1) {
        await waitFrames(1);
        target = getToEl?.() || toEl || target;
        if (target) {
            target.classList.add('is-arriving');
            targetRect = target.getBoundingClientRect();
        }
    }

    if (!targetRect) {
        clone.remove();
        target?.classList?.remove?.('is-arriving');
        return;
    }

    // Перечитываем цель перед стартом — сетка могла сдвинуться
    if (target) {
        targetRect = target.getBoundingClientRect();
    }

    clone.style.left = `${targetRect.left}px`;
    clone.style.top = `${targetRect.top}px`;
    clone.style.width = `${Math.max(targetRect.width, 40)}px`;
    clone.style.height = `${Math.max(targetRect.height, 24)}px`;
    clone.style.background = '#ffffff';
    clone.style.color = '#2f2f2f';

    await new Promise((resolve) => {
        window.setTimeout(resolve, duration);
    });

    clone.style.opacity = '0';
    await waitFrames(2);
    clone.remove();
    target?.classList?.remove?.('is-arriving');
};

/**
 * «Рассыпание» чипа на крошки. Fire-and-forget: не ждём завершения.
 * Важно: передавать fromRect — fromEl может уже быть размонтирован.
 */
export const crumbleSkillChip = ({ fromEl, fromRect, crumbCount = 18 } = {}) => {
    if (typeof document === 'undefined') return;
    ensureStyles();

    const rect = fromRect || fromEl?.getBoundingClientRect?.();
    if (!rect || !rect.width || !rect.height) return;

    const crumbs = [];
    for (let i = 0; i < crumbCount; i += 1) {
        const crumb = document.createElement('span');
        crumb.className = CRUMBLE_CLASS;
        const size = 2 + Math.random() * 4.5;
        crumb.style.width = `${size}px`;
        crumb.style.height = `${size}px`;
        crumb.style.left = `${rect.left + Math.random() * rect.width}px`;
        crumb.style.top = `${rect.top + Math.random() * rect.height}px`;
        crumb.style.opacity = '1';
        crumb.style.transform = 'translate(0, 0) scale(1)';
        crumb.style.transition = [
            `transform ${0.4 + Math.random() * 0.35}s cubic-bezier(0.2, 0.7, 0.2, 1)`,
            `opacity ${0.4 + Math.random() * 0.3}s ease`,
        ].join(', ');
        document.body.appendChild(crumb);
        crumbs.push(crumb);
    }

    crumbs.forEach((c) => c.getBoundingClientRect());

    requestAnimationFrame(() => {
        crumbs.forEach((crumb) => {
            const angle = Math.random() * Math.PI * 2;
            const distance = 24 + Math.random() * 64;
            const dx = Math.cos(angle) * distance;
            const dy = Math.sin(angle) * distance + (16 + Math.random() * 36);
            const rot = (Math.random() - 0.5) * 220;
            crumb.style.transform = `translate(${dx}px, ${dy}px) rotate(${rot}deg) scale(${0.12 + Math.random() * 0.3})`;
            crumb.style.opacity = '0';
        });
    });

    window.setTimeout(() => {
        crumbs.forEach((c) => c.remove());
    }, 750);
};
