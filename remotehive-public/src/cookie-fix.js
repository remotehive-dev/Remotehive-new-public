import { parse as parseFn, serialize as serializeFn, parseCookie as parseCookieFn, stringifyCookie as stringifyCookieFn, parseSetCookie as parseSetCookieFn, stringifySetCookie as stringifySetCookieFn } from 'cookie-original';

export const parse = parseFn;
export const serialize = serializeFn;
export const parseCookie = parseCookieFn;
export const stringifyCookie = stringifyCookieFn;
export const parseSetCookie = parseSetCookieFn;
export const stringifySetCookie = stringifySetCookieFn;

export default {
  parse: parseFn,
  serialize: serializeFn,
  parseCookie: parseCookieFn,
  stringifyCookie: stringifyCookieFn,
  parseSetCookie: parseSetCookieFn,
  stringifySetCookie: stringifySetCookieFn,
};
