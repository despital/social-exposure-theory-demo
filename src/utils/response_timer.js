/**
 * Per-trial countdown bar + "Time left: N s" label.
 * Visual only unless onTimeout is provided (Phase 1 uses it to end the trial).
 */

const URGENT_MS = 3000;

/**
 * Mount a response timer at the top of a container.
 *
 * @param {HTMLElement} container - Trial display element (or a child to prepend into).
 * @param {number} durationMs - Total time for this response window.
 * @param {object} [options]
 * @param {function} [options.onTimeout] - Called once when time reaches 0.
 * @returns {{ clear: function }} Call clear() if the participant responds early.
 */
export function mountResponseTimer(container, durationMs, options = {}) {
    const { onTimeout = null } = options;

    const wrap = document.createElement('div');
    wrap.className = 'response-timer';
    wrap.innerHTML = `
        <div class="response-timer-label">Time left: <span class="response-timer-seconds"></span> s</div>
        <div class="response-timer-track">
            <div class="response-timer-fill"></div>
        </div>
    `;

    const secondsEl = wrap.querySelector('.response-timer-seconds');
    const fillEl = wrap.querySelector('.response-timer-fill');

    container.insertBefore(wrap, container.firstChild);

    const start = performance.now();
    let rafId = null;
    let timeoutId = null;
    let cleared = false;
    let timedOut = false;

    const setVisual = (remainingMs) => {
        const clamped = Math.max(0, remainingMs);
        const frac = durationMs > 0 ? clamped / durationMs : 0;
        const secs = Math.ceil(clamped / 1000);
        secondsEl.textContent = String(secs);
        fillEl.style.width = `${frac * 100}%`;
        wrap.classList.toggle('response-timer-urgent', clamped > 0 && clamped <= URGENT_MS);
    };

    setVisual(durationMs);

    const tick = (now) => {
        if (cleared) return;
        const remaining = durationMs - (now - start);
        setVisual(remaining);
        if (remaining > 0) {
            rafId = requestAnimationFrame(tick);
        }
    };
    rafId = requestAnimationFrame(tick);

    timeoutId = setTimeout(() => {
        if (cleared || timedOut) return;
        timedOut = true;
        setVisual(0);
        if (typeof onTimeout === 'function') {
            onTimeout();
        }
    }, durationMs);

    return {
        clear() {
            if (cleared) return;
            cleared = true;
            if (rafId !== null) cancelAnimationFrame(rafId);
            if (timeoutId !== null) clearTimeout(timeoutId);
            wrap.remove();
        }
    };
}
