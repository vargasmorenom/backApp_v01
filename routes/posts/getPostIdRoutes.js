const express = require('express');
const bodyParser = require('body-parser');
const Posted = require('../../models/PostSchema');
const User = require('../../models/UserSchema');


const app = express();
const router = express.Router();
app.use(bodyParser.urlencoded( { extended: false } ));


router.get("/", async (req,res) => { 

    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 3;
    const id = req.query.id;
    const skip = (page -1) * limit;

    try{
        const items = await Posted.find({ postedBy: id })
        .sort({ likes:-1 })
        .skip(skip)
        .limit(limit)
        .exec();

        res.status(200).json(items);

    }catch(error){
        res.status(500).json({message: error.message })
    }
         
});

module.exports = router;