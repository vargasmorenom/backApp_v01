const express = require('express');
const profile = require('../../models/ProfileSchema');
const followers = require('../../models/followersSchema');
const followed = require('../../models/followedSchema');
const sseManager = require('../../libs/sse/sseManager');
const router = express.Router();

router.post("/", async (req, res) => {
    const { idprofile, followerid } = req.body;

    if (!idprofile || !followerid) {
        return res.status(400).json({ error: "idprofile y followerid son requeridos" });
    }

    if (idprofile === followerid) {
        return res.status(400).json({ error: "Un perfil no puede seguirse a sí mismo" });
    }

    try {
        const profileexist = await profile.findById(idprofile);
        if (!profileexist) {
            return res.status(404).json({ error: "Perfil no encontrado" });
        }

        const existingFollow = await followers.findOne({ idprofile, followedby: followerid });

        let action;

        if (existingFollow) {
            // Unfollow: eliminar en ambas colecciones
            await followers.deleteOne({ idprofile, followedby: followerid });
            await followed.deleteOne({ idprofile: followerid, following: idprofile });
            action = 'unfollow';
        } else {
            // Follow: crear en ambas colecciones
            await followers.create({ idprofile, followedby: followerid });
            await followed.create({ idprofile: followerid, following: idprofile });
            action = 'follow';
        }

        const countFollowers = await followers.countDocuments({ idprofile });
        const countFollowing = await followed.countDocuments({ idprofile: followerid });

        const followPayload   = { idprofile, followerid, countFollowers, action };
        const followerPayload = { idprofile, followerid, countFollowing, action };

        const io = req.app.get('socketio');
        if (io) {
            io.to(`user:${idprofile}`).emit('follow:updated',   followPayload);
            io.to(`user:${followerid}`).emit('follower:updated', followerPayload);
        }

        // SSE fallback
        sseManager.send(idprofile,  'follow:updated',   followPayload);
        sseManager.send(followerid, 'follower:updated', followerPayload);

        return res.json({ action, countFollowers, countFollowing });

    } catch (error) {
        console.error("Error en follow/unfollow:", error);
        return res.status(500).json({ error: "Error interno del servidor" });
    }
});

module.exports = router;
