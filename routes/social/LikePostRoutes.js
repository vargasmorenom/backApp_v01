const express = require('express');
const Post = require('../../models/PostSchema');
const User = require('../../models/UserSchema');
const LikeRecord = require('../../models/LikesPostSchema');

const router = express.Router();

router.post("/", async (req, res) => {
    const { idPost, idUser } = req.body;

    if (!idPost || !idUser) {
        return res.status(400).json({ error: "idPost e idUser son requeridos" });
    }


    try {
        const user = await User.findById(idUser);
        if (!user) {
            return res.status(404).json({ error: "Usuario no encontrado" });
        }
       

        const post = await Post.findById(idPost);
        if (!post) {
            return res.status(404).json({ error: "Post no encontrado" });
        }

        // Verificar si ya dio like (consulta por índice, O(1))
        const existingLike = await LikeRecord.findOne({ postId: idPost, userId: idUser });

        let action;
        console.log(existingLike);

        if (existingLike) {
            // Unlike: eliminar registro y decrementar contador
            await LikeRecord.deleteOne({ postId: idPost, userId: idUser });
            await Post.findByIdAndUpdate(idPost, { $inc: { likeNumber: -1 } });
            action = 'unlike';
        } else {
            // Like: crear registro e incrementar contador
            await LikeRecord.create({ postId: idPost, userId: idUser });
            await Post.findByIdAndUpdate(idPost, { $inc: { likeNumber: 1 } });
            action = 'like';
        }

        const updatedPost = await Post.findById(idPost, 'likeNumber');

        // Emitir evento socket
        const io = req.app.get('socketio');
        if (io) {
            io.emit('like:updated', {
                postId: idPost,
                newLikeCount: updatedPost.likeNumber,
                userId: idUser,
                action
            });
        }

        return res.json({
            likeNumber: updatedPost.likeNumber,
            action
        });

    } catch (error) {
        console.error("Error en like/unlike:", error);
        return res.status(500).json({ error: "Error interno del servidor" });
    }
});

module.exports = router;
