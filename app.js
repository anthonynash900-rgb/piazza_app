const express = require('express');
const app = express();
require('dotenv/config')
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const postRoute = require('./routes/posts');

app.use(bodyParser.json());

app.use('/posts', postRoute);

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

