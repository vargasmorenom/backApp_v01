const express = require('express');
const bodyParser = require('body-parser');
const Post = require('../../models/PostSchema');
const User = require('../../models/UserSchema');

const app = express();
const router = express.Router();
app.use(bodyParser.urlencoded( { extended: false } ));

router.post("/", async (req, res, next) => {
 
    const idfollowers = req.body.idfollowers;
    const idUser = req.body.idUser;

    if(idfollowers && idUser){

        const user = await User.findOne({
                   $or:[
                       {_id: idUser},
                   ]
               }).catch((error) => {
                   payload.errorMessage = "something went wrong";
                   return res.status(200).render(payload.errorMessage);
               });
        if(user){
         
                if(user.followers.includes(idfollowers)){
               
                   const  updateProfileless = await Post.findByIdAndUpdate(
                        idUser,{
                            $inc:{followersNumber: - 1},
                            $pull:{followers: idfollowers}
                        },
                        {new: true}
                    );
                    return res.json(updateProfileless.followersNumber);
                }else{
               
                  const updateProfilemore = await Post.findByIdAndUpdate(
                        idUser,{
                            $inc:{followersNumber: + 1},
                            $push:{followers: idfollowers}
                        },
                        {new: true}
                    );
                    return res.json(updateProfilemore.followersNumber);
                 
                }
                  
        }       
        return res.json("error de usuario");

    }
    return res.status(201).json("error de usuario");

});
module.exports = router;