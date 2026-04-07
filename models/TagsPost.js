const { Schema, model } = require('mongoose');

const TagsPostSchema = new Schema({
    name: {
        type: String,
        required: true,
        lowercase: true,
        trim: true,
        unique: true,
    },
    slug: {
        type: String,
        unique: true,
        trim: true,
    },
    count: {
        type: Number,
        default: 0,
    },
}, { timestamps: true });

TagsPostSchema.index({ name: 1 },  { unique: true });
TagsPostSchema.index({ slug: 1 },  { unique: true });
TagsPostSchema.index({ count: -1 });

module.exports = model('TagsPost', TagsPostSchema);
