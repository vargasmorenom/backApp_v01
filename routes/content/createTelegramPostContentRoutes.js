const express = require('express');
const Post = require('../../models/PostSchema');

const router = express.Router();

function extractTelegramInfo(url) {
    // Acepta: https://t.me/canal/123 o https://telegram.me/canal/123
    const telegramRegex = /^(https?:\/\/)?(www\.)?(t\.me|telegram\.me)\/([a-zA-Z0-9_]+)\/(\d+)\/?(\?.*)?$/;
    const match = url.match(telegramRegex);

    if (!match) {
        return { isValid: false, id: null };
    }

    const channel = match[4];
    const postNumber = match[5];

    return {
        isValid: true,
        id: `${channel}/${postNumber}`,
        channel,
        postNumber,
        fullUrl: url,
        cleanUrl: `https://t.me/${channel}/${postNumber}`,
        platform: 'telegram'
    };
}

router.put("/", async (req, res) => {
    try {
        const { postId, url, typePost, titulo } = req.body;

        if (!postId || !url || !typePost) {
            return res.status(400).json({ message: "Datos incompletos" });
        }

        const telegramRegex = /^(https?:\/\/)?(www\.)?(t\.me|telegram\.me)\/([a-zA-Z0-9_]+)\/(\d+)\/?(\?.*)?$/;
        if (!telegramRegex.test(url)) {
            return res.status(201).json({ message: "El contenido no corresponde a un post de Telegram" });
        }

        const consultaPost = await Post.findById(postId);
        if (!consultaPost) {
            return res.status(404).json({ message: "Post no encontrado" });
        }

        const telegramInfo = extractTelegramInfo(url);

        const existe = consultaPost?.content?.some(item => item?.id === telegramInfo.id) || false;
        if (existe) {
            return res.status(201).json({ message: "El post ya contiene este contenido" });
        }

        telegramInfo.titulo = titulo || null;

        const updatedPost = await Post.findByIdAndUpdate(
            postId,
            { $push: { content: telegramInfo } },
            { new: true }
        );

        if (!updatedPost) {
            return res.status(404).json({ message: "Post no actualizado" });
        }

        return res.status(200).json({ message: "Contenido de Telegram agregado correctamente" });

    } catch (error) {
        console.error("Error al agregar contenido de Telegram:", error);
        return res.status(500).json({ message: "Error interno del servidor" });
    }
});

module.exports = router;
