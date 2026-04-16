const express = require('express');
const bodyParser = require('body-parser');
const Posted = require('../../models/PostSchema');
const User = require('../../models/UserSchema');


const app = express();
const router = express.Router();
//app.use(bodyParser.urlencoded( { extended: false } ));


router.get("/", async (req,res) => { 

    try {
        let page = parseInt(req.query.page) || 1;
        let limit = parseInt(req.query.limit) || 3;

        // Validation
        if (page < 1) page = 1;
        if (limit < 1) limit = 3;
        if (limit > 50) limit = 50; // Enforce max limit

        const skip = (page -1) * limit;

        const items = await Posted.find()
        .populate('profileId','chanelName profilePic')
        .sort({ likes:-1 })
        .skip(skip)
        .limit(limit)
        .exec();

        const defaultPic = { small: null, medium: null, large: null };

        const result = items.map(item => {
            const obj = item.toObject();
            if (obj.profileId && (!obj.profileId.profilePic || obj.profileId.profilePic.length === 0)) {
                obj.profileId.profilePic = [defaultPic];
            }
            return obj;
        });

        console.log('[getPost] primer item imagen:', JSON.stringify(result[0]?.imagen));
        res.status(200).json(result);

    } catch(error){
        console.error("Error in getPost:", error); // Log internal error
        res.status(500).json({message: "An error occurred while fetching posts." }); // Generic message
    }
         
});

module.exports = router;