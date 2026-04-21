const express = require('express');
const router = express.Router();
const multer = require('multer');
const sharp = require('sharp');

const app = express()



const helperImg = async (filePath, fileName, size = 300) => {
  const image = sharp(filePath);
  const metadata = await image.metadata();

  const squareSize = Math.min(metadata.width, metadata.height);
  const left = Math.floor((metadata.width - squareSize) / 2);
  const top = Math.floor((metadata.height - squareSize) / 2);

  return image
    .extract({ width: squareSize, height: squareSize, left, top }) // recorte centrado
    .resize(size, size) // redimensionar al tamaño deseado
    .jpeg({ quality: 85 })
    .toFile(`./files/${fileName}.jpg`);
};


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

router.post('/',upload.single('file'),(req,res)=>{
    helperImg(req.file.path,`resize-${req.file.filename}`,300 )
    res.send({data:'Imagen Cargada'})
})

module.exports = router;
