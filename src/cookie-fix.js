import * as cookie from 'cookie-original';

export const parse = cookie.parse || cookie.default?.parse;
export const serialize = cookie.serialize || cookie.default?.serialize;
export const parseCookie = cookie.parseCookie || cookie.default?.parseCookie;
export const stringifyCookie = cookie.stringifyCookie || cookie.default?.stringifyCookie;
export const parseSetCookie = cookie.parseSetCookie || cookie.default?.parseSetCookie;
export const stringifySetCookie = cookie.stringifySetCookie || cookie.default?.stringifySetCookie;

export default cookie.default || cookie;
