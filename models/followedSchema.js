const { Schema, model } = require('mongoose');

const FollowedSchema = new Schema({
    idprofile: {
        type: Schema.Types.ObjectId,
        ref: 'Profile',
        required: true,
    },
    following: {
        type: Schema.Types.ObjectId,
        ref: 'Profile',
        required: true,
    },
}, { timestamps: true });

FollowedSchema.index({ idprofile: 1, following: 1 }, { unique: true });
FollowedSchema.index({ following: 1 });

module.exports = model('followed', FollowedSchema);
