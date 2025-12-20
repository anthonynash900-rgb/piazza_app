const mongoose = require('mongoose');

const userSchema = mongoose.Schema({
    username: {
        type: String,
        required: true,
        min:3,
        max:256,
    },
    email: {
        type: String,
        required: true,
        min: 3,
        max: 256,
    },
    // The password field will store the HASHED password, NOT the plain text password
    password: { 
        type: String,
        required: true,
        min: 6,
        max:1024,
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
})

module.exports = mongoose.model('User', userSchema);
