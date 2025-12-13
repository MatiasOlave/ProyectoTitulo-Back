import { AppDataSource } from '../config/database';
import { DriverDocument } from '../entities/transport/driver-document.entity';
import { DriverDocumentAlert } from '../entities/transport/driver-document-alert.entity';
import { User } from '../entities/auth/user.entity';
import { driverNotificationService } from '../services/transport/driver-notification.service';
import { MoreThan } from 'typeorm';

const CHECK_INTERVAL_MS = 24 * 60 * 60 * 1000; // 24 Hours
// For testing/demo purposes, you might want to call checkDocuments() immediately on start.

export const startDocumentMonitor = () => {
    console.log('[DocumentMonitor] Starting daily check task...');

    // Run immediately on server start to catch up? 
    // Or set timeout. Let's run a check 10 seconds after boot to verify it works, then interval.
    setTimeout(() => {
        checkDocuments();
    }, 10 * 1000);

    setInterval(() => {
        checkDocuments();
    }, CHECK_INTERVAL_MS);
};

export const checkDocuments = async () => {
    console.log('[DocumentMonitor] Running document check...');
    const docRepo = AppDataSource.getRepository(DriverDocument);
    const alertRepo = AppDataSource.getRepository(DriverDocumentAlert);
    const userRepo = AppDataSource.getRepository(User);

    try {
        // 1. Fetch all non-permanent documents that have an expiry date
        // We join driver to get email and companyId
        const documents = await docRepo.find({
            where: { isPermanent: false },
            relations: ['driver', 'driver.user']
        });

        const today = new Date();
        today.setHours(0, 0, 0, 0);

        for (const doc of documents) {
            if (!doc.expiryDate) continue;

            const expiry = new Date(doc.expiryDate);
            expiry.setHours(0, 0, 0, 0);

            // Calculate diff in days
            const diffTime = expiry.getTime() - today.getTime();
            const daysRemaining = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

            let newStatus = 'valid';
            let alertLevel: 'warning' | 'urgent' | 'critical' | null = null;

            // Logic Rules
            if (daysRemaining < 0) {
                newStatus = 'vencido';
                alertLevel = 'critical';
            } else if (daysRemaining <= 15) {
                newStatus = 'por vencer';
                alertLevel = 'urgent';
            } else if (daysRemaining <= 30) {
                newStatus = 'por vencer';
                alertLevel = 'warning';
            } else {
                newStatus = 'valid';
            }

            // Update Document Status if changed
            if (doc.status !== newStatus) {
                doc.status = newStatus;
                await docRepo.save(doc);
            }

            // If there's an alert level, handle Alert Entity and Notification
            if (alertLevel) {
                // Check if active alert already exists for this document to avoid spamming everyday?
                // Request says "daily while alert is active" for reminders? 
                // "Implementar lógica para enviar recordatorios automáticos... diariamente mientras la alerta esté activa"

                // Find existing active alert
                let alert = await alertRepo.findOne({
                    where: {
                        documentId: doc.id,
                        isActive: true,
                        resolved: false
                    }
                });

                if (!alert) {
                    // Create new Alert
                    alert = alertRepo.create({
                        companyId: doc.driver.companyId,
                        driverId: doc.driverId,
                        documentId: doc.id,
                        alertType: 'EXPIRATION',
                        severity: alertLevel,
                        message: `Documento ${doc.documentType} vence en ${daysRemaining} días (o ya venció).`,
                        daysUntilExpiry: daysRemaining,
                        isActive: true,
                        resolved: false
                    });
                } else {
                    // Update existing alert
                    alert.daysUntilExpiry = daysRemaining;
                    alert.severity = alertLevel; // Update severity if it got worse
                    alert.message = `Documento ${doc.documentType} vence en ${daysRemaining} días.`;
                }

                await alertRepo.save(alert);

                // Fetch Admins for Company (for Urgent/Critical)
                let adminEmails: string[] = [];
                if (alertLevel !== 'warning') {
                    const admins = await userRepo.find({
                        where: {
                            companyId: doc.driver.companyId,
                            isActive: true
                        },
                        relations: ['userRoles', 'userRoles.role']
                    });

                    adminEmails = admins
                        .filter(u => u.userRoles && u.userRoles.some(ur => ur.role && ['ADMIN', 'DIRECTOR', 'ENCARGADO_TRANSPORTE'].includes(ur.role.code)))
                        .map(u => u.email);
                }

                // Send Notification
                await driverNotificationService.sendExpirationAlert({
                    driverName: `${doc.driver.firstName} ${doc.driver.lastName}`,
                    driverEmail: doc.driver.email, // Or doc.driver.user.email
                    documentType: doc.documentType,
                    expiryDate: expiry,
                    daysRemaining,
                    severity: alertLevel,
                    companyAdminEmails: adminEmails
                });
            } else {
                // If alertLevel became null (updated doc date?), resolve existing alerts
                const existingAlert = await alertRepo.findOne({
                    where: { documentId: doc.id, isActive: true }
                });
                if (existingAlert) {
                    existingAlert.isActive = false;
                    existingAlert.resolved = true;
                    existingAlert.resolutionNotes = 'Auto-resolved: Date updated or valid.';
                    existingAlert.resolvedAt = new Date();
                    await alertRepo.save(existingAlert);
                }
            }
        }

        console.log(`[DocumentMonitor] Check complete. Processed ${documents.length} documents.`);

    } catch (error) {
        console.error('[DocumentMonitor] Error checking documents:', error);
    }
};
