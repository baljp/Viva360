/**
 * DeathClickTracker — Dev-only utility that detects "death clicks":
 * clicks on elements that have no meaningful event handler attached.
 *
 * Usage: import and call `initDeathClickTracker()` once in your app entry point.
 * It will log warnings to the console with the element details.
 * Only active in non-production environments.
 */
import { captureFrontendMessage } from '../../lib/frontendLogger';

const INTERACTIVE_TAGS = new Set(['A', 'BUTTON', 'INPUT', 'SELECT', 'TEXTAREA', 'LABEL']);
const INTERACTIVE_ROLES = new Set(['button', 'link', 'tab', 'menuitem', 'checkbox', 'radio', 'switch']);

function isInteractiveElement(el: HTMLElement): boolean {
    if (INTERACTIVE_TAGS.has(el.tagName)) return true;
    const role = el.getAttribute('role');
    if (role && INTERACTIVE_ROLES.has(role)) return true;
    if (el.hasAttribute('tabindex')) return true;
    if (el.classList.contains('cursor-pointer')) return true;
    return false;
}

function hasAttachedHandler(el: HTMLElement): boolean {
    // Check for onClick, href, or data-action attributes
    if (el.getAttribute('href') && el.getAttribute('href') !== '#') return true;
    if (el.getAttribute('data-action')) return true;
    if (el.getAttribute('type') === 'submit') return true;

    // React attaches events via __reactFiber$... or __reactProps$...
    const reactPropsKey = Object.keys(el).find(k => k.startsWith('__reactProps$'));
    if (reactPropsKey) {
        const props = (el as any)[reactPropsKey];
        if (props?.onClick || props?.onChange || props?.onSubmit || props?.onMouseDown || props?.onPointerDown) {
            return true;
        }
    }

    return false;
}

function getElementDescriptor(el: HTMLElement): string {
    const tag = el.tagName.toLowerCase();
    const id = el.id ? `#${el.id}` : '';
    const classes = el.className && typeof el.className === 'string'
        ? '.' + el.className.split(' ').slice(0, 3).join('.')
        : '';
    const text = (el.textContent || '').trim().slice(0, 40);
    const testId = el.getAttribute('data-testid') ? `[data-testid="${el.getAttribute('data-testid')}"]` : '';
    return `<${tag}${id}${testId}${classes}> "${text}"`;
}

// Tracks repeated clicks on the same element (rage clicks / death clicks)
const clickHistory: Map<string, { count: number; lastTime: number }> = new Map();

function handleClick(e: MouseEvent) {
    const target = e.target as HTMLElement;
    if (!target || !(target instanceof HTMLElement)) return;

    // Walk up to find the nearest interactive element
    let el: HTMLElement | null = target;
    let found = false;
    let depth = 0;
    while (el && depth < 5) {
        if (isInteractiveElement(el)) {
            found = true;
            break;
        }
        el = el.parentElement;
        depth++;
    }

    if (!found || !el) return; // Click was on non-interactive area, skip

    // If the interactive element has no handler, flag it
    if (!hasAttachedHandler(el)) {
        const descriptor = getElementDescriptor(el);
        const now = Date.now();
        const prev = clickHistory.get(descriptor);

        if (prev && now - prev.lastTime < 3000) {
            prev.count++;
            prev.lastTime = now;
            if (prev.count >= 2) {
                captureFrontendMessage('death_click_detected', {
                    util: 'deathClickTracker',
                    count: prev.count,
                    descriptor,
                    tagName: el.tagName,
                    dataTestId: el.getAttribute('data-testid'),
                });
            }
        } else {
            clickHistory.set(descriptor, { count: 1, lastTime: now });
        }
    }
}

let isInitialized = false;

export function initDeathClickTracker() {
    if (isInitialized) return;
    if (typeof window === 'undefined') return;

    // Only in development
    const isProduction = import.meta?.env?.PROD ?? (typeof process !== 'undefined' && process.env?.NODE_ENV === 'production');
    if (isProduction) return;

    document.addEventListener('click', handleClick, true);
    isInitialized = true;

}

export function destroyDeathClickTracker() {
    if (!isInitialized) return;
    document.removeEventListener('click', handleClick, true);
    isInitialized = false;
    clickHistory.clear();
}
