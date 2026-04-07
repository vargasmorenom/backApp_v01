const { Schema, model } = require('mongoose');

const likesProfileSchema = new Schema({
    idProfile: {
        type: Schema.Types.ObjectId,
        ref: 'Profile',
        required: true,
    },
    likisbyuser: {
        type: Schema.Types.ObjectId,
        ref: 'Profile',
        required: true,
    },
}, { timestamps: true });

likesProfileSchema.index({ idProfile: 1, likisbyuser: 1 }, { unique: true });

module.exports = model('likesProfile', likesProfileSchema);
