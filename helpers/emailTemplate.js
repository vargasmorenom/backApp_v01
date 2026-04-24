const TIPO_CONFIG = {
    bienvenida:   { headerColor: '#303d5c', badge: null },
    verificacion: { headerColor: '#303d5c', badge: null },
    recuperacion: { headerColor: '#b45309', badge: '⚠️' },
    alerta:       { headerColor: '#991b1b', badge: '🔒' },
};

function emailTemplate({ username, mensaje, codigo, cta_url, cta_texto, tipo = 'bienvenida' }) {
    const { headerColor, badge } = TIPO_CONFIG[tipo] || TIPO_CONFIG.bienvenida;

    return `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8"/>
  <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
</head>
<body style="margin:0;padding:0;background-color:#f3f4f6;font-family:Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#f3f4f6;padding:40px 0;">
    <tr>
      <td align="center">
        <table width="520" cellpadding="0" cellspacing="0" style="background-color:#ffffff;border-radius:10px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,0.08);">

          <tr>
            <td align="center" style="background-color:${headerColor};padding:28px 40px;">
              <img src="https://www.mylistys.com/assets/logo/logoMyllistys.png" alt="MyListys" height="48" style="display:block;"/>
              <p style="margin:10px 0 0;color:#ffffff;font-size:13px;letter-spacing:1px;">mylistys.com</p>
            </td>
          </tr>

          <tr>
            <td style="padding:36px 40px;">
              <h2 style="margin:0 0 12px;color:#111827;font-size:22px;">${badge ? badge + ' ' : ''}Hola, ${username} 👋</h2>
              <p style="margin:0 0 24px;color:#374151;font-size:15px;line-height:1.6;">${mensaje}</p>

              ${codigo ? `
              <div style="text-align:center;margin:24px 0;">
                <span style="display:inline-block;padding:14px 32px;background-color:#f3f4f6;border-radius:8px;font-size:28px;font-weight:bold;letter-spacing:10px;color:#111827;">${codigo}</span>
              </div>` : ''}

              ${cta_url ? `
              <div style="text-align:center;margin:28px 0 8px;">
                <a href="${cta_url}" style="display:inline-block;padding:13px 28px;background-color:${headerColor};color:#ffffff;text-decoration:none;border-radius:6px;font-size:15px;font-weight:bold;">
                  ${cta_texto || 'Ver más'}
                </a>
              </div>` : ''}
            </td>
          </tr>

          <tr>
            <td style="background-color:#f9fafb;padding:20px 40px;border-top:1px solid #e5e7eb;">
              <p style="margin:0;color:#9ca3af;font-size:12px;text-align:center;">
                Si no fuiste tú, ignora este mensaje o contáctanos en
                <a href="mailto:soporte@mylistys.com" style="color:${headerColor};text-decoration:none;">soporte@mylistys.com</a>
              </p>
              <p style="margin:8px 0 0;color:#d1d5db;font-size:11px;text-align:center;">© 2025 MyListys · mylistys.com</p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

module.exports = emailTemplate;
