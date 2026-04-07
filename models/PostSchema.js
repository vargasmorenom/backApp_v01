const { Schema, model } = require('mongoose');

const PostSchema = new Schema({
    name: {
        type: String,
        trim: true,
    },
    description: {
        type: String,
        trim: true,
    },
    typePost: {
        type: Number,
    },
    typePostName: {
        type: String,
        required: true,
        trim: true,
    },
    nameContent: {
        type: String,
        trim: true,
    },
    imagen: [{
        small:  String,
        medium: String,
        large:  String,
    }],
    access: {
        type: Number,
        default: 0,
    },
    chanelName: {
        type: String,
        required: true,
        trim: true,
    },
    content: [Schema.Types.Mixed],
    contentVal: [{ type: String }],
    profilepic: {
        type: String,
        trim: true,
    },
    tags: [{
        _id: false,
        id: {
            type: Schema.Types.ObjectId,
            ref: 'TagsPost',
        },
        name: String,
    }],
    profileId: {
        type: Schema.Types.ObjectId,
        ref: 'Profile',
    },
    postedBy: {
        type: Schema.Types.ObjectId,
        ref: 'User',
    },
    likeNumber: {
        type: Number,
        default: 0,
    },
    forKIds: {
        type: Boolean,
        default: false,
    },
    pinned: {
        type: Boolean,
        default: false,
    },
}, { timestamps: true });

PostSchema.index({ name: 'text', description: 'text' }, { weights: { name: 10, description: 5 } });
PostSchema.index({ postedBy: 1 });
PostSchema.index({ profileId: 1 });
PostSchema.index({ createdAt: -1 });

module.exports = model('Post', PostSchema);
