const { Schema, model } = require('mongoose');
const bcrypt = require('bcrypt');

const userSchema = new Schema({
    username: {
        type: String,
        required: true,
        trim: true,
        unique: true,
    },
    phoneNumber: {
        type: String,
        trim: true,
    },
    phoneCountry: {
        type: String,
        trim: true,
    },
    phoneCodCountry: {
        type: String,
        trim: true,
    },
    email: {
        type: String,
        required: true,
        trim: true,
        unique: true,
        lowercase: true,
    },
    password: {
        type: String,
        required: true,
    },
    token: {
        type: String,
        required: true,
    },
    terms: {
        type: Boolean,
        required: true,
    },
    state: {
        type: Boolean,
        required: true,
        default: false,
    },
    resetCode: {
        type: String,
        default: null,
    },
    resetCodeExpiry: {
        type: Date,
        default: null,
    },
}, { timestamps: true });

userSchema.index({ username: 1 }, { unique: true });
userSchema.index({ email: 1 },    { unique: true });

userSchema.methods.encriptedPassword = async (password) => {
    const salt = await bcrypt.genSalt(10);
    return bcrypt.hash(password, salt);
};

userSchema.methods.decriptPassword = function (password) {
    return bcrypt.compare(password, this.password);
};

module.exports = model('User', userSchema);
