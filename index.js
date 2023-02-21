const express = require('express');
const session = require("express-session");
const authController = require("./auth/authController.js");
const cookieParser = require('cookie-parser');
const app = new express();
const port = 3007;
const path = require("node:path");
const public_path = path.join(__dirname, "./public");
const helper = require("./helpers/helper.js");
const randomstring = require('randomstring');
const dotenv = require('dotenv').config({path:path.join(__dirname,'./.env')});

app.use(express.static(public_path));
app.use(express.json());
app.use(cookieParser());
app.use(express.urlencoded({extended:true}));
app.use(session({
  secret: 'cloudwordsforever',
  resave: false,
  saveUninitialized: true,
  cookie: { secure: true }
}))

app.use('/auth',authController);


app.get('/',(req,res) =>{
 
  res.sendFile(path.join(__dirname,"/views/index.html"));
})
app.get('/getgamewords',helper.getGameWords);
app.get('/gethighscore',helper.getHighScore);
app.get('/updatehighscore',helper.updateHighscore);
app.get('/fetchhighscores',helper.fetchHighscores);


app.listen(port, (error) => {

  if (error) { console.log("Error starting server"); }

  console.log("Server up");
})