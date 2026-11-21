import { generateAxiosSdk } from './sdk-generator';
generateAxiosSdk('rbac-api-sdk', process.env.RBAC_API_BASE_URL as string);
