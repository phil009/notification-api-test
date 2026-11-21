import { generateAxiosSdk } from './sdk-generator';
generateAxiosSdk('account-api-sdk', process.env.ACCOUNT_API_BASE_URL as string);
