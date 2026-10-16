import { Email } from '../../domain/email.js'

interface PasswordResetTemplateData {
    resetLink: string
}

const escapeHtml = (value: string) =>
    value
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')

const passwordResetTemplate = ({resetLink}: PasswordResetTemplateData): Omit<Email, 'to'> => {
    const link = escapeHtml(resetLink)

    return {
        subject: 'Restablece tu contraseña',
        html: `
            <p>Hola,</p>
            <p>Recibimos una solicitud para restablecer la contraseña de tu cuenta.</p>
            <p><a href="${link}">Restablecer contraseña</a></p>
            <p>Si no fuiste tú, ignora este correo: tu contraseña no cambiará.</p>
        `,
        text: [
            'Hola,',
            'Recibimos una solicitud para restablecer la contraseña de tu cuenta.',
            `Abre este enlace para restablecerla: ${resetLink}`,
            'Si no fuiste tú, ignora este correo: tu contraseña no cambiará.',
        ].join('\n\n'),
    }
}

export default passwordResetTemplate
