import { generateAxiosSdk } from './sdk-generator';
generateAxiosSdk('auth-api-sdk', process.env.AUTH_API_BASE_URL as string);
