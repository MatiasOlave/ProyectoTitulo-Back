
export class CreateMaintenanceDto {
    vehicleId: string;
    maintenanceType: string;
    serviceType: string;
    serviceDate: string; // YYYY-MM-DD
    mileageAtService: number;
    serviceProvider: string;
    mechanicName?: string;
    invoiceNumber?: string;
    laborCost?: number;
    partsCost?: number;
    totalCost: number;
    description: string;
    partsReplaced?: string;
    nextServiceDate?: string; // YYYY-MM-DD
    nextServiceMileage?: number;
    status: string;
    invoices?: any; // JSON
    photos?: any; // JSON
}

export interface MaintenanceQueryDto {
    vehicleId?: string;
    maintenanceType?: string;
    startDate?: string;
    endDate?: string;
    limit?: number;
    offset?: number;
}
