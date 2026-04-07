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
            .exec();
            
        if(!item){
            res.status(401).json({message:"la consulta no arroja resultados"});
        }

            res.status(200).json(item);

    }catch(error){
        res.status(500).json({message: error.message })
    }
         
});

module.exports = router;