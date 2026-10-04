const Post = require('../models/PostSchema');

// Permite continuar solo si la lista (postId en body o query) pertenece al usuario de la sesión
async function validaDuenoPost(req, res, next) {
    // Se revisan ambos orígenes: cada ruta lee el postId de uno distinto
    const postIds = [req.body?.postId, req.query?.postId].filter(id => id !== undefined && id !== null && id !== '');

    // Sin postId la ruta responde con su propio error de datos incompletos
    if (postIds.length === 0) return next();

    if (postIds.some(id => typeof id !== 'string')) {
        return res.status(400).json({ message: 'postId inválido' });
    }

    try {
        for (const postId of postIds) {
            const post = await Post.findById(postId).select('postedBy').lean();
            if (!post) {
                return res.status(404).json({ message: 'Post no encontrado' });
            }
            if (String(post.postedBy) !== String(req.user?._id)) {
                return res.status(403).json({ message: 'No autorizado' });
            }
        }
        return next();
    } catch (error) {
        if (error.name === 'CastError') {
            return res.status(400).json({ message: 'postId inválido' });
        }
        console.error('[validaDuenoPost]', error.message);
        return res.status(500).json({ message: 'Error interno del servidor' });
    }
}

module.exports = validaDuenoPost;
