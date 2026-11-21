import { Inject, Injectable } from "@matchmakerjs/di";
import { firestore } from "firebase-admin";
import { FIRESTORE } from "../integrations/firebase/firestore-conf";

const COLLECTION = "maintenance_requests";

export type MaintenanceRequestStatus = "PENDING" | "IN_PROGRESS" | "COMPLETED";

export type MaintenanceRequest = {
    id: string;
    unitId: string;
    workspaceId?: string;
    requesterId: string;
    requestType: string;
    description: string;
    photos: string[];
    priority: string;
    status: MaintenanceRequestStatus;
    createdAt: Date;
    updatedAt: Date;
};

function toMaintenanceRequest(
    doc: firestore.QueryDocumentSnapshot,
): MaintenanceRequest {
    const data = doc.data();
    return {
        id: doc.id,
        unitId: data.unitId,
        workspaceId: data.workspaceId,
        requesterId: data.requesterId,
        requestType: data.requestType,
        description: data.description,
        photos: data.photos || [],
        priority: data.priority,
        status: data.status,
        createdAt: data.createdAt?.toDate(),
        updatedAt: data.updatedAt?.toDate(),
    };
}

@Injectable()
export class MaintenanceRequestDao {
    constructor(
        @Inject(FIRESTORE) private firestoreClient: firestore.Firestore,
    ) {}

    async getRecentlyCreated(since: Date): Promise<MaintenanceRequest[]> {
        if (!this.firestoreClient) return [];
        const snapshot = await this.firestoreClient
            .collection(COLLECTION)
            .where("createdAt", ">", firestore.Timestamp.fromDate(since))
            .get();
        return snapshot.docs.map(toMaintenanceRequest);
    }

    async getRecentlyStatusChanged(since: Date): Promise<MaintenanceRequest[]> {
        if (!this.firestoreClient) return [];
        // PENDING is the initial status a request is created with, so excluding it here
        // avoids re-notifying on creation, which is already handled separately.
        const snapshot = await this.firestoreClient
            .collection(COLLECTION)
            .where("status", "in", ["IN_PROGRESS", "COMPLETED"])
            .where("updatedAt", ">", firestore.Timestamp.fromDate(since))
            .get();
        return snapshot.docs.map(toMaintenanceRequest);
    }
}
