import multer from 'multer';

const storage = multer.memoryStorage();

const fileFilter = (req, file, cb) => {
  /*
   * MediaRecorder chunks can arrive with:
   *   video/webm
   *   video/mp4
   *   application/octet-stream
   *
   */

  const fileName = (file.originalname || '').toLowerCase();

  const isVideoExtension =
    fileName.endsWith('.webm') ||
    fileName.endsWith('.mp4') ||
    fileName.endsWith('.m4v');

  const isVideoMime =
    file.mimetype === 'video/webm' ||
    file.mimetype === 'video/mp4' ||
    file.mimetype.startsWith('video/');

  const isBinary =
    file.mimetype === 'application/octet-stream';

  const isKnownRecording = (isVideoExtension && (isVideoMime || isBinary)) || isVideoMime;

  if (isKnownRecording) {
    cb(null, true);
  } else {
    const error = new Error('Unsupported reaction recording type.');
    error.statusCode = 400;
    cb(error, false);
  }
};

export const upload = multer({
  storage,

  limits: {
    fileSize: 200 * 1024 * 1024,
  },

  fileFilter,
});