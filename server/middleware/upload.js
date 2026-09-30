import multer from 'multer';

// Use memory storage for direct upload streaming to Cloudinary
const storage = multer.memoryStorage();

// Accept common video formats and binary chunks
const fileFilter = (req, file, cb) => {
  if (
    !file.mimetype ||
    file.mimetype.startsWith('video/') ||
    file.mimetype.includes('octet-stream') ||
    file.mimetype.includes('webm') ||
    file.mimetype.includes('mp4')
  ) {
    cb(null, true);
  } else {
    cb(new Error('Only video files are allowed!'), false);
  }
};

export const upload = multer({
  storage,
  limits: {
    fileSize: 100 * 1024 * 1024, // 100 MB max size
  },
  fileFilter,
});
