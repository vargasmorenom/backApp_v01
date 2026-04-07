const express = require('express');
const router = express.Router();
const bcrypt = require("bcrypt");

const app = express();
app.use(bodyParser.urlencoded( { extended: false } ));

router.get("/",(req,res, next)=>{
    req.session.destroy(()=>{
        res.send("ok");
    })
})

module.exports = router;