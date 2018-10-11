import get from 'lodash.get';
import set from 'lodash.set';

export function noop () {}

export function isObject (obj) {
  return typeof obj === 'object' && obj !== null && !Array.isArray(obj);
}

export function isPromise (obj) {
  return isObject(obj) && typeof obj.then === 'function';
}

export function isFunction (obj) {
  return obj && typeof obj === 'function';
}

export function isNullOrUndefined (obj) {
  return obj === null || obj === undefined;
}

// from https://github.com/hughsk/flat/blob/master/index.js
export function flatten (target) {
  const output = {};

  function step (obj, prev) {
    Object.keys(obj).forEach(function (key) {
      const value = obj[key];

      const newKey = prev ? `${prev}.${key}` : key;

      if (
        (isObject(value) || Array.isArray(value)) &&
        Object.keys(value).length
      ) {
        return step(value, newKey);
      }

      output[newKey] = value;
    });
  }

  step(target);

  return output;
}

export function flattenArray (arr) {
  return [].concat.apply([], arr);
}

export function concatenateErrors (errors) {
  return errors.reduce((acc, err) => {
    const flatError = flatten(err);
    Object.keys(flatError).forEach(key => {
      if (!get(acc, key)) {
        // All falsey values are considered to be non-errors
        set(acc, key, flatError[key] || null);
      }
    });
    return acc;
  }, {});
}

export function reduceError (errors, name) {
  return (
    errors.reduce((acc, err) => {
      if (!acc) {
        acc = isObject(err) ? get(err, name, null) : err;
      }
      return acc;
    }, null) || null // All falsey values are considered to be non-errors
  );
}

export function uuid (a) {
  return a
    ? (a ^ ((Math.random() * 16) >> (a / 4))).toString(16)
    : ([1e7] + -1e3 + -4e3 + -8e3 + -1e11).replace(/[018]/g, uuid);
}
