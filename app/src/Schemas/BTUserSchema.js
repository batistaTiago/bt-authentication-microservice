module.exports = {
    name: {
        type: String,
        required: true,
    },
    email: {
        type: String,
        required: true,
        unique: true,
    },
    subscribed_to_newsletter: {
        type: Boolean,
        default: true
    },
    account_active: {
        type: Boolean,
        default: true
    },
    date_of_birth: { type: Date },
    document_type: { type: String },
    document_code: { type: String }
}