const mongoose = require('mongoose');

const postSchema = mongoose.Schema({
    "title":{
        type:String,
        required:true
    },
    "topic":{
        type:[String],
        required:true
    },
    "messageBody":{
        type:String,
        required:true
    },
    "createdAt":{
        type:Date,
        default: Date.now
    },
    "expiresAt":{
        type:Date,
        default: Date.now
    },
    "status":{
        type:String,
        required:true
    },
    "likes":{
        type:Number,
        default:0
    },
    "totalInteractions":{
        type:Number,
        default:0
    },
    "comments":{
        type:String,
        required:true
    }
})

module.exports = mongoose.model('posts', postSchema); //mongodb db collection = 'posts'