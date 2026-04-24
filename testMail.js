const dotenv = require('dotenv');
dotenv.config({ path: './.env.development' });

const { Resend }      = require('resend');
const emailTemplate   = require('./helpers/emailTemplate');

const resend = new Resend(process.env.RESEND_API_KEY);

async function testMail() {
    const html = emailTemplate({
        username:  'Milton',
        mensaje:   '¡Tu cuenta ha sido activada exitosamente! Ya puedes empezar a crear y compartir tus listas de contenido.',
        cta_url:   'https://mylistys.com',
        cta_texto: 'Ir a MyListys',
    });

    const { data, error } = await resend.emails.send({
        from:    process.env.RESEND_FROM,
        to:      'vargasmorenom@gmail.com',
        subject: '¡Bienvenido a MyListys!',
        html,
    });

    if (error) {
        console.error('[Resend] Error:', error);
    } else {
        console.log('[Resend] Enviado correctamente. ID:', data.id);
    }
}

testMail();
