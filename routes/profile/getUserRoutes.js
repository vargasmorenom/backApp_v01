const express = require('express');
const bodyParser = require('body-parser');
const User = require('../../models/UserSchema');

const app = express();
const router = express.Router();
app.use(bodyParser.urlencoded( { extended: false } ));


router.get("/", async (req,res) => { 

    const id = req.query.id;
  
    // Solo se puede consultar el usuario de la propia sesión
    if (typeof id !== 'string' || id !== String(req.user?._id)) {
        return res.status(403).json({ message: "No autorizado" });
    }

    try{
        const user = await User.findById(id)
            .select('-password -token -resetCode -resetCodeExpiry');
        res.status(200).json(user);

    }catch(error){
        console.error("Error en getuser:", error);
        res.status(500).json({ message: "Error interno del servidor" });
    }
         
});

module.exports = router;