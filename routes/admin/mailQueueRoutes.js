const express = require('express');
const EmailQueue = require('../../models/EmailQueueSchema');
const { estadoQueue } = require('../../helpers/mailLibs');

const router = express.Router();

// GET /api/v1/admin/mail-queue — resumen del estado
router.get('/', async (req, res) => {
    try {
        const estado = await estadoQueue();
        return res.json(estado);
    } catch (err) {
        return res.status(500).json({ message: 'Error al obtener estado del queue.' });
    }
});

// GET /api/v1/admin/mail-queue/pending — detalle de pendientes
router.get('/pending', async (req, res) => {
    try {
        const pendientes = await EmailQueue.find({ status: 'pending' })
            .select('to subject attempts createdAt')
            .sort({ createdAt: 1 });
        return res.json(pendientes);
    } catch (err) {
        return res.status(500).json({ message: 'Error al obtener pendientes.' });
    }
});

// GET /api/v1/admin/mail-queue/failed — detalle de fallidos
router.get('/failed', async (req, res) => {
    try {
        const fallidos = await EmailQueue.find({ status: 'failed' })
            .select('to subject attempts lastError createdAt')
            .sort({ createdAt: -1 });
        return res.json(fallidos);
    } catch (err) {
        return res.status(500).json({ message: 'Error al obtener fallidos.' });
    }
});

// POST /api/v1/admin/mail-queue/retry — reintentar todos los fallidos
router.post('/retry', async (req, res) => {
    try {
        const result = await EmailQueue.updateMany(
            { status: 'failed' },
            { $set: { status: 'pending', attempts: 0, lastError: null } }
        );
        return res.json({ message: `${result.modifiedCount} correo(s) marcados para reintento.` });
    } catch (err) {
        return res.status(500).json({ message: 'Error al reintentar fallidos.' });
    }
});

module.exports = router;
