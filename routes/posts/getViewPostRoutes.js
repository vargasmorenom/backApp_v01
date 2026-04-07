const express = require('express');
const router = express.Router();
const ViewPost = require('../../models/viewPost');

router.get("/", async (req, res) => {
    try {
        const { idPost, idUser } = req.query;

        if (!idPost) {
            return res.status(400).json({ message: "Falta idPost" });
        }

        const viewRecord = await ViewPost.findOne({ idPost });

        if (!viewRecord) {
            return res.status(200).json({ viewed: false, viewCount: 0 });
        }

        const viewCount = viewRecord.viewUser.length;
        const viewed = idUser
            ? viewRecord.viewUser.some(user => user.equals(idUser))
            : false;

        return res.status(200).json({ viewed, viewCount });

    } catch (error) {
        console.error("Error al obtener vista:", error);
        return res.status(500).json({ message: "Error interno del servidor" });
    }
});

module.exports = router;
