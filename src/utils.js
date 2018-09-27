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

function recurseErrors (err, acc, keys) {
  Object.entries(err).forEach(([key, value]) => {
    if (isObject(value) || Array.isArray(value)) {
      keys.push(key);
      recurseErrors(value, acc, keys);
    } else {
      const mergedKey = [...keys, key].join('.');
      if (!get(acc, mergedKey)) {
        set(acc, mergedKey, value);
      }
    }
  });
}

export function concatenateErrors (errors) {
  return errors.reduce((acc, err) => {
    const keys = [];
    recurseErrors(err, acc, keys);
    return acc;
  }, {});
}

export function flattenArray (arr) {
  return [].concat.apply([], arr);
}

export function uuid (a) {
  return a
    ? (a ^ ((Math.random() * 16) >> (a / 4))).toString(16)
    : ([1e7] + -1e3 + -4e3 + -8e3 + -1e11).replace(/[018]/g, uuid);
}
