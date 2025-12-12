import { transporter, mailOptions } from '../config/nodemailer.config';

export const emailService = {
    sendGuardianInvitation: async (email: string, token: string, studentName: string) => {
        const invitationLink = `${process.env.FRONTEND_URL}/invitation/validate/${token}`;

        const htmlContent = `
      <h1>Invitación a Jardín Infantil</h1>
      <p>Hola,</p>
      <p>Has sido invitado como apoderado del estudiante <strong>${studentName}</strong>.</p>
      <p>Para completar tu registro y vincularte con el estudiante, por favor haz clic en el siguiente enlace:</p>
      <a href="${invitationLink}">${invitationLink}</a>
      <p>Este enlace expirará en 48 horas.</p>
      <p>Si no esperabas esta invitación, puedes ignorar este correo.</p>
    `;

        try {
            await transporter.sendMail({
                ...mailOptions,
                to: email,
                subject: 'Invitación a Jardín Infantil',
                html: htmlContent,
            });
            console.log(`Invitación enviada a ${email}`);
        } catch (error) {
            console.error('Error al enviar invitación:', error);
            throw new Error('No se pudo enviar el correo de invitación');
        }
    },

    sendPasswordResetEmail: async (email: string, token: string, firstName: string) => {
        const resetLink = `${process.env.FRONTEND_URL}/reset-password?token=${token}`;

        const htmlContent = `
      <h1>Recuperación de Contraseña</h1>
      <p>Hola ${firstName},</p>
      <p>Has solicitado restablecer tu contraseña. Haz clic en el siguiente enlace para crear una nueva contraseña:</p>
      <a href="${resetLink}">${resetLink}</a>
      <p>Este enlace expirará en 1 hora.</p>
      <p>Si no solicitaste este cambio, por favor ignora este correo.</p>
    `;

        try {
            await transporter.sendMail({
                ...mailOptions,
                to: email,
                subject: 'Recuperación de Contraseña',
                html: htmlContent,
            });
            console.log(`Correo de recuperación enviado a ${email}`);
        } catch (error) {
            console.error('Error al enviar correo de recuperación:', error);
            throw new Error('No se pudo enviar el correo de recuperación');
        }
    },
};
