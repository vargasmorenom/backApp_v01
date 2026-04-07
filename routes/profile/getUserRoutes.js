const express = require('express');
const bodyParser = require('body-parser');
const User = require('../../models/UserSchema');

const app = express();
const router = express.Router();
app.use(bodyParser.urlencoded( { extended: false } ));


router.get("/", async (req,res) => { 

    const id = req.query.id;
  
    try{
        const user = await User.findOne({_id : id});
        res.status(200).json(user);

    }catch(error){
        res.status(500).json({message: error.message })
    }
         
});

module.exports = router;