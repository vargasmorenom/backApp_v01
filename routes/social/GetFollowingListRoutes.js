const express = require('express');
const followed = require('../../models/followedSchema');
const router = express.Router();

router.get("/", async (req, res) => {
    const { profileid } = req.query;

    if (!profileid) {
        return res.status(400).json({ error: "profileid es requerido" });
    }

    try {
        const list = await followed
            .find({ idprofile: profileid })
            .populate('following', 'chanelName profilePic description')
            .sort({ createdAt: -1 });

        const profiles = list.map(f => f.following).filter(Boolean);
        return res.json(profiles);

    } catch (error) {
        console.error("Error al obtener lista de siguiendo:", error);
        return res.status(500).json({ error: "Error interno del servidor" });
    }
});

module.exports = router;
