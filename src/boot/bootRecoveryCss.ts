function hasCoreStylesLoaded(): boolean {
  try {
    const rootStyles = getComputedStyle(document.documentElement);
    const bgBase = rootStyles.getPropertyValue('--bg-base').trim();
    if (bgBase) return true;

    const probe = document.createElement('div');
    probe.className = 'hidden fixed';
    probe.style.position = 'absolute';
    probe.style.pointerEvents = 'none';
    document.body.appendChild(probe);
    const computed = getComputedStyle(probe);
    const ok = computed.display === 'none';
    probe.remove();
    return ok;
  } catch {
    return false;
  }
}

function isDevRuntime(): boolean {
  try {
    return !!import.meta.env?.DEV;
  } catch {
    return false;
  }
}

function getBundledCssHrefs(): string[] {
  try {
    const links = Array.from(document.querySelectorAll<HTMLLinkElement>('link[rel="stylesheet"][href]'));
    return links
      .map((link) => String(link.href || '').trim())
      .filter((href) => href.includes('/assets/') && href.includes('.css'));
  } catch {
    return [];
  }
}

function hasBundledStylesheetAttached(): boolean {
  try {
    return Array.from(document.styleSheets).some((sheet) => {
      const href = String((sheet as CSSStyleSheet).href || '');
      return href.includes('/assets/') && href.includes('.css');
    });
  } catch {
    return false;
  }
}

async function isStylesheetResponseHealthy(href: string): Promise<boolean> {
  try {
    const probeUrl = new URL(href, window.location.origin);
    probeUrl.searchParams.set('__viva_css_probe__', String(Date.now()));
    const res = await fetch(probeUrl.toString(), {
      method: 'GET',
      cache: 'no-store',
      credentials: 'same-origin',
    });
    if (!res.ok) return false;

    const contentType = String(res.headers.get('content-type') || '').toLowerCase();
    if (!contentType.includes('text/css')) return false;

    const snippet = (await res.text()).slice(0, 256).toLowerCase();
    if (snippet.includes('<!doctype html') || snippet.includes('<html')) return false;
    return true;
  } catch {
    return false;
  }
}

export async function hasCssIntegrityProblem(): Promise<boolean> {
  if (isDevRuntime()) return false;

  const coreStylesOk = hasCoreStylesLoaded();
  const bundledHrefs = getBundledCssHrefs();
  const bundledSheetAttached = hasBundledStylesheetAttached();

  if (coreStylesOk && (bundledSheetAttached || bundledHrefs.length === 0)) {
    return false;
  }

  if (bundledHrefs.length === 0) {
    return true;
  }

  const firstCssOk = await isStylesheetResponseHealthy(bundledHrefs[0]);
  if (!firstCssOk) return true;

  return !coreStylesOk || !bundledSheetAttached;
}

export function cleanupRecoveryQuery(): void {
  try {
    const url = new URL(window.location.href);
    let dirty = false;
    if (url.searchParams.has('__viva_recover__')) {
      url.searchParams.delete('__viva_recover__');
      dirty = true;
    }
    if (url.searchParams.has('__viva_recover_reason__')) {
      url.searchParams.delete('__viva_recover_reason__');
      dirty = true;
    }
    if (dirty) {
      window.history.replaceState({}, document.title, url.toString());
    }
  } catch {
    // ignore
  }
}
