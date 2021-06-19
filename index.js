const { response, json } = require('express');
const express = require('express');
const fetch = require('node-fetch');
const redis = require('redis');
const port = 4008;

//create express application instance
const app = express();

//create and connect redis client to local instance
const client = redis.createClient(6379);

//echo redis error to console

client.on('error', (err) => {
    console.log('error' + err);
});

//get photos list
app.get('/photos', (req, res) => {

    //key to store photos in redis store
    const photosRedisKey = 'user:photos';

    // Try fetching the result from Redis first in case we have it cached
    return client.get(photosRedisKey, (err, photos) => {

        //if key store in redis store
        if(photos) {
            return res.json({ source: 'cache', data: JSON.parse(photos) })
        } else { // Key does not exist in Redis store
            
            //fetch directly from remote api
            fetch('https://jsonplaceholder.typicode.com/photos')
            .then(response => response.json())
            .then( photos => {

                // Save the  API response in Redis store,  data expire time in 3600 seconds, it means one hour
                client.setex(photosRedisKey, 3600, JSON.stringify(photos));

                //send Json Response to client
                return res.json({ source: 'cache', data: JSON.parse(photos)});
            }).catch(error => {
                // log error message
                console.log(error)
                // send error to the client 
                return res.json(error.toString())
            })

        }
    });
});

app.listen(port, () => {
    console.log(`Server is listening on port ${port}`);
});
