const mongoose = require('mongoose');

function calculateExpirationDate() {
    const oneWeekInMs = 7 * 24 * 60 * 60 * 1000;
    return new Date(Date.now() + oneWeekInMs);
}

const postSchema = mongoose.Schema({
    "title":{
        type:String,
        required:true
    },
    "author": {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    "authorName": { type: String,
        required: true },
    "topic":{
        type:String,
        required:true,
        enum: ['Politics', 'Health', 'Sport', 'Tech']
    },
    "messageBody":{
        type:String,
        required:true
    },
    "author":{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User', // This needs to match the name used in mongoose.model('User', userSchema)
        required:true
    },
    "createdAt":{
        type:Date,
        default: Date.now
    },
    "expiresAt":{
        type:Date,
        default: calculateExpirationDate
    },
    "status":{
        type: String, 
        required: true,
        enum: ['Live', 'Expired']
    },
    likes: [{
        authorId: { 
            type: mongoose.Schema.Types.ObjectId, 
            ref: 'User', 
            required: true 
        },
        authorName: { 
            type: String, 
            required: true 
        },
        timestamp: { 
            type: Date, 
            default: Date.now 
        }
    }],
    dislikes: [{
        authorId: { 
            type: mongoose.Schema.Types.ObjectId, 
            ref: 'User', 
            required: true 
        },
        authorName: { 
            type: String, 
            required: true 
        },
        timestamp: { 
            type: Date, 
            default: Date.now 
        }
    }],
    "totalInteractions":{
        type:Number,
        default:0
    },
    "comments": [
        {
            "authorId": {
                type: mongoose.Schema.Types.ObjectId,
                ref: 'User',
                required: true
            },
            "authorName": {
                type: String,
                required: true
            },
            "message": {
                type: String,
                required: true
            },
            "timestamp": {
                type: Date,
                default: Date.now
            },
            "interactionType": {
                type: String,
                default: "comment"
            }
        }
    ]
})



module.exports = mongoose.model('posts', postSchema); //mongodb db collection = 'posts'