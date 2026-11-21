import { LgaMessage } from './lga.message';

export class AddressMessage {
    version: number;
    streetAddress: string;
    city: string;
    lga: LgaMessage;
}
