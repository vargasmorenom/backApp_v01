const express = require('express');
const jwt = require('jsonwebtoken');
const decompressBase64 = require('../../helpers/decompressBase64');
const sseManager = require('../../libs/sse/sseManager');

const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET;

function parseCookies(cookieHeader = '') {
    const cookies = {};
    cookieHeader.split(';').forEach(cookie => {
        const [key, ...val] = cookie.trim().split('=');
        if (key) cookies[key.trim()] = decodeURIComponent(val.join('='));
    });
    return cookies;
}

async function resolveUser(req) {
    try {
        // 1. Cookie (flujo normal)
        const cookies = parseCookies(req.headers.cookie);
        if (cookies.AuthToken) {
            const sessionData = await decompressBase64(cookies.AuthToken);
            return jwt.verify(sessionData.token, JWT_SECRET);
        }
        // 2. Authorization header
        const authHeader = req.headers.authorization;
        if (authHeader?.startsWith('Bearer ')) {
            return jwt.verify(authHeader.slice(7), JWT_SECRET);
        }
        // 3. Query param — fallback Chrome mobile
        if (req.query.token) {
            return jwt.verify(req.query.token, JWT_SECRET);
        }
    } catch (_) {}
    return null;
}

router.get('/', async (req, res) => {
    const user = await resolveUser(req);
    const userId = user?._id?.toString() ?? null;

    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.setHeader('X-Accel-Buffering', 'no'); // desactiva buffer de nginx
    res.flushHeaders();

    res.write(`event: connected\ndata: ${JSON.stringify({ status: 'ok', authenticated: !!userId })}\n\n`);

    sseManager.add(userId, res);

    const heartbeat = setInterval(() => {
        try { res.write(':\n\n'); } catch (_) { clearInterval(heartbeat); }
    }, 30000);

    req.on('close', () => {
        clearInterval(heartbeat);
        sseManager.remove(userId, res);
    });
});

module.exports = router;
