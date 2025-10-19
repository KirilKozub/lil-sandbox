/**
 * @file submitFormToEndpoint.js
 * @description
 * Dynamically creates a <form>, injects hidden inputs, submits it (GET/POST), and removes it.
 * Designed for secure handoff flows where a real browser navigation (not fetch/XHR) is required.
 *
 * ✅ Features:
 * - Supports HTMLElement or ShadowRoot as context.
 * - Secure defaults: novalidate, autocomplete="off", referrerpolicy="no-referrer".
 * - Auto-enforces rel="noopener noreferrer" if opening new tab and rel not set.
 * - Optional serializeGetInUrl to inline GET params into URL.
 * - Focus attempt only for named tabs (reuse case), ignored for _blank.
 */

/**
 * @typedef {Object} SubmitFormOptions
 * @property {string} action
 * @property {'post'|'get'} [method='post']
 * @property {Array<{name:string,value:any}>} fields
 * @property {HTMLElement|ShadowRoot} [context]
 * @property {boolean} [openInNewTab=false]
 * @property {string} [newTabName='']
 * @property {boolean} [focusNewTab=true]
 * @property {'application/x-www-form-urlencoded'|'multipart/form-data'} [enctype='application/x-www-form-urlencoded']
 * @property {string} [acceptCharset='utf-8']
 * @property {boolean} [novalidate=true]
 * @property {'on'|'off'} [autocomplete='off']
 * @property {string} [referrerPolicy='no-referrer']
 * @property {string} [rel]
 * @property {boolean} [serializeGetInUrl=false]
 * @property {(ctx:{form:HTMLFormElement, fields:Record<string,string>})=>void} [onBeforeSubmit]
 * @property {(ctx:{form:HTMLFormElement})=>void} [onAfterSubmit]
 * @property {(err:unknown)=>void} [onError]
 */

/** @param {unknown} v @returns {v is ShadowRoot} */
function isShadowRootSafe(v) {
  return (
    !!v &&
    typeof v === 'object' &&
    (
      (typeof ShadowRoot !== 'undefined' && v instanceof ShadowRoot) ||
      ('host' in /** @type {any} */(v) && /** @type {any} */(v).nodeType === Node.DOCUMENT_FRAGMENT_NODE)
    )
  );
}

/** @param {unknown} v @returns {v is HTMLElement} */
function isHTMLElementSafe(v) {
  return !!v && v instanceof HTMLElement;
}

/** @param {unknown} v @returns {boolean} */
function isConnectedNode(v) {
  return !!(/** @type {Node} */(v))?.isConnected;
}

/**
 * Resolve context where the temporary form will be attached.
 * Supports HTMLElement and ShadowRoot. Falls back to document.body if not connected.
 * @param {unknown} ctx
 * @returns {HTMLElement | ShadowRoot}
 */
function resolveHost(ctx) {
  if (isShadowRootSafe(ctx)) {
    return isConnectedNode(ctx) ? /** @type {ShadowRoot} */(ctx) : document.body;
  }
  if (isHTMLElementSafe(ctx)) {
    return isConnectedNode(ctx) ? /** @type {HTMLElement} */(ctx) : document.body;
  }
  return document.body;
}

/**
 * Dynamically creates, submits, and cleans up an HTML form.
 * @param {SubmitFormOptions} opts
 * @throws {Error} If invalid or missing options.
 */
export function submitFormToEndpoint(opts) {
  const {
    action,
    method = 'post',
    fields,
    context,
    openInNewTab = false,
    newTabName = '',
    focusNewTab = true,
    enctype = 'application/x-www-form-urlencoded',
    acceptCharset = 'utf-8',
    novalidate = true,
    autocomplete = 'off',
    referrerPolicy = 'no-referrer',
    rel,
    serializeGetInUrl = false,
    onBeforeSubmit,
    onAfterSubmit,
    onError,
  } = opts ?? {};

  /** @type {HTMLFormElement|undefined} */
  let form;

  try {
    // --- Basic validation
    if (!action || typeof action !== 'string') {
      throw new Error('submitFormToEndpoint: "action" is required (string).');
    }
    if (!Array.isArray(fields) || fields.length === 0) {
      throw new Error('submitFormToEndpoint: "fields" must be a non-empty array.');
    }

    const host = resolveHost(context);

    // --- Prepare URL and fields (без continue)
    let finalAction = action;
    /** @type {Record<string,string>} */
    const flat = (fields || []).reduce((acc, f) => {
      if (f && typeof f.name === 'string' && f.name) {
        acc[f.name] = f.value != null ? String(f.value) : '';
      }
      return acc;
    }, {});

    // --- Optional: serialize GET fields directly into URL
    if (method.toLowerCase() === 'get' && serializeGetInUrl) {
      try {
        const url = new URL(finalAction, window.location.href);
        for (const [k, v] of Object.entries(flat)) url.searchParams.append(k, v);
        finalAction = url.toString();
      } catch {
        const sep = finalAction.includes('?') ? '&' : '?';
        const q = Object.entries(flat)
          .map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(v)}`)
          .join('&');
        finalAction = finalAction + sep + q;
      }
    }

    // --- Create form
    form = document.createElement('form');

    if (novalidate) form.setAttribute('novalidate', '');
    if (autocomplete) form.setAttribute('autocomplete', autocomplete);
    if (referrerPolicy) form.setAttribute('referrerpolicy', referrerPolicy);

    form.action = finalAction;
    form.method = method.toLowerCase() === 'get' ? 'get' : 'post';
    form.enctype = enctype;
    form.acceptCharset = acceptCharset;

    // --- Target & rel logic
    if (openInNewTab) {
      form.target = newTabName || '_blank';
      form.setAttribute('rel', rel == null || rel === '' ? 'noopener noreferrer' : rel);
    } else if (rel) {
      form.setAttribute('rel', rel);
    }

    // --- Add hidden inputs unless GET was serialized directly
    if (!(method.toLowerCase() === 'get' && serializeGetInUrl)) {
      for (const { name, value } of fields) {
        if (!name) continue;
        const input = document.createElement('input');
        input.type = 'hidden';
        input.name = String(name);
        input.value = value != null ? String(value) : '';
        form.appendChild(input);
      }
    }

    // --- Attach to DOM (required for submit())
    host.appendChild(form);

    // --- Hooks
    try { onBeforeSubmit?.({ form, fields: flat }); } catch {}

    form.submit();

    // --- Best-effort focus only for named tabs (reuse)
    if (openInNewTab && focusNewTab && newTabName && form.target === newTabName) {
      try {
        const win = window.open('', newTabName);
        win?.focus?.();
      } catch {
        // ignored
      }
    }

    try { onAfterSubmit?.({ form }); } catch {}
  } catch (err) {
    try { onError?.(err); } catch {}
    throw err;
  } finally {
    try { form?.remove(); } catch {}
  }
}