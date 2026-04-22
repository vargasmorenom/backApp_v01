const { Schema, model } = require('mongoose');
const { randomBytes } = require('crypto');

const SharedLinkSchema = new Schema({
    token: {
        type: String,
        required: true,
        unique: true,
        default: () => randomBytes(24).toString('hex'),
    },
    postId: {
        type: Schema.Types.ObjectId,
        ref: 'Post',
        required: true,
    },
    createdBy: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
    enabled: {
        type: Boolean,
        default: true,
    },
}, { timestamps: true });

SharedLinkSchema.index({ token: 1 });
SharedLinkSchema.index({ postId: 1, createdBy: 1 });

module.exports = model('SharedLink', SharedLinkSchema);
