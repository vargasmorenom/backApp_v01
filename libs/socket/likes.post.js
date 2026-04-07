const Post = require('../../models/PostSchema');
const LikeRecord = require('../../models/LikesPostSchema');

function likePost(io, socket) {
     console.log("likespost");

    socket.on('likePost', async (data) => {
        console.log('[likePost] Evento recibido. data:', data, '| user:', socket.data.user?._id);
        try {
            const { idPost } = data;
            const idUser = socket.data.user._id;
            console.log('[likePost] Procesando like para postId:', idPost, 'por userId:', idUser);

            if (!idPost) {
                return socket.emit('like:error', { error: 'idPost es requerido' });
            }

            const post = await Post.findById(idPost);
            if (!post) {
                return socket.emit('like:error', { error: 'Post no encontrado' });
            }

            // Verificar si ya dio like (consulta por índice, O(1))
            const existingLike = await LikeRecord.findOne({ postId: idPost, userId: idUser });

            let action;

            if (existingLike) {
                await LikeRecord.deleteOne({ _id: existingLike._id });
                await Post.findByIdAndUpdate(idPost, { $inc: { likeNumber: -1 } });
                action = 'unlike';
            } else {
                console.log('[likePost] Intentando crear LikeRecord:', { postId: idPost, userId: idUser });
                const created = await LikeRecord.create({ postId: idPost, userId: idUser });
                console.log('[likePost] LikeRecord creado:', created._id, '| colección:', LikeRecord.collection.name);
                await Post.findByIdAndUpdate(idPost, { $inc: { likeNumber: 1 } });
                action = 'like';
            }

            const updatedPost = await Post.findById(idPost, 'likeNumber');

            // Emitir a TODOS los clientes
            io.emit('like:updated', {
                postId: idPost,
                newLikeCount: updatedPost.likeNumber,
                userId: idUser,
                action
            });

        } catch (error) {
            console.error("Error en likePost socket:", error.name, error.message);
            if (error.name === 'CastError') {
                return socket.emit('like:error', { error: 'idPost inválido' });
            }
            if (error.code === 11000) {
                return socket.emit('like:error', { error: 'Like duplicado' });
            }
            socket.emit('like:error', { error: 'Error al procesar like', detail: error.message });
        }
    });
}

module.exports = likePost;
