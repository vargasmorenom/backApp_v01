const express = require('express');
const router = express.Router();
const Post = require('../../models/PostSchema');
const SharedLink = require('../../models/SharedLinkSchema');

// POST /api/v1/share — crea o devuelve el token existente para un post
router.post('/', async (req, res) => {
    try {
        const { postId } = req.body;
        const userId = req.user?._id;

        if (!postId) {
            return res.status(400).json({ message: 'postId es requerido' });
        }

        const post = await Post.findById(postId).lean();
        if (!post) {
            return res.status(404).json({ message: 'Post no encontrado' });
        }

        if (String(post.postedBy) !== String(userId)) {
            return res.status(403).json({ message: 'No tienes permiso para compartir este post' });
        }

        const baseUrl = process.env.API_URL || 'https://api-mylistys-production.up.railway.app';

        const existing = await SharedLink.findOne({ postId, createdBy: userId, enabled: true });
        if (existing) {
            return res.status(200).json({
                token: existing.token,
                shareUrl: `${baseUrl}/share/${existing.token}`,
            });
        }

        const link = await SharedLink.create({ postId, createdBy: userId });
        return res.status(201).json({
            token: link.token,
            shareUrl: `${baseUrl}/share/${link.token}`,
        });

    } catch (err) {
        console.error('[createSharedLink]', err.message);
        return res.status(500).json({ message: 'Error interno del servidor' });
    }
});

// DELETE /api/v1/share/:token — revoca el enlace
router.delete('/:token', async (req, res) => {
    try {
        const userId = req.user?._id;
        const link = await SharedLink.findOne({ token: req.params.token, createdBy: userId });

        if (!link) {
            return res.status(404).json({ message: 'Enlace no encontrado' });
        }

        link.enabled = false;
        await link.save();
        return res.status(200).json({ message: 'Enlace revocado' });

    } catch (err) {
        console.error('[revokeSharedLink]', err.message);
        return res.status(500).json({ message: 'Error interno del servidor' });
    }
});

module.exports = router;
