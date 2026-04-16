function validaAdmin(req, res, next) {
    const key = req.headers['x-admin-key'];
    if (!key || key !== process.env.ADMIN_KEY) {
        return res.status(401).json({ message: 'No autorizado.' });
    }
    next();
}

module.exports = validaAdmin;
