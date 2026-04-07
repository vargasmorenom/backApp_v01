const { Schema, model } = require('mongoose');

const FollowersSchema = new Schema({
    idprofile: {
        type: Schema.Types.ObjectId,
        ref: 'Profile',
        required: true,
    },
    followedby: {
        type: Schema.Types.ObjectId,
        ref: 'Profile',
        required: true,
    },
}, { timestamps: true });

FollowersSchema.index({ idprofile: 1, followedby: 1 }, { unique: true });
FollowersSchema.index({ followedby: 1 });

module.exports = model('followers', FollowersSchema);
