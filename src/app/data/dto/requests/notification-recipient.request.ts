import { IsDefined, IsNotEmpty } from 'class-validator';

export class NotificationRecipientApiRequest {
    @IsDefined()
    @IsNotEmpty()
    notificationId: string;
}
