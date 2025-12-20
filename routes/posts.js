const express = require('express');
const router = express.Router();

const Post = require('../schemas/Post');
const verifyToken = require('../verifyToken')

const User = require('../schemas/User');

//Post
router.post('/', verifyToken, async (req, res) => {
    const authorID = req.user._id;

    let expirationDate;
    if (req.body.expirationMinutes) {
        expirationDate = new Date(Date.now() + req.body.expirationMinutes * 60000);
    } else {
        // Fallback to expiresAt or let the schema default handle it
        expirationDate = req.body.expiresAt || undefined; 
    }

    const postData = new Post({
        title: req.body.title,
        topic: req.body.topic,
        messageBody: req.body.messageBody,
        author: authorID, 
        expiresAt: expirationDate,
        status: 'Live',
        // Interactions usually start at 0/empty for new posts
        likes: [],
        dislikes: [],
        totalInteractions: 0,
        comments: []
    });

    try {
        // 1. Save the post to MongoDB
        const savedPost = await postData.save();

        // 2. Fetch the post again to "Populate" the author name/email
        // We use the ID of the post we just saved
        const populatedPost = await Post.findById(savedPost._id)
            .populate('author', 'username email'); // Only bring back the name and email, not the password

        // 3. Send the populated post back to Postman
        res.status(201).send(populatedPost);

    } catch (err) {
        res.status(400).send({ message: 'Error creating post', details: err.message });
    }
});

//Get everything (with filters)
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

// --- Code for the four endpoints (postRoutes.js) ---

// 1. Get Most Active Post in 'Tech'
// --- Code for the four endpoints (postRoutes.js) ---

// 1. Get Most Active Post in 'Politics'
router.get('/mostInt/Politics', verifyToken, async (req, res) => {
    try {
        const pipeline = [
            // Stage 1: Match by Live status AND the fixed topic 'Politics'
            { $match: { status: 'Live', topic: 'Politics' } }, 
            
            // Stage 2: Sort using the pre-calculated field
            { $sort: { totalInteractions: -1 } },
            
            // Stage 3: Take only the single top post
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

// 2. Get Most Active Post in 'Health'
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

// 3. Get Most Active Post in 'Sport'
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

// 4. Get Most Active Post in 'Tech'
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