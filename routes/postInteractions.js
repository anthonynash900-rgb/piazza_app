const express = require('express');
const router = express.Router();

const Post = require('../schemas/Post');
const User = require('../schemas/User');
const verifyToken = require('../verifyToken');

router.patch('/like/:postId', verifyToken, async (req, res) => {
    const postId = req.params.postId;
    const authorId = req.user._id;

    try {
        //Get post
        const post = await Post.findById(postId);
        if (!post) {
            return res.status(404).send({ message: 'Post not found.' });
        }
        //Security Check for self-Interaction
        if (post.author.equals(authorId)) {
            return res.status(403).send({ message: 'You cannot like your own post.' });
        }
        //Expiration check
        const currentTime = new Date();
        // This blocks if the status is already 'Expired' OR if the clock has passed the deadline
        if (post.status === 'Expired' || post.expiresAt < currentTime) {
            // Sync database status if it's currently 'Live' but time is up
            if (post.status === 'Live') {
                await Post.updateOne({ _id: postId }, { $set: { status: 'Expired' } });
            }
            //Use return to stop the function
            return res.status(403).send({ message: 'Cannot like or interact with an expired post.' });
        }
        //Get Author and check current state ---
        const author = await User.findById(authorId, 'username');
        if (!author || !author.username) {
            return res.status(404).send({ message: 'Author username not found.' });
        }
        const authorName = author.username;
        const alreadyLiked = post.likes.some(like => like.authorId.equals(authorId));
        const wasDisliked = post.dislikes.some(dislike => dislike.authorId.equals(authorId));
        const newLike = {
            type: 'like', 
            authorId: authorId,
            authorName: authorName,
            timestamp: new Date()
        };
        //Logic for Interaction Arrays and Counters
        const { updateOperation, responseMessage, totalChange } = (() => {
            if (alreadyLiked) {
                //Unlike
                return { 
                    updateOperation: { $pull: { likes: { authorId: authorId } } },
                    responseMessage: 'Post unliked.',
                    totalChange: -1 
                };
            } else {
                //LIKE (removes dislike if it exists)
                return {
                    updateOperation: {
                        $push: { likes: newLike },
                        $pull: { dislikes: { authorId: authorId } }
                    },
                    responseMessage: 'Post liked.',
                    // If switching from dislike to like, total count doesn't change
                    totalChange: wasDisliked ? 0 : 1 
                };
            }
        })();
        
        //Db update
        const newTotalInteractions = post.totalInteractions + totalChange; 
        const result = await Post.findByIdAndUpdate(
            postId,
            { 
                ...updateOperation, 
                $set: { totalInteractions: newTotalInteractions } 
            },
            { new: true }
        );
        if (!result) {
            return res.status(404).send({ message: 'Update failed.' });
        }
        //Final Response
        res.send({
            message: responseMessage,
            interactionType: alreadyLiked ? 'unlike' : 'like', 
            authorName: authorName, 
            timestamp: new Date(), 
            likesCount: result.likes.length,
            dislikesCount: result.dislikes.length,
            totalInteractions: result.totalInteractions
        });

    } catch (err) {
        console.error('Error during like operation:', err);
        // Only attempt to send an error if a response hasn't been sent yet
        if (!res.headersSent) {
            res.status(500).send({ 
                message: 'Internal server error during like operation.', 
                details: err.message 
            });
        }
    }
});
router.patch('/dislike/:postId', verifyToken, async (req, res) => {
    const postId = req.params.postId;
    const authorId = req.user._id;
    try {
        //Get Post
        const post = await Post.findById(postId);
        if (!post) {
            return res.status(404).send({ message: 'Post not found.' });
        }

        //Expiration check
        const currentTime = new Date();
        if (post.status === 'Expired' || post.expiresAt < currentTime) {
            //Update db status
            if (post.status === 'Live') {
                await Post.updateOne({ _id: postId }, { $set: { status: 'Expired' } });
            }
            //Return message if post expired
            return res.status(403).send({ message: 'Cannot dislike or interact with an expired post.' });
        }
        //Check for self-interaction
        if (post.author.equals(authorId)) {
            return res.status(403).send({ message: 'You cannot like your own post.' });
        }
        // 3.Get Author
        const author = await User.findById(authorId, 'username');
        if (!author || !author.username) {
            return res.status(404).send({ message: 'Author username not found.' });
        }
        const authorName = author.username;
        const alreadyDisliked = post.dislikes.some(dislike => dislike.authorId.equals(authorId));
        const wasLiked = post.likes.some(like => like.authorId.equals(authorId));
        // 4. Interaction Logic
        const newDislike = {
            type: 'dislike', 
            authorId: authorId,
            authorName: authorName,
            timestamp: new Date()
        };
        const { updateOperation, responseMessage, totalChange } = (() => {
            if (alreadyDisliked) {
                return { 
                    updateOperation: { $pull: { dislikes: { authorId: authorId } } },
                    responseMessage: 'Post undisliked.',
                    totalChange: -1 
                };
            } else {
                return {
                    updateOperation: { 
                        $push: { dislikes: newDislike },
                        $pull: { likes: { authorId: authorId } } 
                    },
                    responseMessage: 'Post disliked.',
                    totalChange: wasLiked ? 0 : 1 
                };
            }
        })();
        
        //Update db
        const newTotalInteractions = post.totalInteractions + totalChange; 
        const result = await Post.findByIdAndUpdate(
            postId,
            { ...updateOperation, $set: { totalInteractions: newTotalInteractions } },
            { new: true }
        );
        //Final Response
        res.send({
            message: responseMessage,
            interactionType: alreadyDisliked ? 'undislike' : 'dislike', 
            authorName: authorName, 
            likesCount: result.likes.length,
            dislikesCount: result.dislikes.length,
            totalInteractions: result.totalInteractions 
        });

    } catch (err) {
        console.error('Error during dislike:', err);
        if (!res.headersSent) {
            res.status(500).send({ message: 'Internal server error.', details: err.message });
        }
    }
});

//comment Post
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
        //Save the post
        const savedPost = await postData.save();
        //Return the saved post
        res.status(201).send(savedPost);
    } catch (err) {
        res.status(400).send({ message: 'Error creating post', details: err.message });
    }
});

module.exports = router;