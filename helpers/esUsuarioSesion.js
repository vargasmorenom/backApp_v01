// Indica si el id recibido del cliente es el del usuario de la sesión (req.user lo pone validaToken)
const esUsuarioSesion = (req, id) => {
  return typeof id === 'string' && !!req.user?._id && id === String(req.user._id);
};

module.exports = esUsuarioSesion;
