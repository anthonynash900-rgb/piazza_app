const express = require('express');
const router = express.Router();

const Post = require('../schemas/Post');
const verifyToken = require('../verifyToken')

const User = require('../schemas/User');

//Post
router.post('/', verifyToken, async (req, res) => {
    const authorID = req.user._id;
    try {
        //Get username
        const user = await User.findById(authorID, 'username');
        if (!user) {
            return res.status(404).send({ message: 'User not found' });
        }
        const authorName = user.username; 
        let expirationDate;
        if (req.body.expirationMinutes) {
            expirationDate = new Date(Date.now() + req.body.expirationMinutes * 60000);
        } else {
            expirationDate = req.body.expiresAt || undefined; 
        }
        const postData = new Post({
            title: req.body.title,
            topic: req.body.topic,
            messageBody: req.body.messageBody,
            author: authorID, 
            authorName: authorName,
            expiresAt: expirationDate,
            status: 'Live',
            likes: [],
            dislikes: [],
            totalInteractions: 0,
            comments: []
        });
        const savedPost = await postData.save();
        res.status(201).send(savedPost);

    } catch (err) {
        res.status(400).send({ message: 'Error creating post', details: err.message });
    }
});

//Get everything (filter)
router.get('/', verifyToken, async (req, res) => {
    try {
        const { topic, status } = req.query;
        const filter = {};
        if (topic) {
            filter.topic = topic;
        }
        if (status) {
            filter.status = status;
        } else {
            filter.status = 'Live';
        }
        const getPosts = await Post.find(filter)
            .populate('author', 'username email')
            .sort({ createdAt: -1 });
        if (getPosts.length === 0) {
            return res.status(404).send({ message: 'No posts found matching the criteria.' });
        }
        res.send(getPosts);
    } catch (err) {
        res.status(500).send({ message: 'Error fetching posts.', details: err.message });
    }
});

//Get Most Active Post in 'Politics'
router.get('/mostInt/Politics', verifyToken, async (req, res) => {
    try {
        const pipeline = [
            //Match by Live status AND the fixed topic 'Politics'
            { $match: { status: 'Live', topic: 'Politics' } }, 
            //Sort using the pre-calculated field
            { $sort: { totalInteractions: -1 } },
            //Take only the single top post
            { $limit: 1 }
        ];
        const mostActivePost = await Post.aggregate(pipeline); 
        if (mostActivePost.length === 0) {
            return res.status(404).send({ message: 'No active posts found for topic "Politics".' });
        }
        return res.send(mostActivePost[0]);
    } catch (err) {
        return res.status(500).send({ message: 'Error fetching most active Politics post.', details: err.message });
    }
});

//Get Most Active Post in 'Health'
router.get('/mostInt/Health', verifyToken, async (req, res) => {
    try {
        const pipeline = [
            { $match: { status: 'Live', topic: 'Health' } }, 
            { $sort: { totalInteractions: -1 } },
            { $limit: 1 }
        ];
        
        const mostActivePost = await Post.aggregate(pipeline); 

        if (mostActivePost.length === 0) {
            return res.status(404).send({ message: 'No active posts found for topic "Health".' });
        }
        return res.send(mostActivePost[0]);
    } catch (err) {
        return res.status(500).send({ message: 'Error fetching most active Health post.', details: err.message });
    }
});

//Get Most Active Post in 'Sport'
router.get('/mostInt/Sport', verifyToken, async (req, res) => {
    try {
        const pipeline = [
            { $match: { status: 'Live', topic: 'Sport' } }, 
            { $sort: { totalInteractions: -1 } },
            { $limit: 1 }
        ];
        
        const mostActivePost = await Post.aggregate(pipeline); 

        if (mostActivePost.length === 0) {
            return res.status(404).send({ message: 'No active posts found for topic "Sport".' });
        }
        return res.send(mostActivePost[0]);
    } catch (err) {
        return res.status(500).send({ message: 'Error fetching most active Sport post.', details: err.message });
    }
});

//Get Most Active Post in 'Tech'
router.get('/mostInt/Tech', verifyToken, async (req, res) => {
    try {
        const pipeline = [
            { $match: { status: 'Live', topic: 'Tech' } }, 
            { $sort: { totalInteractions: -1 } },
            { $limit: 1 }
        ];
        const mostActivePost = await Post.aggregate(pipeline); 
        if (mostActivePost.length === 0) {
            return res.status(404).send({ message: 'No active posts found for topic "Tech".' });
        }
        return res.send(mostActivePost[0]);
    } catch (err) {
        return res.status(500).send({ message: 'Error fetching most active Tech post.', details: err.message });
    }
});


//Get single post
router.get('/:postId', verifyToken, async(req,res)=>{
    try{
        const getPostById = await Post.findById(req.params.postId)
//            .populate('author', 'username email'); //added
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