const express = require('express');
const profile = require('../../models/ProfileSchema');
const likeProfile = require('../../models/LikesProfileSchema');
const validaToken = require('../../middlewares/validaToken');
const esUsuarioSesion = require('../../helpers/esUsuarioSesion');
const router = express.Router();

router.get("/", async (req, res) => {
    const { idprofile, idprofileLike } = req.query;

    if (!idprofile || !idprofileLike) {
        return res.status(400).json({ error: "idprofile e idprofileLike son requeridos" });
    }

    try {
        const existingLike = await likeProfile.findOne({ idProfile: idprofile, likisbyuser: idprofileLike });
        const countlikes = await likeProfile.countDocuments({ idProfile: idprofile });
        return res.json({ countlikes, liked: !!existingLike });
    } catch (error) {
        console.error("Error al obtener estado de like:", error);
        return res.status(500).json({ error: "Error interno del servidor" });
    }
});

// El router se monta en el bloque público por el GET; el POST exige sesión aquí
router.post("/", validaToken, async (req, res) => {
    
    const { idprofile, idprofileLike} = req.body;

    // Solo se puede dar like a nombre del usuario de la sesión
    if (idprofileLike && !esUsuarioSesion(req, idprofileLike)) {
        return res.status(403).json({ error: "No autorizado" });
    }

    if (!idprofile || !idprofileLike) {
        return res.status(400).json({ error: "idprofile e idprofileLike son requeridos" });
    }


    try {
        const profileexist = await profile.findById(idprofile);
        if (!profileexist) {
            return res.status(404).json({ error: "Perfil no encontrado" });
        }

        // Verificar si ya dio like (consulta por índice, O(1))
        const existingLike = await likeProfile.findOne({ idProfile: idprofile, likisbyuser: idprofileLike });

        let action;

        if (existingLike) {
            // Unlike: eliminar registro
            await likeProfile.deleteOne({ idProfile: idprofile, likisbyuser: idprofileLike });
            action = 'unlike';
        } else {
            // Like: crear registro
            await likeProfile.create({ idProfile: idprofile, likisbyuser: idprofileLike });
            action = 'like';
        }

        const countlikes = await likeProfile.countDocuments({ idProfile: idprofile });

        // Emitir evento socket
        const io = req.app.get('socketio');
        if (io) {
            io.emit('like:updated', {
                idprofile: idprofile,
                countlikes: countlikes,
                action: action
            });
        }

        return res.json({
            countlikes: countlikes,
            action: action
        });

    } catch (error) {
        console.error("Error en like/unlike:", error);
        return res.status(500).json({ error: "Error interno del servidor" });
    }
});

module.exports = router;
