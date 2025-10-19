/**
 * @file submitFormToEndpoint.js
 * Dynamically creates a <form>, injects hidden inputs, submits it (GET/POST), and removes it.
 * Supports HTMLElement/ShadowRoot context, serializeGetInUrl, secure defaults,
 * auto rel for _blank, and focus attempt only for named tabs.
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
  return !!v && typeof v === 'object' && (
    (typeof ShadowRoot !== 'undefined' && v instanceof ShadowRoot) ||
    ('host' in /** @type {any} */(v) && /** @type {any} */(v).nodeType === Node.DOCUMENT_FRAGMENT_NODE)
  );
}
/** @param {unknown} v @returns {v is HTMLElement} */
function isHTMLElementSafe(v) { return !!v && v instanceof HTMLElement; }
/** @param {unknown} v @returns {boolean} */
function isConnectedNode(v) { return !!(/** @type {Node} */(v))?.isConnected; }

/**
 * @param {unknown} ctx
 * @returns {HTMLElement|ShadowRoot}
 */
function resolveHost(ctx) {
  if (isShadowRootSafe(ctx)) return isConnectedNode(ctx) ? /** @type {ShadowRoot} */(ctx) : document.body;
  if (isHTMLElementSafe(ctx)) return isConnectedNode(ctx) ? /** @type {HTMLElement} */(ctx) : document.body;
  return document.body;
}

/**
 * @param {SubmitFormOptions} opts
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
    if (!action || typeof action !== 'string') throw new Error('submitFormToEndpoint: "action" is required (string).');
    if (!Array.isArray(fields) || fields.length === 0) throw new Error('submitFormToEndpoint: "fields" must be a non-empty array.');

    const host = resolveHost(context);

    // Build flat map (без continue)
    let finalAction = action;
    /** @type {Record<string,string>} */
    const flat = (fields || []).reduce((acc, f) => {
      if (f && typeof f.name === 'string' && f.name) acc[f.name] = f.value != null ? String(f.value) : '';
      return acc;
    }, {});

    // Inline GET params into URL if requested
    if (method.toLowerCase() === 'get' && serializeGetInUrl) {
      try {
        const url = new URL(finalAction, window.location.href);
        for (const [k, v] of Object.entries(flat)) url.searchParams.append(k, v);
        finalAction = url.toString();
      } catch {
        const sep = finalAction.includes('?') ? '&' : '?';
        const q = Object.entries(flat).map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(v)}`).join('&');
        finalAction = finalAction + sep + q;
      }
    }

    // Create form
    form = document.createElement('form');
    if (novalidate) form.setAttribute('novalidate', '');
    if (autocomplete) form.setAttribute('autocomplete', autocomplete);
    if (referrerPolicy) form.setAttribute('referrerpolicy', referrerPolicy);

    form.action = finalAction;
    form.method = method.toLowerCase() === 'get' ? 'get' : 'post';
    form.enctype = enctype;
    form.acceptCharset = acceptCharset;

    if (openInNewTab) {
      form.target = newTabName || '_blank';
      form.setAttribute('rel', rel == null || rel === '' ? 'noopener noreferrer' : rel);
    } else if (rel) {
      form.setAttribute('rel', rel);
    }

    // Add hidden inputs (без continue). Пропускаем, если GET-in-URL включён.
    if (!(method.toLowerCase() === 'get' && serializeGetInUrl)) {
      for (const item of fields) {
        const name = item?.name;
        if (typeof name === 'string' && name) {
          const input = document.createElement('input');
          input.type = 'hidden';
          input.name = name;
          input.value = item.value != null ? String(item.value) : '';
          form.appendChild(input);
        }
      }
    }

    host.appendChild(form);

    try { onBeforeSubmit?.({ form, fields: flat }); } catch {}
    form.submit();

    // Focus only for named tabs
    if (openInNewTab && focusNewTab && newTabName && form.target === newTabName) {
      try { window.open('', newTabName)?.focus?.(); } catch {}
    }

    try { onAfterSubmit?.({ form }); } catch {}
  } catch (err) {
    try { onError?.(err); } catch {}
    throw err;
  } finally {
    try { form?.remove(); } catch {}
  }
}
```0