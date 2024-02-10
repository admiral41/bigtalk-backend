// importing Packages
const express = require('express');
const dotenv=require('dotenv');
const connectToDB = require('./database/db');
const cors = require('cors');
const cloudinary = require('cloudinary');
const acceptMultimedia = require('connect-multiparty');

// creating an express app
const app = express();

// configuring dotenv to use the .env file
dotenv.config();
// cloudinary config          
cloudinary.config({ 
    cloud_name: process.env.CLOUD_NAME, 
    api_key: process.env.CLOUD_API_KEY, 
    api_secret: process.env.CLOUD_API_SECRET
  });
  
app.use(acceptMultimedia());

// Cors config to accept request from frontend
const corsOptions={
    origin:true,
    credentials:true,
    optionSuccessStatus:200
}
app.use(cors(corsOptions));

// connecting to database
connectToDB();

// accepting json data
app.use(express.json());
// Importing routes

const user=require('./routes/userRoutes');
const post = require('./routes/postRoutes');
const activity = require('./routes/activityRoutes');

// using routes

app.use('/api/v1',user);
app.use('/api/v1',post);
app.use('/api/v1',activity);



// Defining port
const PORT = process.env.PORT;
//running the server on port 5000
app.listen(PORT, () => {
    console.log(`Listening on port: ${PORT}`)
});
