const { Resend } = require('resend');
const EmailQueue  = require('../models/EmailQueueSchema');
const emailTemplate = require('./emailTemplate');

const MAX_RETRIES = 3;
const RETRY_DELAY = 2000;

let _resend = null;
const getResend = () => {
    if (!_resend) _resend = new Resend(process.env.RESEND_API_KEY);
    return _resend;
};
const MAIL_FROM = () => process.env.RESEND_FROM || 'MyListys <noreply@mylistys.com>';

// ── Procesador del queue ──────────────────────────────────────────────────────

let procesando = false;

async function procesarQueue() {
    if (procesando) return;
    procesando = true;

    try {
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
            const payload = {
                from:    MAIL_FROM(),
                to:      email.to,
                subject: email.subject,
            };

            payload.html = email.html;

            const { error } = await getResend().emails.send(payload);
            if (error) throw new Error(error.message);

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
        setTimeout(() => {
            EmailQueue.exists({ status: 'pending', attempts: { $lt: MAX_RETRIES } })
                .then(hay => { if (hay) procesarQueue(); })
                .catch(() => {});
        }, 1000);
    }
}

// ── Recuperar pendientes al arrancar ─────────────────────────────────────────

const POLL_INTERVAL = 60 * 1000;
let pollerActivo = false;

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

function iniciarPoller() {
    if (pollerActivo) return;
    pollerActivo = true;
    setInterval(async () => {
        try {
            const hay = await EmailQueue.exists({
                status:   'pending',
                attempts: { $lt: MAX_RETRIES },
            });
            if (hay) {
                console.log('[Mail] Poller: correos pendientes encontrados, procesando...');
                procesarQueue();
            }
        } catch (err) {
            console.error('[Mail] Error en poller:', err.message);
        }
    }, POLL_INTERVAL);
    console.log(`[Mail] Poller iniciado (cada ${POLL_INTERVAL / 1000}s)`);
}

// ── Estado del queue ──────────────────────────────────────────────────────────

async function estadoQueue() {
    const [pending, sent, failed] = await Promise.all([
        EmailQueue.countDocuments({ status: 'pending' }),
        EmailQueue.countDocuments({ status: 'sent' }),
        EmailQueue.countDocuments({ status: 'failed' }),
    ]);
    return { pending, sent, failed, total: pending + sent + failed };
}

// ── Encolar correo ────────────────────────────────────────────────────────────

async function encolarCorreo(to, subject, variables = {}) {
    const html  = emailTemplate(variables);
    const email = await EmailQueue.create({ to, subject, html });
    procesarQueue();
    return email;
}

// ── Funciones públicas ────────────────────────────────────────────────────────

async function enviarCorreoVerificacion(destinatario, nombreUsuario, token) {
    const enlace = `${process.env.FRONTEND_URL}/verificar?token=${token}&username=${nombreUsuario}`;
    await encolarCorreo(destinatario, 'Verifica tu inscripción en MyListys', {
        tipo:      'verificacion',
        username:  nombreUsuario,
        mensaje:   'Gracias por inscribirte. Haz clic en el siguiente enlace para verificar tu correo:',
        cta_url:   enlace,
        cta_texto: 'Verificar mi correo',
    });
}

async function enviarCorreoRecuperacion(destinatario, nombreUsuario, code) {
    await encolarCorreo(destinatario, 'Recuperación de contraseña - MyListys', {
        tipo:     'recuperacion',
        username: nombreUsuario,
        mensaje:  'Recibimos una solicitud para restablecer tu contraseña. Tu código de verificación es:',
        codigo:   code,
    });
}

async function enviarCorreoBienvenida(destinatario, nombreUsuario) {
    await encolarCorreo(destinatario, '¡Bienvenido a MyListys!', {
        tipo:      'bienvenida',
        username:  nombreUsuario,
        mensaje:   '¡Tu cuenta ha sido activada exitosamente! Ya puedes empezar a crear y compartir tus listas de contenido.',
        cta_url:   process.env.FRONTEND_URL || 'https://mylistys.com',
        cta_texto: 'Ir a MyListys',
    });
}

async function enviarCorreoConfirmacionPassword(destinatario, nombreUsuario) {
    await encolarCorreo(destinatario, 'Tu contraseña fue actualizada - MyListys', {
        tipo:     'alerta',
        username: nombreUsuario,
        mensaje:  'Tu contraseña ha sido restablecida exitosamente. Si no realizaste este cambio, comunícate con soporte de inmediato.',
    });
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

module.exports = {
    recuperarPendientes,
    iniciarPoller,
    estadoQueue,
    encolarCorreo,
    enviarCorreoVerificacion,
    enviarCorreoRecuperacion,
    enviarCorreoBienvenida,
    enviarCorreoConfirmacionPassword,
};
