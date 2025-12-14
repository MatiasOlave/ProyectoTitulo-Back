import { AppDataSource } from "../../config/database";
import { Vehicle } from "../../entities/transport/vehicle.entity";
import { VehicleInspection } from "../../entities/transport/vehicle-inspection.entity";
import { MoreThanOrEqual, LessThanOrEqual, Between } from "typeorm";

export interface VehicleAlert {
    type: 'expiration' | 'maintenance' | 'inspection';
    severity: 'critical' | 'warning' | 'info';
    message: string;
    date?: Date;
}

export class VehicleAlertsService {
    private vehicleRepo = AppDataSource.getRepository(Vehicle);
    private inspectionRepo = AppDataSource.getRepository(VehicleInspection);

    async getAlerts(vehicleId: string, companyId: string): Promise<VehicleAlert[]> {
        const vehicle = await this.vehicleRepo.findOne({ where: { id: vehicleId, companyId } });
        if (!vehicle) throw new Error('Vehicle not found');

        const alerts: VehicleAlert[] = [];
        const today = new Date();
        const warningThresholdDays = 30; // Configurable?

        // Helper to check dates
        const checkExpiration = (date: Date, label: string) => {
            if (!date) return;
            const diffTime = new Date(date).getTime() - today.getTime();
            const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

            if (diffDays < 0) {
                alerts.push({
                    type: 'expiration',
                    severity: 'critical',
                    message: `${label} venció el ${new Date(date).toLocaleDateString()}`,
                    date
                });
            } else if (diffDays <= warningThresholdDays) {
                alerts.push({
                    type: 'expiration',
                    severity: 'warning',
                    message: `${label} vence pronto: ${new Date(date).toLocaleDateString()} (${diffDays} días)`,
                    date
                });
            }
        };

        // 1. Expirations
        checkExpiration(vehicle.insuranceExpiryDate, 'Seguro');
        checkExpiration(vehicle.technicalReviewExpiry, 'Revisión Técnica');
        checkExpiration(vehicle.circulationPermitExpiry, 'Permiso de Circulación');
        if (vehicle.hasFireExtinguisher) {
            checkExpiration(vehicle.fireExtinguisherExpiry, 'Extintor');
        }

        // 2. Maintenance
        if (vehicle.nextMaintenanceDate) {
            const maintenanceDate = new Date(vehicle.nextMaintenanceDate);
            if (maintenanceDate <= today) {
                alerts.push({
                    type: 'maintenance',
                    severity: 'critical',
                    message: `Mantención programada pendiente desde ${maintenanceDate.toLocaleDateString()}`,
                    date: maintenanceDate
                });
            } else {
                checkExpiration(maintenanceDate, 'Próxima Mantención');
            }
        }

        // Check mileage for maintenance if available (Not requested by explicit logic "Logica Dias" mostly, but good to have)
        // Ignoring mileage logic for now as user emphasized "Comparar next_maintenance_date".

        // 3. Daily Inspection
        // Check if inspection exists for today
        const startOfDay = new Date();
        startOfDay.setHours(0, 0, 0, 0);
        const endOfDay = new Date();
        endOfDay.setHours(23, 59, 59, 999);

        const inspectionCount = await this.inspectionRepo.count({
            where: {
                vehicleId,
                inspectionDate: Between(startOfDay, endOfDay) as any // TypeORM date handling
            }
        });

        if (inspectionCount === 0) {
            alerts.push({
                type: 'inspection',
                severity: 'warning', // Warning because day isn't over? Or Critical? Let's say Warning until end of day? User requirement implies "No realizada".
                message: 'Inspección diaria no realizada hoy',
                date: today
            });
        }

        return alerts;
    }
}

export const vehicleAlertsService = new VehicleAlertsService();
