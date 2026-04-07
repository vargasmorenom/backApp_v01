const express = require('express');
const profile = require('../../models/ProfileSchema');
const followers = require('../../models/followersSchema');
const followed = require('../../models/followedSchema');
const router = express.Router();

// GET /api/v1/follow?idprofile=B&followerid=A
// Retorna si A sigue a B y los conteos de seguidores/seguidos
router.get("/", async (req, res) => {
    const { idprofile, followerid } = req.query;

    if (!idprofile || !followerid) {
        return res.status(400).json({ error: "idprofile y followerid son requeridos" });
    }

    try {
        const isFollowing = await followers.findOne({ idprofile, followedby: followerid });
        const countFollowers = await followers.countDocuments({ idprofile });
        const countFollowing = await followed.countDocuments({ idprofile: followerid });
        const countProfileFollowing = await followed.countDocuments({ idprofile });

        return res.json({
            following: !!isFollowing,
            countFollowers,
            countFollowing,
            countProfileFollowing,
        });
    } catch (error) {
        console.error("Error al obtener estado de follow:", error);
        return res.status(500).json({ error: "Error interno del servidor" });
    }
});

module.exports = router;
