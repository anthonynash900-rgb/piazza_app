const express = require('express');
const router = express.Router();

const Post = require('../schemas/Post');
const User = require('../schemas/User');
const verifyToken = require('../verifyToken');

router.patch('/like/:postId', verifyToken, async (req, res) => {
    const postId = req.params.postId;
    const authorId = req.user._id;

    try {
        // --- 1. Fetch Post ---
        const post = await Post.findById(postId);
        if (!post) {
            return res.status(404).send({ message: 'Post not found.' });
        }
        // 2. Security Check: Self-Interaction
        if (post.author.equals(authorId)) {
            return res.status(403).send({ message: 'You cannot like your own post.' });
        }
        // --- 2. IMPROVED SECURITY CHECK (Status + Real-time Clock) ---
        const currentTime = new Date();
        // This blocks if the status is already 'Expired' OR if the clock has passed the deadline
        if (post.status === 'Expired' || post.expiresAt < currentTime) {
            
            // Sync database status if it's currently 'Live' but time is up
            if (post.status === 'Live') {
                await Post.updateOne({ _id: postId }, { $set: { status: 'Expired' } });
            }

            // IMPORTANT: Use 'return' to stop the function here
            return res.status(403).send({ message: 'Cannot like or interact with an expired post.' });
        }
        
        // --- 3. Get Author and check current state ---
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

        // --- 4. Logic for Interaction Arrays and Counters ---
        const { updateOperation, responseMessage, totalChange } = (() => {
            if (alreadyLiked) {
                // Scenario: UNLIKE
                return { 
                    updateOperation: { $pull: { likes: { authorId: authorId } } },
                    responseMessage: 'Post unliked.',
                    totalChange: -1 
                };
            } else {
                // Scenario: LIKE (removes dislike if it exists)
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
        
        // --- 5. Atomic Database Update ---
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

        // --- 6. Send Single Final Response ---
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
        // 1. Fetch Post
        const post = await Post.findById(postId);
        if (!post) {
            return res.status(404).send({ message: 'Post not found.' });
        }

        // 2. THE SECURITY CHECK (Combined Status + Time)
        const currentTime = new Date();
        if (post.status === 'Expired' || post.expiresAt < currentTime) {
            // Update DB status if it hasn't been flipped yet
            if (post.status === 'Live') {
                await Post.updateOne({ _id: postId }, { $set: { status: 'Expired' } });
            }
            // IMPORTANT: Use 'return' so the code below NEVER runs
            return res.status(403).send({ message: 'Cannot dislike or interact with an expired post.' });
        }
        // 2. Security Check: Self-Interaction
        if (post.author.equals(authorId)) {
            return res.status(403).send({ message: 'You cannot like your own post.' });
        }
        // 3. Fetch Author
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
        
        // 5. Update Database
        const newTotalInteractions = post.totalInteractions + totalChange; 
        const result = await Post.findByIdAndUpdate(
            postId,
            { ...updateOperation, $set: { totalInteractions: newTotalInteractions } },
            { new: true }
        );

        // 6. Final Response (Only one response will ever be reached now)
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
        // Only send if headers haven't been sent already
        if (!res.headersSent) {
            res.status(500).send({ message: 'Internal server error.', details: err.message });
        }
    }
});


//comment Post
router.post('/comment/:postId', verifyToken, async (req, res) => {
    const postId = req.params.postId;
    
    // --- Data Capture ---
    const authorId = req.user._id; 
    const message = req.body.message; 

    if (!message) {
        return res.status(400).send({ message: "Comment message is required." });
    }

    try {
        // 1. Fetch the actual username from the User collection
        const author = await User.findById(authorId, 'username');
        if (!author || !author.username) {
             return res.status(404).send({ message: 'Author username not found.' });
        }
        const authorName = author.username;
        const comment = {
            authorId: authorId,
            authorName: authorName,
            message: message, 
        };
        const result = await Post.findByIdAndUpdate(
            postId,
            { 
            $push: { comments: comment } 
            },
            { new: true }
        );
        if (!result) {
            return res.status(404).send({ message: 'Post not found.' });
        }
        res.send({ 
            message: 'Comment added .',
            newComment: comment,
            totalComments: result.comments.length
        });
    } catch (err) {
        res.status(400).send({ message: err.message });
    }
});

module.exports = router;