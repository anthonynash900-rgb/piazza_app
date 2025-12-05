const express = require('express');
const app = express();

app.get('/', (req, res) =>{
    res.send('Piazza API is live!')
});

app.listen(3000, ()=>{
    console.log('Server is up and running')
});