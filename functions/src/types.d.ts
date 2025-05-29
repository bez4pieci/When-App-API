import type { Timestamp } from "firebase-admin/firestore";

export interface LiveActivity {
    activityId: string;
    userDeviceId: string;
    createdAt: Timestamp;
    isActive: boolean;
    pushToken: string;
    stationId: string;
    stationName: string;
    updatedAt: Timestamp;
}

export interface DepartureInfo {
    lineLabel: string;
    destination: string;
    plannedTime: number;
    predictedTime: number | null;
    isCancelled: boolean;
} 