const express = require('express');
const bodyParser = require('body-parser');
const Posted = require('../../models/PostSchema');


const app = express();
const router = express.Router();
app.use(bodyParser.urlencoded( { extended: false } ));


router.get("/", async (req,res) => { 

    try{
        const idPost = req.query.id;

        if(!idPost){
        
            res.status(401).json({message:"Hace falta el parametro Id"}); 
            
        }
    
        const item = await Posted.findOne({ _id : idPost })
            .populate('profileId', 'chanelName profilePic')
            .exec();
            
        if(!item){
            return res.status(401).json({message:"la consulta no arroja resultados"});
        }

        const result = item.toObject();
        if (result.profileId && (!result.profileId.profilePic || result.profileId.profilePic.length === 0)) {
            result.profileId.profilePic = [{ small: null, medium: null, large: null }];
        }

        res.status(200).json(result);

    }catch(error){
        res.status(500).json({message: error.message })
    }
         
});

module.exports = router;