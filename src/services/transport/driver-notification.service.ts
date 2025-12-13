import { transporter, mailOptions } from '../../config/nodemailer.config';

interface AlertContext {
    driverName: string;
    driverEmail: string;
    documentType: string;
    expiryDate: Date;
    daysRemaining: number;
    severity: 'warning' | 'urgent' | 'critical';
    companyAdminEmails?: string[];
}

export const driverNotificationService = {
    async sendExpirationAlert(context: AlertContext) {
        try {
            const { driverName, driverEmail, documentType, expiryDate, daysRemaining, severity, companyAdminEmails } = context;
            const formattedDate = new Date(expiryDate).toLocaleDateString('es-CL');

            // 1. Notify Driver (Always, as a reminder)
            let subject = `⚠️ Alerta de Documento: ${documentType}`;
            if (severity === 'critical') subject = `🚨 URGENTE: Documento Vencido - ${documentType}`;

            const driverHtml = `
                <h2>Hola ${driverName},</h2>
                <p>Te informamos sobre el estado de tu documento: <strong>${documentType}</strong>.</p>
                <ul>
                    <li><strong>Vencimiento:</strong> ${formattedDate}</li>
                    <li><strong>Estado:</strong> ${daysRemaining < 0 ? 'VENCIDO' : `Vence en ${daysRemaining} días`}</li>
                </ul>
                <p>Por favor, gestiona la renovación lo antes posible.</p>
            `;

            await transporter.sendMail({
                ...mailOptions,
                to: driverEmail,
                subject: subject,
                html: driverHtml
            });

            console.log(`[DriverAlert] Email sent to driver ${driverEmail}`);

            // 2. Notify Admins (Only for Urgent/Critical)
            if ((severity === 'urgent' || severity === 'critical') && companyAdminEmails && companyAdminEmails.length > 0) {
                const adminSubject = `[ADMIN] Alerta ${severity.toUpperCase()} de Documentación - ${driverName}`;
                const adminHtml = `
                    <h2>Alerta de Documentación de Conductor</h2>
                    <p>El conductor <strong>${driverName}</strong> tiene un documento en estado <strong>${severity.toUpperCase()}</strong>.</p>
                    <ul>
                        <li><strong>Documento:</strong> ${documentType}</li>
                        <li><strong>Vencimiento:</strong> ${formattedDate}</li>
                        <li><strong>Días Restantes:</strong> ${daysRemaining}</li>
                    </ul>
                    <p>Se requiere gestión inmediata.</p>
                `;

                // Send to all admins (could be batched or individual)
                for (const adminEmail of companyAdminEmails) {
                    await transporter.sendMail({
                        ...mailOptions,
                        to: adminEmail,
                        subject: adminSubject,
                        html: adminHtml
                    });
                }
                console.log(`[DriverAlert] Emails sent to ${companyAdminEmails.length} admins`);
            }

        } catch (error) {
            console.error('[DriverAlert] Error sending notifications:', error);
            // Don't throw, just log to ensure task continues for other drivers
        }
    },

    async sendSuspensionNotification(email: string, name: string, reason: string, startDate: Date, endDate: Date) {
        try {
            const subject = 'Notificación de Suspensión - Sistema de Transporte';
            const html = `
                <h2>Estimado/a ${name},</h2>
                <p>Se le informa que ha sido suspendido de sus funciones de conducción.</p>
                <ul>
                    <li><strong>Motivo:</strong> ${reason}</li>
                    <li><strong>Periodo:</strong> Desde ${new Date(startDate).toLocaleDateString('es-CL')} hasta ${new Date(endDate).toLocaleDateString('es-CL')}</li>
                </ul>
                <p>Por favor, contacte a su supervisor para más detalles.</p>
            `;

            await transporter.sendMail({
                ...mailOptions,
                to: email,
                subject: subject,
                html: html
            });
            console.log(`[DriverSuspension] Email sent to ${email}`);
        } catch (error) {
            console.error('[DriverSuspension] Error sending notification:', error);
        }
    }
};
