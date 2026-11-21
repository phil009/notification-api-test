export interface WorkspaceMessage {
    code: string;
    version: number;
    name: string;
    type: {
        code: string;
    };
    displayPictureUrl: string;
    audit: {
        createdBy: string;
        createdAt: string;
    }
}
