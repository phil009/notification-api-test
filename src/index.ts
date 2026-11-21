import dayjs from 'dayjs';
import * as fs from 'fs';
import { PropertyLoader } from './utils/property-loader';
for (const filePath of process.env.SECRET_ENV_FILES?.split(/ *, */) || []) {
    const result = PropertyLoader.parse(fs.readFileSync(filePath, 'utf-8'));
    for (const key in result) {
        process.env[key] = result[key];
    }
}

// eslint-disable-next-line
dayjs.extend(require('dayjs/plugin/relativeTime'));

import('./server');
