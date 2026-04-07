const { Schema, model } = require('mongoose');

const likeRecordSchema = new Schema({
    postId: {
        type: Schema.Types.ObjectId,
        ref: 'Post',
        required: true,
    },
    userId: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
}, { timestamps: true });

// Un usuario solo puede dar like una vez por post
likeRecordSchema.index({ postId: 1, userId: 1 }, { unique: true });

module.exports = model('LikeRecord', likeRecordSchema);
