import nodemailer from 'nodemailer';

class EmailService {
    private transporter;

    constructor() {
        // Use environment variables for real config
        // For development, we can fallback to Ethereal or just log if no config
        this.transporter = nodemailer.createTransport({
            host: process.env.SMTP_HOST || 'smtp.ethereal.email',
            port: parseInt(process.env.SMTP_PORT || '587'),
            auth: {
                user: process.env.SMTP_USER || 'ethereal_user',
                pass: process.env.SMTP_PASS || 'ethereal_pass'
            }
        });
    }

    async sendEmail(to: string, subject: string, html: string) {
        try {
            const info = await this.transporter.sendMail({
                from: process.env.SMTP_FROM || '"KinderCloud" <no-reply@kindercloud.com>',
                to,
                subject,
                html,
            });
            console.log(`Message sent: ${info.messageId}`);
            // Preview only available when sending through an Ethereal account
            // console.log("Preview URL: %s", nodemailer.getTestMessageUrl(info));
            return true;
        } catch (error) {
            console.error('Error sending email:', error);
            return false;
        }
    }

    async sendAttendanceAlert(guardianEmail: string, studentName: string, alertType: string) {
        const subject = `Alerta de Asistencia - ${studentName}`;
        const html = `
            <h1>Alerta de Asistencia</h1>
            <p>Estimado apoderado,</p>
            <p>Se ha generado una alerta de asistencia para el estudiante <strong>${studentName}</strong>.</p>
            <p><strong>Tipo de alerta:</strong> ${alertType}</p>
            <p>Por favor, póngase en contacto con el establecimiento lo antes posible.</p>
            <br>
            <p>Atentamente,<br>KinderCloud</p>
        `;
        return this.sendEmail(guardianEmail, subject, html);
    }

    async sendGuardianInvitation(email: string, token: string, studentName: string) {
        const url = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/invitation/validate/${token}`;
        const subject = 'Invitación a KinderCloud';
        const html = `
            <h1>Bienvenido a KinderCloud</h1>
            <p>Has sido invitado a unirte a KinderCloud como apoderado del estudiante <strong>${studentName}</strong>.</p>
            <p>Para aceptar la invitación y configurar tu cuenta, haz clic en el siguiente enlace:</p>
            <a href="${url}">${url}</a>
            <p>Este enlace expirará en 48 horas.</p>
            <br>
            <p>Atentamente,<br>KinderCloud</p>
        `;
        return this.sendEmail(email, subject, html);
    }

    async sendPasswordResetEmail(email: string, token: string, firstName: string) {
        const url = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/auth/reset-password?token=${token}`;
        const subject = 'Recuperación de Contraseña - KinderCloud';
        const html = `
            <h1>Recuperación de Contraseña</h1>
            <p>Hola ${firstName},</p>
            <p>Has solicitado restablecer tu contraseña. Haz clic en el siguiente enlace para continuar:</p>
            <a href="${url}">${url}</a>
            <p>Si no solicitaste este cambio, puedes ignorar este correo.</p>
            <br>
            <p>Atentamente,<br>KinderCloud</p>
        `;
        return this.sendEmail(email, subject, html);
    }
}

export const emailService = new EmailService();
