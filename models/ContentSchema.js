const { Schema, model } = require('mongoose');

const ContentSchema = new Schema({
    url: [{
        type: String,
        trim: true,
    }],
    numcontents: {
        type: Number,
        default: 0,
    },
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

ContentSchema.index({ postId: 1 });

module.exports = model('content', ContentSchema);
