import { IncomingHttpHeaders } from 'http';

export function extractHeaders(source: IncomingHttpHeaders, ...headers: string[]) {
    const result: IncomingHttpHeaders = {};
    for (const header of headers) {
        if (source[header]) {
            result[header] = source[header];
        }
    }
    return result;
}
