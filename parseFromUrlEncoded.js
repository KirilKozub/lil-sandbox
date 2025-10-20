/**
 * Parse application/x-www-form-urlencoded string into a deeply nested object.
 * Supports dotted keys (e.g., user.name.first=John → { user: { name: { first: 'John' }}}).
 * Converts "true"/"false"/"null"/numbers" to proper JS types.
 * Prevents prototype pollution.
 *
 * @param {string} encodedStr - URL-encoded string (e.g., a=b&user.name=John)
 * @returns {Record<string, any>} - Nested object.
 */
export function parseFormUrlEncoded(encodedStr) {
  const result = {};
  const params = new URLSearchParams(encodedStr);

  /**
   * @param {string} raw - raw value
   * @returns {any}
   */
  function castType(raw) {
    const value = raw.trim();

    if (/^(true|false)$/i.test(value)) {
      return value.toLowerCase() === 'true';
    }
    if (/^null$/i.test(value)) {
      return null;
    }
    if (/^-?\d+(\.\d+)?$/.test(value)) {
      return Number(value);
    }
    return value;
  }

  /**
   * @param {Record<string, any>} target
   * @param {string[]} path
   * @param {any} value
   */
  function setNestedValue(target, path, value) {
    let current = target;

    for (let i = 0; i < path.length; i += 1) {
      const key = path[i];
      const isLast = i === path.length - 1;

      // Avoid prototype pollution
      if (key === '__proto__' || key === 'constructor' || key === 'prototype') {
        return;
      }

      // Detect if next key is array index
      const nextKey = path[i + 1];
      const nextIsIndex = !Number.isNaN(Number(nextKey));

      if (isLast) {
        current[key] = value;
      } else if (current[key] === undefined) {
        current[key] = nextIsIndex ? [] : {};
      } else if (
        typeof current[key] !== 'object' ||
        current[key] === null
      ) {
        // Skip overriding non-objects
        return;
      }

      current = current[key];
    }
  }

  for (const [rawKey, rawValue] of params.entries()) {
    const path = rawKey.split('.').filter(Boolean);
    const value = castType(rawValue);
    setNestedValue(result, path, value);
  }

  return result;
}


// parseFormUrlEncoded.test.js
import { expect } from '@open-wc/testing';
import { parseFormUrlEncoded } from './parseFormUrlEncoded.js';

describe('parseFormUrlEncoded', () => {
  it('parses simple dotted nesting', () => {
    const str = 'user.name.first=John&user.name.last=Doe';
    const out = parseFormUrlEncoded(str);
    expect(out).to.deep.equal({ user: { name: { first: 'John', last: 'Doe' } } });
  });

  it('casts booleans, null, and numbers', () => {
    const str = 'a=true&b=False&c=null&d=42&e=-3.14&f=  7  ';
    const out = parseFormUrlEncoded(str);
    expect(out).to.deep.equal({
      a: true,
      b: false,
      c: null,
      d: 42,
      e: -3.14,
      f: 7,
    });
  });

  it('creates arrays for numeric segments', () => {
    const str = [
      'items.0.name=Alpha',
      'items.0.qty=2',
      'items.1.name=Beta',
      'items.1.qty=3',
    ].join('&');
    const out = parseFormUrlEncoded(str);
    expect(Array.isArray(out.items)).to.equal(true);
    expect(out.items).to.have.length(2);
    expect(out.items[0]).to.deep.equal({ name: 'Alpha', qty: 2 });
    expect(out.items[1]).to.deep.equal({ name: 'Beta', qty: 3 });
  });

  it('handles spaces and + decoding as URLSearchParams should', () => {
    const str = 'company.name=Test+AG&company.city=D%C3%BCsseldorf';
    const out = parseFormUrlEncoded(str);
    expect(out.company.name).to.equal('Test AG');
    expect(out.company.city).to.equal('Düsseldorf');
  });

  it('does not override non-objects on conflicting paths', () => {
    // First sets `a` as a primitive, then tries to put `a.b`
    const str = 'a=1&a.b=2';
    const out = parseFormUrlEncoded(str);
    expect(out).to.deep.equal({ a: 1 }); // second key is skipped by design
  });

  it('guards against prototype pollution', () => {
    const str = '__proto__.polluted=yes&constructor.prototype.hacked=1&safe.value=ok';
    const out = parseFormUrlEncoded(str);
    expect({}.polluted).to.equal(undefined);
    expect(Object.prototype.hacked).to.equal(undefined);
    expect(out).to.deep.equal({ safe: { value: 'ok' } });
  });

  it('ignores empty path segments and keeps empty strings as strings', () => {
    const str = 'user..name=&title=';
    const out = parseFormUrlEncoded(str);
    expect(out).to.deep.equal({ user: { name: '' }, title: '' });
  });

  it('supports deep mixed nesting with arrays and objects', () => {
    const str = [
      'order.id=1001',
      'order.customer.firstName=Jane',
      'order.customer.lastName=Doe',
      'order.lines.0.sku=A1',
      'order.lines.0.qty=1',
      'order.lines.1.sku=B2',
      'order.lines.1.qty=4',
      'order.meta.gift=false',
    ].join('&');
    const out = parseFormUrlEncoded(str);
    expect(out.order.id).to.equal(1001);
    expect(out.order.customer.lastName).to.equal('Doe');
    expect(out.order.lines[1].sku).to.equal('B2');
    expect(out.order.meta.gift).to.equal(false);
  });
});