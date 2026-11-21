import { Injectable } from '@matchmakerjs/di';
import libphonenumber from 'libphonenumber-js';

@Injectable()
export class PhoneNumberService {
    format(phoneNumber: string): string {
        if (!phoneNumber) return null;
        return libphonenumber(phoneNumber, 'NG')?.number?.toString();
    }
}
