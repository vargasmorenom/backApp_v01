const express = require('express');
const Post = require('../../models/PostSchema');
const Profile = require('../../models/ProfileSchema');

const router = express.Router();

router.get("/", async (req, res) => {

    try {
        let page = parseInt(req.query.page) || 1;
        let limit = parseInt(req.query.limit) || 10;
        const searchTerm = req.query.q;

        if (!searchTerm) {
            return res.status(400).json({ message: "El término de búsqueda (q) es obligatorio" });
        }

        if (page < 1) page = 1;
        if (limit < 1) limit = 10;
        if (limit > 50) limit = 50;

        const skip = (page - 1) * limit;

        const regex = new RegExp(searchTerm, 'i');

        const [posts, channels] = await Promise.all([
            Post.find(
                    { $text: { $search: searchTerm } },
                    { score: { $meta: "textScore" } }
                )
                .populate('profileId', 'chanelName profilePic')
                .sort({ score: { $meta: "textScore" } })
                .skip(skip)
                .limit(limit)
                .lean(),
            Profile.find(
                    { $or: [{ chanelName: regex }, { description: regex }] },
                    { chanelName: 1, description: 1, profilePic: 1, userBy: 1 }
                )
                .skip(skip)
                .limit(5)
                .lean(),
        ]);

        const taggedPosts    = posts.map(p => ({ ...p, _type: 'post' }));
        const taggedChannels = channels.map(c => ({ ...c, _type: 'channel' }));

        return res.status(200).json([...taggedChannels, ...taggedPosts]);

    } catch (error) {
        console.error("Error en búsqueda:", error);
        return res.status(500).json({ message: "Error interno del servidor" });
    }
});

module.exports = router;