const express = require('express');
const bodyParser = require('body-parser');
const Posted = require('../../models/PostSchema');
const User = require('../../models/UserSchema');

const tk = require("jsonwebtoken");

const multer = require('multer');
const sharp = require('sharp');

const app = express();
const router = express.Router();
app.use(bodyParser.urlencoded( { extended: false } ));

const helperImg = (filePath, fileName, size = 300) =>{
    return sharp(filePath).resize(size).jpeg({ quality: 85 }).toFile(`./files/${fileName}.jpg`)
}

const storage = multer.diskStorage({
    destination:(req, file, cb)=>{
        cb(null,'./files') 
    },
    filename: (req, file, cb) => {
        const ext = file.originalname.split('.').pop();
        cb(null,`${Date.now()}.${ext}`);

    }
});

const upload = multer({ storage })

router.post("/", upload.single('file'), async (req,res) => { 
    
    const payload = req.body;
    
    if(req.body.name && req.body.typePost && req.body.access && req.headers['iduser']){

        const user = await User.findOne(
            {_id: req.headers['iduser']})
        .catch((error) => {
            payload.errorMessage = "something went wrong";
            return res.status(200).render(payload.errorMessage);
        });

        if(user){

            Posted.create(datos).then((user) => {
                req.session.user = user;
                return res.status(200).json("Usuario Creado Correctamente");
            })

        }
   
    }else{
        return res.status(201).json("ya tienes un titulo con este nombre");
    }
        
});

module.exports = router;