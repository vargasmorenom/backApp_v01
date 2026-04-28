const express = require('express');
const router = express.Router();
const SharedLink = require('../../models/SharedLinkSchema');
const Post = require('../../models/PostSchema');

// GET /api/v1/shared/:token — devuelve el post si el token es válido
router.get('/:token', async (req, res) => {
    try {
        const { token } = req.params;
        let post;

        // Token de 48 chars → buscar por SharedLink
        if (token.length === 48) {
            const link = await SharedLink.findOne({ token, enabled: true }).lean();
            if (link) {
                post = await Post.findById(link.postId)
                    .populate('profileId', 'chanelName profilePic')
                    .lean();
            }
        }

        // Fallback: buscar directamente por _id (24 chars ObjectId)
        if (!post) {
            try {
                post = await Post.findById(token)
                    .populate('profileId', 'chanelName profilePic')
                    .lean();
            } catch (_) {}
        }

        if (!post) {
            return res.status(404).json({ message: 'Enlace no válido o revocado' });
        }

        return res.status(200).json(post);

    } catch (err) {
        console.error('[getSharedContent]', err.message);
        return res.status(500).json({ message: 'Error interno del servidor' });
    }
});

module.exports = router;
