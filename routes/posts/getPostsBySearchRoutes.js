const express = require('express');
const Post = require('../../models/PostSchema');

const router = express.Router();

router.get("/", async (req, res) => {

    try {
        let page = parseInt(req.query.page) || 1;
        let limit = parseInt(req.query.limit) || 10;
        const searchTerm = req.query.q; // 'q' es el estándar común para query de búsqueda

        if (!searchTerm) {
            return res.status(400).json({ message: "El término de búsqueda (q) es obligatorio" });
        }

        // Validación de paginación
        if (page < 1) page = 1;
        if (limit < 1) limit = 10;
        if (limit > 50) limit = 50;

        const skip = (page - 1) * limit;

        // Búsqueda de texto completo
        // Se proyecta 'score' para ordenar por relevancia
        const items = await Post.find(
                { $text: { $search: searchTerm } },
                { score: { $meta: "textScore" } } 
            )
            .populate('profileId', 'chanelName profilePic')
            .sort({ score: { $meta: "textScore" } }) // Ordenar por mejor coincidencia
            .skip(skip)
            .limit(limit)
            .exec();

        return res.status(200).json(items);

    } catch (error) {
        console.error("Error en búsqueda de posts:", error);
        return res.status(500).json({ message: "Error interno del servidor" });
    }
});

module.exports = router;