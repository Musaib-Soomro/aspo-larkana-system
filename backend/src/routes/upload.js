const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const { uploadFile, listAttachments, deleteAttachment } = require('../controllers/uploadController');
const { authenticate } = require('../middleware/auth');

// Setup multer storage
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/');
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({ 
  storage,
  limits: { fileSize: 10 * 1024 * 1024 } // 10MB limit
});

router.use(authenticate);

router.post('/', upload.single('file'), uploadFile);
router.get('/', listAttachments);
router.delete('/:id', deleteAttachment);

module.exports = router;
