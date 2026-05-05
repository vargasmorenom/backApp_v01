const { Schema, model } = require('mongoose');

const profileSchema = new Schema({
    firstName: {
        type: String,
        trim: true,
    },
    lastName: {
        type: String,
        trim: true,
    },
    email: {
        type: String,
        trim: true,
        lowercase: true,
    },
    location: {
        type: String,
        trim: true,
    },
    phoneNumber: {
        type: String,
        trim: true,
    },
    chanelName: {
        type: String,
        required: true,
        trim: true,
    },
    description: {
        type: String,
        trim: true,
        default: '',
    },
    links: [{ type: String, trim: true }],
    socialMedia: [{
        t: String,
        r: String,
    }],
    instantMessages: [{
        t: String,
        r: String,
    }],
    profilePic: {
        small:  String,
        medium: String,
        large:  String,
        xlarge: String,
    },
    userBy: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        unique: true,
    },
}, { timestamps: true });

profileSchema.index({ userBy: 1 },    { unique: true });
profileSchema.index({ chanelName: 1 });

module.exports = model('Profile', profileSchema);
