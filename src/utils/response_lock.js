/**
 * Phase 2 Continue-button lock for html-slider-response trials.
 *
 * Keeps #jspsych-html-slider-response-next disabled for lockMs even if
 * require_movement enables it early. After unlock, enables only if the
 * slider was already moved (otherwise the stock plugin enables on next move).
 */

/**
 * @param {HTMLElement} displayElement - jsPsych display element for this trial
 * @param {number} lockMs - Lock duration in ms; <= 0 disables the lock
 * @returns {{ clear: function, getUnlockTime: function }}
 */
export function mountContinueLock(displayElement, lockMs) {
    const btn = displayElement.querySelector('#jspsych-html-slider-response-next');
    if (!btn || lockMs == null || lockMs <= 0) {
        return {
            clear() {},
            getUnlockTime: () => null,
        };
    }

    let locked = true;
    let moved = false;
    let cleared = false;
    let unlockTime = null;

    const syncButton = () => {
        if (cleared) return;
        if (locked) {
            btn.disabled = true;
        } else {
            btn.disabled = !moved;
        }
    };

    const onSliderInteract = () => {
        moved = true;
        // Plugin may enable the button in the same event turn; re-disable if still locked.
        syncButton();
        requestAnimationFrame(syncButton);
    };

    const slider = displayElement.querySelector('#jspsych-html-slider-response-response');
    if (slider) {
        ['mousedown', 'touchstart', 'change', 'input'].forEach((ev) => {
            slider.addEventListener(ev, onSliderInteract);
        });
    }

    const observer = new MutationObserver(() => {
        if (locked && !btn.disabled) {
            btn.disabled = true;
        }
    });
    observer.observe(btn, { attributes: true, attributeFilter: ['disabled'] });

    btn.disabled = true;

    const timeoutId = setTimeout(() => {
        if (cleared) return;
        locked = false;
        unlockTime = performance.now();
        observer.disconnect();
        syncButton();
    }, lockMs);

    return {
        clear() {
            if (cleared) return;
            cleared = true;
            locked = false;
            clearTimeout(timeoutId);
            observer.disconnect();
        },
        getUnlockTime: () => unlockTime,
    };
}
