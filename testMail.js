const dotenv = require('dotenv');
dotenv.config({ path: './.env' });

const { enviarCorreoVerificacion } = require('./helpers/mailLibs');

const destinatario = "mc_vm@hotmail.com";

if (!destinatario) {
    console.log('Uso: node testMail.js tucorreo@ejemplo.com');
    process.exit(1);
}

console.log('Enviando correo de prueba a:', destinatario);
console.log('Usando MAIL_USER:', "vargasmorenom@gmail.com" || '(no definido)');

enviarCorreoVerificacion(destinatario, 'UsuarioPrueba', 'token-test-123')
    .then(() => console.log('Proceso completado'))
    .catch((err) => console.error('Error:', err));
