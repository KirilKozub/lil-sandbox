/**
 * @typedef {string | number | boolean | null | undefined} Primitive
 */

/**
 * @typedef {Object} DiffItem
 * @property {string} path - Например: "user.name" или "items[2].price"
 * @property {"added"|"removed"|"changed"|"type-changed"} kind
 * @property {any} before
 * @property {any} after
 */

/**
 * @param {any} v
 * @returns {v is Primitive}
 */
function isPrimitive(v) {
  return v === null || (typeof v !== 'object' && typeof v !== 'function');
}

/**
 * @param {string} base
 * @param {string} key
 * @returns {string}
 */
function joinPath(base, key) {
  if (!base) {
    return key;
  }
  if (key.startsWith('[')) {
    return `${base}${key}`;
  }
  return `${base}.${key}`;
}

/**
 * @param {any} value
 * @returns {string}
 */
function typeOf(value) {
  if (value === null) {
    return 'null';
  }
  if (Array.isArray(value)) {
    return 'array';
  }
  return typeof value;
}

/**
 * Diff двух значений (объект/массив/примитивы). Возвращает список различий.
 *
 * Ограничение: ожидается, что "листья" — примитивы (number/string/boolean/null/undefined).
 *
 * @param {any} before
 * @param {any} after
 * @returns {DiffItem[]}
 */
function diffValues(before, after) {
  return diffValuesAtPath('', before, after);
}

/**
 * @param {string} path
 * @param {any} before
 * @param {any} after
 * @returns {DiffItem[]}
 */
function diffValuesAtPath(path, before, after) {
  if (Object.is(before, after)) {
    return [];
  }

  const beforeType = typeOf(before);
  const afterType = typeOf(after);

  // Если один примитив, а другой объект/массив, или разные типы — это type-changed
  if (beforeType !== afterType) {
    return [{
      path,
      kind: 'type-changed',
      before,
      after,
    }];
  }

  // Оба примитивы одного типа, но не равны
  if (isPrimitive(before) && isPrimitive(after)) {
    return [{
      path,
      kind: 'changed',
      before,
      after,
    }];
  }

  // Дальше: оба не примитивы (array/object)
  if (Array.isArray(before) && Array.isArray(after)) {
    return diffArrays(path, before, after);
  }

  // Обычные объекты
  return diffObjects(path, before, after);
}

/**
 * @param {string} path
 * @param {any[]} beforeArr
 * @param {any[]} afterArr
 * @returns {DiffItem[]}
 */
function diffArrays(path, beforeArr, afterArr) {
  const diffs = [];
  const maxLen = Math.max(beforeArr.length, afterArr.length);

  for (let i = 0; i < maxLen; i += 1) {
    const keyPath = joinPath(path, `[${i}]`);

    const beforeHas = i < beforeArr.length;
    const afterHas = i < afterArr.length;

    if (!beforeHas && afterHas) {
      diffs.push({ path: keyPath, kind: 'added', before: undefined, after: afterArr[i] });
    } else if (beforeHas && !afterHas) {
      diffs.push({ path: keyPath, kind: 'removed', before: beforeArr[i], after: undefined });
    } else {
      diffs.push(...diffValuesAtPath(keyPath, beforeArr[i], afterArr[i]));
    }
  }

  return diffs;
}

/**
 * @param {string} path
 * @param {Record<string, any>} beforeObj
 * @param {Record<string, any>} afterObj
 * @returns {DiffItem[]}
 */
function diffObjects(path, beforeObj, afterObj) {
  const diffs = [];
  const keys = new Set([...Object.keys(beforeObj), ...Object.keys(afterObj)]);

  keys.forEach((key) => {
    const nextPath = joinPath(path, key);

    const beforeHas = Object.prototype.hasOwnProperty.call(beforeObj, key);
    const afterHas = Object.prototype.hasOwnProperty.call(afterObj, key);

    if (!beforeHas && afterHas) {
      diffs.push({ path: nextPath, kind: 'added', before: undefined, after: afterObj[key] });
      return;
    }
    if (beforeHas && !afterHas) {
      diffs.push({ path: nextPath, kind: 'removed', before: beforeObj[key], after: undefined });
      return;
    }

    diffs.push(...diffValuesAtPath(nextPath, beforeObj[key], afterObj[key]));
  });

  return diffs;
}

/**
 * Удобный хелпер: равны ли значения (по правилам diff).
 * @param {any} a
 * @param {any} b
 * @returns {boolean}
 */
function deepEqualByDiff(a, b) {
  return diffValues(a, b).length === 0;
}