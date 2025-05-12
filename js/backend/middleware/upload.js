const path   = require('path');
const multer = require('multer');

// Carpeta donde se guardarán las imágenes
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
      cb(null, path.join(__dirname, '../../assets/images'));
    },
    filename: (req, file, cb) => {
      const ext = path.extname(file.originalname);
      const name = `libro-${Date.now()}${ext}`;
      cb(null, name);
    }
  });

// Filtro para aceptar sólo imágenes
function fileFilter(req, file, cb) {
  if (file.mimetype.startsWith('image/')) cb(null, true);
  else cb(new Error('Sólo imágenes permitidas'), false);
}

module.exports = multer({ storage, fileFilter });