const express = require('express');
const router = express.Router();
const SharedLink = require('../../models/SharedLinkSchema');
const Post = require('../../models/PostSchema');

// GET /api/v1/shared/:token — devuelve el post si el token es válido
router.get('/:token', async (req, res) => {
    try {
        const link = await SharedLink.findOne({ token: req.params.token, enabled: true }).lean();

        if (!link) {
            return res.status(404).json({ message: 'Enlace no válido o revocado' });
        }

        const post = await Post.findById(link.postId)
            .populate('profileId', 'chanelName profilePic')
            .lean();

        if (!post) {
            return res.status(404).json({ message: 'Contenido no encontrado' });
        }

        return res.status(200).json(post);

    } catch (err) {
        console.error('[getSharedContent]', err.message);
        return res.status(500).json({ message: 'Error interno del servidor' });
    }
});

module.exports = router;
