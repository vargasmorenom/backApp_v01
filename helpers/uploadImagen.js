const multer = require('multer');
const path = require('path');

// Configurar almacenamiento en disco
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'images/'); // carpeta temporal
  },
  filename: function (req, file, cb) {
    console.log("upload");
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  }
});

// Validar tipo de archivo
function fileFilter(req, file, cb) {
  const allowedTypes = ['image/jpeg', 'image/png'];
  if (!allowedTypes.includes(file.mimetype)) {
    const error = new Error('Tipo de archivo no permitido. Solo JPG o PNG.');
    error.code = 'LIMIT_FILE_TYPE';
    return cb(error, false);
  }
  cb(null, true);
}

// Configurar Multer
const upload = multer({ 
  storage,
  fileFilter,
  limits: { fileSize: 2 * 1024 * 1024 } // 2 MB
});

module.exports = upload;
