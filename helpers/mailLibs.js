const nodemailer = require('nodemailer');
const EmailQueue = require('../models/EmailQueueSchema');

const MAIL_USER   = process.env.MAIL_USER;
const MAX_RETRIES = 3;
const RETRY_DELAY = 2000; // ms entre reintentos

const transporter = nodemailer.createTransport({
    host: 'smtp.gmail.com',
    port: 587,
    secure: false,
    auth: {
        user: MAIL_USER,
        pass: process.env.MAIL_PASS,
    },
});

// ── Procesador del queue ──────────────────────────────────────────────────────

let procesando = false;

async function procesarQueue() {
    if (procesando) return;
    procesando = true;

    try {
        // Tomar el correo pendiente más antiguo
        const email = await EmailQueue.findOneAndUpdate(
            { status: 'pending', attempts: { $lt: MAX_RETRIES } },
            { $inc: { attempts: 1 } },
            { sort: { createdAt: 1 }, new: true }
        );

        if (!email) {
            procesando = false;
            return;
        }

        try {
            await transporter.sendMail({
                from:    `"ListyFy" <${MAIL_USER}>`,
                to:      email.to,
                subject: email.subject,
                html:    email.html,
            });

            await EmailQueue.findByIdAndUpdate(email._id, {
                status:    'sent',
                sentAt:    new Date(),
                lastError: null,
            });

            console.log(`[Mail] Enviado a ${email.to} — ID: ${email._id}`);

        } catch (sendError) {
            const agotado = email.attempts >= MAX_RETRIES;

            await EmailQueue.findByIdAndUpdate(email._id, {
                status:    agotado ? 'failed' : 'pending',
                lastError: sendError.message,
            });

            if (agotado) {
                console.error(`[Mail] Falló definitivamente a ${email.to} tras ${MAX_RETRIES} intentos:`, sendError.message);
            } else {
                console.warn(`[Mail] Intento ${email.attempts}/${MAX_RETRIES} fallido para ${email.to}. Reintentando...`);
                await sleep(RETRY_DELAY);
            }
        }

    } finally {
        procesando = false;
        // Esperar 1 segundo entre envíos para no saturar el SMTP
        setTimeout(() => {
            EmailQueue.exists({ status: 'pending', attempts: { $lt: MAX_RETRIES } })
                .then(hay => { if (hay) procesarQueue(); })
                .catch(() => {});
        }, 1000);
    }
}

// ── Recuperar pendientes al arrancar ─────────────────────────────────────────

async function recuperarPendientes() {
    try {
        const pendientes = await EmailQueue.countDocuments({
            status:   'pending',
            attempts: { $lt: MAX_RETRIES },
        });

        if (pendientes > 0) {
            console.log(`[Mail] Recuperando ${pendientes} correo(s) pendiente(s)...`);
            procesarQueue();
        }
    } catch (err) {
        console.error('[Mail] Error al recuperar pendientes:', err.message);
    }
}

// ── Encolar correo ────────────────────────────────────────────────────────────

async function encolarCorreo(to, subject, html) {
    const email = await EmailQueue.create({ to, subject, html });
    procesarQueue();
    return email;
}

// ── Funciones públicas ────────────────────────────────────────────────────────

async function enviarCorreoVerificacion(destinatario, nombreUsuario, token) {
    const enlace = `${process.env.FRONTEND_URL}/verificar?token=${token}&username=${nombreUsuario}`;
    await encolarCorreo(
        destinatario,
        'Verifica tu inscripción',
        `
        <h3>Hola ${nombreUsuario},</h3>
        <p>Gracias por inscribirte. Haz clic en el siguiente enlace para verificar tu correo:</p>
        <a href="${enlace}">Verificar mi correo</a>
        <p>Si no fuiste tú, ignora este mensaje.</p>
        `
    );
}

async function enviarCorreoRecuperacion(destinatario, nombreUsuario, code) {
    await encolarCorreo(
        destinatario,
        'Recuperación de contraseña',
        `
        <h3>Hola ${nombreUsuario},</h3>
        <p>Recibimos una solicitud para restablecer tu contraseña.</p>
        <p>Tu código de verificación es:</p>
        <h1 style="letter-spacing:8px">${code}</h1>
        <p>Este código expira en <strong>15 minutos</strong>.</p>
        <p>Si no fuiste tú, ignora este mensaje.</p>
        `
    );
}

async function enviarCorreoConfirmacionPassword(destinatario, nombreUsuario) {
    await encolarCorreo(
        destinatario,
        'Tu contraseña fue actualizada',
        `
        <h3>Hola ${nombreUsuario},</h3>
        <p>Tu contraseña ha sido restablecida exitosamente.</p>
        <p>Si no realizaste este cambio, comunícate con soporte de inmediato.</p>
        `
    );
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

module.exports = {
    recuperarPendientes,
    enviarCorreoVerificacion,
    enviarCorreoRecuperacion,
    enviarCorreoConfirmacionPassword,
};
