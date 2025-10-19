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
 *  Destination URL (form.action)
 *
 * @property {'post'|'get'} [method='post']
 *  HTTP method; for GET the fields become query params.
 *
 * @property {Array<{name:string,value:any}>} fields
 *  Fields to send. Values are coerced with String(value). Empty `name` ignored.
 *
 * @property {HTMLElement|ShadowRoot} [context]
 *  Where to temporarily attach the form. Can be a ShadowRoot (if connected to document).
 *  Must be in live DOM; DocumentFragment will NOT work.
 *
 * @property {boolean} [openInNewTab=false]
 *  If true, submit into a new tab/window (target=_blank or named).
 *
 * @property {string} [newTabName='']
 *  Named browsing context for reuse (e.g. "handoff_tab").
 *
 * @property {boolean} [focusNewTab=true]
 *  Attempt to focus the reused tab after submit. Works only for named tabs.
 *
 * @property {'application/x-www-form-urlencoded'|'multipart/form-data'} [enctype='application/x-www-form-urlencoded']
 *  Form encoding type.
 *
 * @property {string} [acceptCharset='utf-8']
 *  Charset for form submission.
 *
 * @property {boolean} [novalidate=true]
 *  Skip HTML5 validation before submit.
 *
 * @property {'on'|'off'} [autocomplete='off']
 *  Form-level autocomplete hint.
 *
 * @property {string} [referrerPolicy='no-referrer']
 *  Referrer policy (modern browsers only).
 *
 * @property {string} [rel]
 *  Custom rel attribute. If omitted and opening new tab, automatically enforced "noopener noreferrer".
 *
 * @property {boolean} [serializeGetInUrl=false]
 *  For GET requests, append fields directly to action URL (instead of hidden inputs).
 *
 * @property {(ctx:{form:HTMLFormElement, fields:Record<string,string>})=>void} [onBeforeSubmit]
 *  Hook executed right before submit().
 *
 * @property {(ctx:{form:HTMLFormElement})=>void} [onAfterSubmit]
 *  Hook executed immediately after submit().
 *
 * @property {(err:unknown)=>void} [onError]
 *  Hook called if an error is thrown (validation/runtime).
 */

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

    /**
     * Resolve context where the temporary form will be attached.
     * Supports HTMLElement and ShadowRoot.
     * @param {unknown} ctx
     * @returns {HTMLElement|ShadowRoot}
     */
    const resolveHost = (ctx) => {
      if (ctx && typeof ctx === 'object') {
        const isShadowRoot =
          (typeof ShadowRoot !== 'undefined' && ctx instanceof ShadowRoot) ||
          (ctx.nodeType === 11 && 'host' in ctx);
        if (isShadowRoot) {
          return ctx.isConnected ? ctx : document.body;
        }
        if (ctx instanceof HTMLElement) {
          return ctx.isConnected ? ctx : document.body;
        }
      }
      return document.body;
    };

    const host = resolveHost(context);

    // --- Prepare URL and fields
    let finalAction = action;
    /** @type {Record<string,string>} */
    const flat = {};
    for (const f of fields) {
      if (!f?.name) continue;
      flat[f.name] = f.value != null ? String(f.value) : '';
    }

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

    // Defensive attributes
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
      if (rel == null || rel === '') {
        form.setAttribute('rel', 'noopener noreferrer'); // secure default
      } else {
        form.setAttribute('rel', rel);
      }
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
    if (
      openInNewTab &&
      focusNewTab &&
      newTabName &&
      form.target === newTabName
    ) {
      try {
        const win = window.open('', newTabName);
        win?.focus?.();
      } catch {
        // ignored (browser restrictions)
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