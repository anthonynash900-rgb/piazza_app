const express = require('express');
const router = express.Router();

const Post = require('../schemas/Post');

//Post
router.post('/', async(req,res)=>{
    //console.log(req.body)

    const postData = new Post({
        title:req.body.title,
        topic:req.body.topic,
        messageBody:req.body.messageBody,
        createdAt:req.body.createdAt,
        expiresAt:req.body.expiresAt,
        status:req.body.status,
        likes:req.body.likes,
        totalInteractions:req.body.totalInteractions,
        comments:req.body.comments
    })
try{
    const postTosave = await postData.save()
    res.send(postTosave)
}catch(err){
    res.send({message:err})
}
})

//Get everything
router.get('/',async(req,res)=>{
    try{
        const getPosts = await Post.find()
        res.send(getPosts)
    }catch(err){
    res.send({message:err})
    }
})

//Get single post
router.get('/:postId',async(req,res)=>{
    try{
        const getPostById = await Post.findById(req.params.postId)
        res.send(getPostById)
    }catch(err){
    res.send({message:err})
    }
})

//Patch
router.patch('/:postId', async(req,res)=>{
    const postData = new Post({
        title:req.body.title,
        topic:req.body.topic,
        messageBody:req.body.messageBody,
        createdAt:req.body.createdAt,
        expiresAt:req.body.expiresAt,
        status:req.body.status,
        likes:req.body.likes,
        totalInteractions:req.body.totalInteractions,
        comments:req.body.comments
    })
    try{
        const updatePostById = await Post.updateOne(
            {_id:req.params.postId},
            {$set:{
                title:req.body.title,
                topic:req.body.topic,
                messageBody:req.body.messageBody,
                createdAt:req.body.createdAt,
                expiresAt:req.body.expiresAt,
                status:req.body.status,
                likes:req.body.likes,
                totalInteractions:req.body.totalInteractions,
                comments:req.body.comments
                }
            })
        res.send(updatePostById)
    }catch(err){
    res.send({message:err})
    }
})

//delete
router.delete('/:postId',async(req,res)=>{
    try{
        const deletePostById = await Post.deleteOne({_id:req.params.postId})
        res.send(deletePostById)
    }catch(err){
        res.send({message:err})   
    }
})



module.exports = router;