import { Workspace } from '../../entities/external/workspace/workspace.entity';

export class NotificationApiWorkspaceApiResponse {
    code: string;
    version: number;
    name: string;
    type: string;
    logoUrl: string;

    static fromEntity(entity: Workspace) {
        const response = new NotificationApiWorkspaceApiResponse();
        response.code = entity.id;
        response.name = entity.name;
        response.type = entity.type;
        response.version = entity.audit.version;
        return response;
    }
}
