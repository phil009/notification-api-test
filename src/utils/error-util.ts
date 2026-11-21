import axios from 'axios';
import { ServerResponse } from 'http';

export function propagateError(error: unknown, response: ServerResponse) {
    if (axios.isAxiosError(error) && error.response) {
        response.writeHead(error.response.status, {
            'content-type': error.response.headers['content-type'],
        });
        response.end(JSON.stringify(error.response.data));
        return;
    }
    throw error;
}
