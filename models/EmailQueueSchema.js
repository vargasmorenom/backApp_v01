const { Schema, model } = require('mongoose');

const EmailQueueSchema = new Schema({
    to: {
        type: String,
        required: true,
    },
    subject: {
        type: String,
        required: true,
    },
    html: {
        type: String,
        default: null,
    },
    templateId: {
        type: String,
        default: null,
    },
    variables: {
        type: Schema.Types.Mixed,
        default: null,
    },
    status: {
        type: String,
        enum: ['pending', 'sent', 'failed'],
        default: 'pending',
    },
    attempts: {
        type: Number,
        default: 0,
    },
    lastError: {
        type: String,
        default: null,
    },
    sentAt: {
        type: Date,
        default: null,
    },
}, { timestamps: true });

EmailQueueSchema.index({ status: 1, createdAt: 1 });

module.exports = model('EmailQueue', EmailQueueSchema);
