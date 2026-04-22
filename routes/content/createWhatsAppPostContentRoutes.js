const express = require('express');
const { Types } = require('mongoose');
const Post = require('../../models/PostSchema');

const router = express.Router();

router.put('/', async (req, res) => {
    try {
        const { postId, titulo, imagen, url } = req.body;

        if (!postId || !titulo || !url) {
            return res.status(400).json({ message: 'Datos incompletos: se requiere postId, titulo y url' });
        }

        const consultaPost = await Post.findById(postId);
        if (!consultaPost) {
            return res.status(404).json({ message: 'Post no encontrado' });
        }

        const shareText = imagen
            ? `${titulo}\n${imagen}\n${url}`
            : `${titulo}\n${url}`;

        const shareLink = `https://wa.me/?text=${encodeURIComponent(shareText)}`;

        const dataContent = {
            platform: 'whatsapp',
            shareId: new Types.ObjectId().toString(),
            titulo,
            imagen: imagen || null,
            url,
            shareLink,
        };

        const existe = consultaPost?.content?.some(
            item => item?.platform === 'whatsapp' && item?.url === url
        ) || false;

        if (existe) {
            return res.status(201).json({ message: 'El post ya contiene este contenido de WhatsApp' });
        }

        const updatedPost = await Post.findByIdAndUpdate(
            postId,
            { $push: { content: dataContent } },
            { new: true }
        );

        if (!updatedPost) {
            return res.status(404).json({ message: 'Post no actualizado' });
        }

        return res.status(200).json({
            message: 'Contenido de WhatsApp agregado correctamente',
            shareLink,
        });

    } catch (error) {
        console.error('Error al agregar contenido de WhatsApp:', error);
        return res.status(500).json({ message: 'Error interno del servidor' });
    }
});

module.exports = router;
