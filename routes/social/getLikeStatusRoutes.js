const express = require('express');
const LikeRecord = require('../../models/LikesPostSchema');
const Post = require('../../models/PostSchema');

const router = express.Router();

// GET /api/v1/likes?idPost=...&idUser=...
router.get("/", async (req, res) => {
    const { idPost, idUser } = req.query;

    if (!idPost) {
        return res.status(400).json({ error: "idPost es requerido" });
    }

    try {
        const post = await Post.findById(idPost, 'likeNumber');
        if (!post) {
            return res.status(404).json({ error: "Post no encontrado" });
        }

        let liked = false;
        if (idUser) {
            const record = await LikeRecord.findOne({ postId: idPost, userId: idUser });
            liked = !!record;
        }

        return res.json({
            likeNumber: post.likeNumber ?? 0,
            liked
        });

    } catch (error) {
        console.error("Error consultando likes:", error);
        return res.status(500).json({ error: "Error interno del servidor" });
    }
});

module.exports = router;
