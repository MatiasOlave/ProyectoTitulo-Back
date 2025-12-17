
export class CreateInspectionDto {
    vehicleId: string;
    driverId: string; // Must be validated
    inspectionDate: string; // YYYY-MM-DD
    inspectionTime: string; // HH:MM
    checklist: any; // JSON
    mileage: number;
    fuelLevel: string;
    overallStatus: string; // 'approved' | 'with_observations' | 'rejected'
    generalObservations?: string;
    issuesFound?: string;
    requiresMaintenance: boolean;
    photos?: any; // JSON
    driverSignatureUrl?: string; // Optional or auto-generated logic
    // Supervisor fields are for Approval step, not Creation usually, but could be pre-filled
}

export class ApproveInspectionDto {
    supervisorSignatureUrl?: string;
    status: string; // 'approved' | 'rejected'
    generalObservations?: string;
}
