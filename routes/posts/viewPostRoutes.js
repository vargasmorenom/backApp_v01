// /home/mcvm/Documentos/node/listas-node-js/routes/libs/viewPostRoutes.js

const express = require('express');
const router = express.Router();
const ViewPost = require('../../models/viewPost');
const Post = require('../../models/PostSchema');

router.put("/", async (req, res) => {
    try {
        const { idPost, idUser } = req.body;

        if (!idPost || !idUser) {
            return res.status(400).json({ message: "Faltan datos: idPost o idUser" });
        }

        const postExists = await Post.findById(idPost);

        if (!postExists) {
            return res.status(404).json({ message: "Post no encontrado" });
        }

        let viewRecord = await ViewPost.findOne({ idPost: idPost });

        if (!viewRecord) {

            viewRecord = await ViewPost.create({
                idPost: idPost,
                viewCount: 1,
                viewUser: [idUser]
            });
        } else {

            const alreadyViewed = viewRecord.viewUser.some(user => user.equals(idUser));

            if (!alreadyViewed) {
                // Si el usuario NO lo ha visto, incrementamos el contador y lo agregamos al array.
                viewRecord = await ViewPost.findOneAndUpdate(
                    { idPost: idPost },
                    {
                        $inc: { viewCount: 1 },
                        $push: { viewUser: idUser }
                    },
                    { new: true }
                );
            }

        }

        return res.status(200).json({
            message: "Vista procesada correctamente",
            viewCount: viewRecord.viewCount
        });

    } catch (error) {
        console.error("Error al registrar vista:", error);
        return res.status(500).json({ message: "Error interno del servidor" });
    }
});

module.exports = router;
