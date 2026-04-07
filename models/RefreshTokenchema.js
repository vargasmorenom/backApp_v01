const { Schema, model } = require('mongoose');

const RefreshTokenSchema = new Schema({
    user: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
    token: {
        type: String,
        required: true,
    },
    codeInterno: {
        type: String,
        required: true,
    },
    state: {
        type: Boolean,
        required: true,
        default: true,
    },
    expiresAt: {
        type: Date,
        required: true,
    },
}, { timestamps: true });

// Un solo refresh token activo por usuario
RefreshTokenSchema.index({ user: 1 },        { unique: true });
RefreshTokenSchema.index({ codeInterno: 1 });
// TTL: MongoDB elimina automáticamente el documento cuando expira
RefreshTokenSchema.index({ expiresAt: 1 },   { expireAfterSeconds: 0 });

module.exports = model('RefreshToken', RefreshTokenSchema);
