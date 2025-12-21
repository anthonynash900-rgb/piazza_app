const express = require('express');
const app = express();
require('dotenv/config')
const mongoose = require('mongoose');
const bodyParser = require('body-parser');

app.use(bodyParser.json());
const postRoute = require('./routes/posts');
const authRoute = require('./routes/auth');
const intRoute = require('./routes/postInteractions')
const statusUpdaterJob = require('./sheduledTasks');

statusUpdaterJob.start(); 
console.log('Cron Job Initialized...');

app.use('/posts', postRoute);
app.use('/user', authRoute);
app.use('/postInt', intRoute)

  
app.get('/', (req, res) =>{
    res.send('Piazza API is live!')
});

mongoose.connect(process.env.DB_CONNECTOR)
  .then(() => console.log('✅ DB is now connected'))
  .catch(err => console.error('❌ Database connection error:', err
  ))

app.listen(3000, ()=>{
    console.log('Server is up and running')
})

