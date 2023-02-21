const express = require("express");
const router = express.Router();
const path = require("node:path");
const helper = require('../helpers/helper.js');

router.get('/login', (req, res) => {

  res.sendFile(path.join(__dirname, "../views/login.html"));
});

router.get('/admin', helper.verifySession, (req,res) =>{

  res.sendFile(path.join(__dirname,'../views/admin.html'))
});

router.post('/login', helper.createSession);

router.post('/insertword',helper.verifySession,helper.insertWord,(req,res) =>{

  console.log("Inserted, redirecting now");
  res.redirect('/auth/admin');

})
router.get('/getwordtables',helper.verifySession,helper.getWordTables)

router.post('/savetable',helper.verifySession,helper.saveTable);



module.exports = router;