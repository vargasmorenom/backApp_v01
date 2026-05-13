const express = require('express');
const followers = require('../../models/followersSchema');
const router = express.Router();

// GET /api/v1/getfollowerslist?profileid=<id>
// Retorna la lista de perfiles que siguen a profileid
router.get("/", async (req, res) => {
    const { profileid } = req.query;

    if (!profileid) {
        return res.status(400).json({ error: "profileid es requerido" });
    }

    try {
        const list = await followers
            .find({ idprofile: profileid })
            .populate('followedby', 'chanelName profilePic description userBy')
            .sort({ createdAt: -1 });

        const profiles = list.map(f => f.followedby).filter(Boolean);
        return res.json(profiles);

    } catch (error) {
        console.error("Error al obtener lista de seguidores:", error);
        return res.status(500).json({ error: "Error interno del servidor" });
    }
});

module.exports = router;
