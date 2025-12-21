
const cron = require('node-cron');
const Post = require('./schemas/Post');

const statusUpdaterJob = cron.schedule('* * * * *', async () => {
    console.log('--- Checking for expired posts (Minute Sync) ---');
    try {
        const currentTime = new Date();
        const result = await Post.updateMany(
            {
                status: 'Live',
                expiresAt: { $lt: currentTime } 
            },
            {
                $set: { status: 'Expired' }
            }
        );
        if (result.modifiedCount > 0) {
            console.log(`Expired ${result.modifiedCount} posts.`);
        }
    } catch (error) {
        console.error('CRON ERROR:', error);
    }
});
module.exports = statusUpdaterJob;