/**
 * @file submitFormToEndpoint.js
 * @description
 * Dynamically creates a <form>, injects hidden inputs, submits it (GET/POST), then removes it.
 * Intended for real browser navigations (e.g., POST handoff to 3rd-party) where fetch/XHR is not suitable.
 *
 * Secure defaults:
 * - novalidate (skip HTML5 validation)
 * - autocomplete="off"
 * - referrerpolicy="no-referrer"
 * - rel auto-enforcement: if opening a new tab and `rel` is not provided, force "noopener noreferrer"
 */

/**
 * @typedef {Object} SubmitFormOptions
 * @property {string} action                                Destination URL (form.action).
 * @property {'post'|'get'} [method='post']                 HTTP method; for GET the fields become query params.
 * @property {Array<{name:string,value:any}>} fields        Hidden inputs; values are coerced with String(value). Empty `name` is ignored.
 * @property {HTMLElement} [context]                        Container to temporarily attach the form (default: document.body). Must be in live DOM.
 * @property {boolean} [openInNewTab=false]                 If true, submit to a new browsing context (named or _blank).
 * @property {string} [newTabName='']                       Name of the tab/window to enable re-use. Empty → _blank when openInNewTab=true.
 * @property {boolean} [focusNewTab=true]                   Best-effort focusing of the named tab after submit (may be ignored by browsers).
 * @property {'application/x-www-form-urlencoded'|'multipart/form-data'} [enctype='application/x-www-form-urlencoded']
 *                                                         Encoding type; urlencoded is typical for hidden fields.
 * @property {string} [acceptCharset='utf-8']               Form charset.
 * @property {boolean} [novalidate=true]                    Add novalidate to skip built-in HTML5 validation.
 * @property {'on'|'off'} [autocomplete='off']              Form-level autocomplete hint.
 * @property {string} [referrerPolicy='no-referrer']        Form referrer policy attribute (best-effort; modern browsers).
 * @property {string} [rel]                                 Custom rel attribute. If omitted and opening a new tab, "noopener noreferrer" is auto-applied.
 * @property {(ctx:{form:HTMLFormElement, fields:Record<string,string>})=>void} [onBeforeSubmit]
 *                                                         Hook just before submit(); errors are isolated.
 * @property {(ctx:{form:HTMLFormElement})=>void} [onAfterSubmit]
 *                                                         Hook right after submit(); errors are isolated.
 * @property {(err:unknown)=>void} [onError]                Hook on thrown errors (validation/runtime).
 */

/**
 * Submit a real HTML form to an endpoint and then remove it from the DOM.
 * @param {SubmitFormOptions} opts
 * @throws {Error} If required options are missing/invalid.
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
    // NOTE: rel is optional; if omitted and openInNewTab=true, we will enforce "noopener noreferrer".
    rel,
    onBeforeSubmit,
    onAfterSubmit,
    onError,
  } = opts ?? {};

  /** @type {HTMLFormElement | undefined} */
  let form;

  try {
    // ---- Validate essentials
    if (!action || typeof action !== 'string') {
      throw new Error('submitFormToEndpoint: "action" is required (string).');
    }
    if (!Array.isArray(fields) || fields.length === 0) {
      throw new Error('submitFormToEndpoint: "fields" must be a non-empty array.');
    }

    /** @type {HTMLElement} */
    const host = context instanceof HTMLElement ? context : document.body;

    // ---- Create the form element
    form = document.createElement('form');

    // Defensive defaults (customizable)
    if (novalidate) form.setAttribute('novalidate', '');
    if (autocomplete) form.setAttribute('autocomplete', autocomplete);
    if (referrerPolicy) form.setAttribute('referrerpolicy', referrerPolicy);

    // Action/method/encoding
    form.action = action;
    form.method = method.toLowerCase() === 'get' ? 'get' : 'post';
    form.enctype = enctype;
    form.acceptCharset = acceptCharset;

    // Target & rel behavior:
    // - If openInNewTab=true, set target to named or _blank.
    // - If rel is NOT provided and we're opening a new tab, force "noopener noreferrer" (secure-by-default).
    // - If rel IS provided, apply it verbatim.
    // - If openInNewTab=false and rel is provided, we respect it (though it typically matters only for new contexts).
    if (openInNewTab) {
      form.target = newTabName || '_blank';

      if (rel == null || rel === '') {
        // Auto-enforce safe default to mitigate tabnabbing and referrer leakage
        form.setAttribute('rel', 'noopener noreferrer');
      } else {
        form.setAttribute('rel', rel);
      }
    } else if (rel) {
      form.setAttribute('rel', rel);
    }

    // ---- Hidden inputs
    /** @type {Record<string,string>} */
    const flat = {};
    for (const { name, value } of fields) {
      if (!name) continue;
      const input = document.createElement('input');
      input.type = 'hidden';
      input.name = String(name);
      input.value = value != null ? String(value) : '';
      form.appendChild(input);
      flat[input.name] = input.value;
    }

    // ---- Attach to live DOM (required for submit())
    host.appendChild(form);

    // ---- Pre-submit hook (isolated)
    try {
      onBeforeSubmit?.({ form, fields: flat });
    } catch {
      // ignore hook errors
    }

    // ---- Submit (triggers navigation)
    form.submit();

    // ---- Best-effort focus of named target
    if (openInNewTab && focusNewTab && form.target && form.target !== '_self') {
      try {
        const win = window.open('', form.target);
        win?.focus?.();
      } catch {
        // ignore
      }
    }

    // ---- Post-submit hook (isolated)
    try {
      onAfterSubmit?.({ form });
    } catch {
      // ignore hook errors
    }
  } catch (err) {
    try { onError?.(err); } catch { /* ignore */ }
    throw err;
  } finally {
    // ---- Cleanup
    try { form?.remove(); } catch { /* ignore */ }
  }
}
