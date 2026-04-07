const express = require('express');
const TagsPost = require('../../models/TagsPost');

const router = express.Router();

router.get("/", async (req, res) => {
    try {
        let limit = parseInt(req.query.limit) || 10;

        // Validación de límite para seguridad
        if (limit < 1) limit = 10;
        if (limit > 50) limit = 50;

        // Agrupar tags por nombre, sumar counts y ordenar de mayor a menor
        const trendingTags = await TagsPost.aggregate([
            { $group: { _id: "$name", tagId: { $first: "$_id" }, slug: { $first: "$slug" }, count: { $sum: "$count" } } },
            { $sort: { count: -1 } },
            { $limit: limit },
            { $project: { id: "$tagId", name: "$_id", slug: 1, count: 1, _id: 0 } }
        ]);

        return res.status(200).json(trendingTags);

    } catch (error) {
        console.error("Error obteniendo trending tags:", error);
        return res.status(500).json({ message: "Error interno del servidor" });
    }
});

module.exports = router;