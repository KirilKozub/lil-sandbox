8// test/submitFormToEndpoint.test.js
import { expect } from '@open-wc/testing';
import sinon from 'sinon';
import { submitFormToEndpoint } from '../src/submitFormToEndpoint.js';

describe('submitFormToEndpoint (updated)', () => {
  let submitStub;
  let winOpenStub;
  const originalSubmit = HTMLFormElement.prototype.submit;

  beforeEach(() => {
    // Stub native form.submit to avoid navigation
    submitStub = sinon.stub(HTMLFormElement.prototype, 'submit').callsFake(function () {
      // no-op
    });
    // Stub window.open
    winOpenStub = sinon.stub(window, 'open');
    // Clean DOM
    document.body.innerHTML = '';
  });

  afterEach(() => {
    HTMLFormElement.prototype.submit = originalSubmit;
    submitStub.restore?.();
    winOpenStub.restore?.();
    document.body.innerHTML = '';
  });

  it('throws if action is missing', () => {
    expect(() =>
      // @ts-expect-error
      submitFormToEndpoint({ action: undefined, fields: [{ name: 'a', value: '1' }] })
    ).to.throw(/action.*required/i);
  });

  it('throws if fields is empty', () => {
    expect(() =>
      submitFormToEndpoint({ action: '/x', fields: [] })
    ).to.throw(/fields.*non-empty/i);
  });

  it('creates, submits, removes the form (default context = body)', () => {
    submitFormToEndpoint({
      action: '/x',
      fields: [{ name: 'k', value: 'v' }],
    });
    expect(submitStub.calledOnce).to.be.true;
    expect(document.body.querySelector('form')).to.equal(null); // removed
  });

  it('attaches to provided HTMLElement context (connected)', () => {
    const host = document.createElement('div');
    document.body.appendChild(host);
    let seenForm;

    submitFormToEndpoint({
      action: '/x',
      fields: [{ name: 'a', value: '1' }],
      context: host,
      onBeforeSubmit: ({ form }) => (seenForm = form),
    });

    expect(seenForm).to.exist;
    expect(seenForm.parentNode).to.equal(host);
    expect(host.querySelector('form')).to.equal(null); // removed after submit
  });

  it('falls back to body when HTMLElement context is not connected', () => {
    const detached = document.createElement('div'); // not appended -> not connected
    let parentTag;
    submitFormToEndpoint({
      action: '/x',
      fields: [{ name: 'a', value: '1' }],
      context: detached,
      onBeforeSubmit: ({ form }) => (parentTag = form.parentNode?.nodeName),
    });
    expect(parentTag).to.equal('BODY');
  });

  it('attaches to ShadowRoot when provided and connected', () => {
    const host = document.createElement('div');
    document.body.appendChild(host);
    const sr = host.attachShadow({ mode: 'open' });
    let parentIsShadow = false;

    submitFormToEndpoint({
      action: '/x',
      fields: [{ name: 'a', value: '1' }],
      context: sr,
      onBeforeSubmit: ({ form }) => {
        parentIsShadow = form.parentNode === sr;
      },
    });

    expect(parentIsShadow).to.equal(true);
  });

  it('GET without serializeGetInUrl: keeps action URL, creates hidden inputs, submits', () => {
    let formRef;
    submitFormToEndpoint({
      action: '/search',
      method: 'get',
      fields: [{ name: 'q', value: 'tea' }, { name: 'p', value: '1' }],
      onBeforeSubmit: ({ form }) => (formRef = form),
    });

    expect(formRef.action.endsWith('/search')).to.be.true;
    const inputs = [...formRef.querySelectorAll('input[type="hidden"]')];
    expect(inputs.map((i) => [i.name, i.value])).to.deep.equal([['q', 'tea'], ['p', '1']]);
    expect(submitStub.calledOnce).to.be.true;
  });

  it('GET with serializeGetInUrl: appends params to action and does NOT create hidden inputs', () => {
    let formRef;
    submitFormToEndpoint({
      action: '/search?lang=en',
      method: 'get',
      serializeGetInUrl: true,
      fields: [{ name: 'q', value: 'тест' }, { name: 'p', value: 2 }],
      onBeforeSubmit: ({ form }) => (formRef = form),
    });

    expect(formRef.action).to.satisfy((url) => url.includes('lang=en') && url.includes('q=%D1%82%D0%B5%D1%81%D1%82') && url.includes('p=2'));
    const inputs = [...formRef.querySelectorAll('input[type="hidden"]')];
    expect(inputs.length).to.equal(0);
    expect(submitStub.calledOnce).to.be.true;
  });

  it('POST: creates hidden inputs and submits with enctype and charset', () => {
    let formRef;
    submitFormToEndpoint({
      action: '/pay',
      method: 'post',
      enctype: 'application/x-www-form-urlencoded',
      acceptCharset: 'utf-8',
      fields: [{ name: 'amount', value: 100 }, { name: 'currency', value: 'EUR' }],
      onBeforeSubmit: ({ form }) => (formRef = form),
    });

    expect(formRef.method).to.equal('post');
    expect(formRef.enctype).to.equal('application/x-www-form-urlencoded');
    expect(formRef.acceptCharset.toLowerCase()).to.equal('utf-8');
    const inputs = [...formRef.querySelectorAll('input[type="hidden"]')];
    expect(inputs.map((i) => i.name)).to.deep.equal(['amount', 'currency']);
    expect(submitStub.calledOnce).to.be.true;
  });

  it('sets defensive attributes: novalidate, autocomplete, referrerpolicy', () => {
    let formRef;
    submitFormToEndpoint({
      action: '/x',
      fields: [{ name: 'a', value: '1' }],
      novalidate: true,
      autocomplete: 'off',
      referrerPolicy: 'no-referrer',
      onBeforeSubmit: ({ form }) => (formRef = form),
    });
    expect(formRef.hasAttribute('novalidate')).to.be.true;
    expect(formRef.getAttribute('autocomplete')).to.equal('off');
    expect(formRef.getAttribute('referrerpolicy')).to.equal('no-referrer');
  });

  it('openInNewTab=true & no rel: auto-enforces rel="noopener noreferrer"', () => {
    let formRef;
    submitFormToEndpoint({
      action: '/x',
      fields: [{ name: 'a', value: '1' }],
      openInNewTab: true, // new tab, no rel provided
      onBeforeSubmit: ({ form }) => (formRef = form),
    });
    expect(formRef.target).to.equal('_blank');
    expect(formRef.getAttribute('rel')).to.equal('noopener noreferrer');
  });

  it('openInNewTab=true & rel provided: uses custom rel', () => {
    let formRef;
    submitFormToEndpoint({
      action: '/x',
      fields: [{ name: 'a', value: '1' }],
      openInNewTab: true,
      rel: 'noopener', // custom
      onBeforeSubmit: ({ form }) => (formRef = form),
    });
    expect(formRef.getAttribute('rel')).to.equal('noopener');
  });

  it('openInNewTab=false & rel provided: still sets rel attribute', () => {
    let formRef;
    submitFormToEndpoint({
      action: '/x',
      fields: [{ name: 'a', value: '1' }],
      rel: 'external',
      onBeforeSubmit: ({ form }) => (formRef = form),
    });
    expect(formRef.getAttribute('rel')).to.equal('external');
  });

  it('focus attempt only for NAMED tabs (reuse); not for _blank', () => {
    // Case 1: named tab focus
    const fakeWin = { focus: sinon.spy(), closed: false };
    winOpenStub.withArgs('', 'handoff_tab').returns(/** @type {*} */(fakeWin));

    submitFormToEndpoint({
      action: '/x',
      fields: [{ name: 'a', value: '1' }],
      openInNewTab: true,
      newTabName: 'handoff_tab',
      focusNewTab: true,
    });

    expect(winOpenStub.calledWith('', 'handoff_tab')).to.be.true;
    expect(fakeWin.focus.calledOnce).to.be.true;

    // Reset stubs for next case
    winOpenStub.resetHistory();
    fakeWin.focus.resetHistory();

    // Case 2: _blank (no name) → no focusing call
    submitFormToEndpoint({
      action: '/y',
      fields: [{ name: 'b', value: '2' }],
      openInNewTab: true, // target will be _blank (no newTabName)
      focusNewTab: true,
    });

    expect(winOpenStub.called).to.be.false;
  });

  it('onBeforeSubmit receives flat fields map; hook errors are isolated', () => {
    const before = sinon.spy();
    const boom = sinon.stub().throws(new Error('boom'));
    submitFormToEndpoint({
      action: '/x',
      fields: [{ name: 'n', value: 1 }, { name: 'u', value: 'Ю' }],
      onBeforeSubmit: (ctx) => {
        before(ctx);
        boom(); // should not break flow
      },
    });
    expect(before.calledOnce).to.be.true;
    const { fields: flat } = before.firstCall.args[0];
    expect(flat).to.deep.equal({ n: '1', u: 'Ю' });
    expect(submitStub.calledOnce).to.be.true;
  });

  it('onAfterSubmit is called once; errors are isolated; form is removed', () => {
    const after = sinon.stub().throws(new Error('after-fail'));
    submitFormToEndpoint({
      action: '/x',
      fields: [{ name: 'a', value: '1' }],
      onAfterSubmit: after,
    });
    expect(after.calledOnce).to.be.true;
    expect(document.body.querySelector('form')).to.equal(null);
  });

  it('onError is called when function throws', () => {
    const onError = sinon.spy();
    try {
      // cause throw by invalid fields
      // @ts-ignore
      submitFormToEndpoint({ action: '/x', fields: null, onError });
    } catch (e) {
      expect(onError.calledOnce).to.be.true;
      expect(String(e.message || e)).to.match(/fields/i);
      return;
    }
    throw new Error('Expected throw not thrown');
  });

  it('does not mutate input fields array', () => {
    const fields = [{ name: 'a', value: 1 }];
    const snapshot = JSON.parse(JSON.stringify(fields));
    submitFormToEndpoint({ action: '/x', fields });
    expect(fields).to.deep.equal(snapshot);
  });

  it('unicode values are preserved', () => {
    let formRef;
    submitFormToEndpoint({
      action: '/x',
      fields: [{ name: 'msg', value: 'Привіт 🚀' }],
      onBeforeSubmit: ({ form }) => (formRef = form),
    });
    const inp = formRef.querySelector('input[name="msg"]');
    expect(inp.value).to.equal('Привіт 🚀');
  });

  it('handles many fields without issues', () => {
    const fields = Array.from({ length: 40 }, (_, i) => ({ name: `f${i}`, value: `${i}` }));
    let formRef;
    submitFormToEndpoint({
      action: '/bulk',
      fields,
      onBeforeSubmit: ({ form }) => (formRef = form),
    });
    expect(formRef.querySelectorAll('input[type="hidden"]').length).to.equal(40);
  });
});



it('form exists in onBeforeSubmit and is removed after call', () => {
  let seenInBefore = false;
  submitFormToEndpoint({
    action: '/x',
    fields: [{ name: 'a', value: '1' }],
    onBeforeSubmit: ({ form }) => {
      seenInBefore = document.body.contains(form); // true
    },
  });
  expect(seenInBefore).to.equal(true);
  expect(document.body.querySelector('form')).to.equal(null); // removed
});


it('removes the form even if after-hook throws', () => {
  submitFormToEndpoint({
    action: '/x',
    fields: [{ name: 'a', value: '1' }],
    onAfterSubmit: () => { throw new Error('boom'); },
  });
  expect(document.body.querySelector('form')).to.equal(null);
});
