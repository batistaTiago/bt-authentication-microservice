module.exports = {
    email: {
        type: String,
        required: true,
        unique: true,
    },
    password: {
        type: String,
        required: true,
        minlength: 6,
        maxlength: 64,
        hideJSON: true
    },
    name: {
        type: String,
        required: true,
    },
    subscribed_to_newsletter: {
        type: Boolean,
        default: true
    },
    date_of_birth: { type: Date },
    document_type: { type: String },
    document_code: { type: String }
}