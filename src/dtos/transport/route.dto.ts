export interface CreateRouteDto {
    name: string;
    description?: string;
    vehicleId: string;
    primaryDriverId: string;
    backupDriverId?: string;
    notifyGuardiansOnStart?: boolean;
    notifyGuardiansOnApproach?: boolean;
    approachNotificationDistanceMeters?: number;
    stops: {
        address: string;
        latitude: number;
        longitude: number;
        stopName?: string;
        studentId?: string;
        estimatedTimeFromStartMinutes?: number;
    }[];
}

export interface UpdateRouteDto extends Partial<CreateRouteDto> {
    status?: string;
    isActive?: boolean;
}
