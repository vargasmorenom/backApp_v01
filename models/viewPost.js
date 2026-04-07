const { Schema, model } = require('mongoose');

const viewPostSchema = new Schema({
    idPost: {
        type: Schema.Types.ObjectId,
        ref: 'Post',
        required: true,
        unique: true,
    },
    viewCount: {
        type: Number,
        required: true,
        default: 0,
    },
    viewUser: [{
        type: Schema.Types.ObjectId,
        ref: 'Profile',
    }],
}, { timestamps: true });

viewPostSchema.index({ idPost: 1 }, { unique: true });

module.exports = model('viewPost', viewPostSchema);
