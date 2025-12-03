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
};
