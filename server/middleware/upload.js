import multer from 'multer';

const storage = multer.memoryStorage();

const fileFilter = (req, file, cb) => {
  console.log('📦 Incoming upload:', {
    fieldname: file.fieldname,
    originalname: file.originalname,
    mimetype: file.mimetype,
  });

  /*
   * MediaRecorder chunks can arrive with:
   *   video/webm
   *   video/mp4
   *   application/octet-stream
   *
   * In your application they are currently arriving as:
   *   text/plain
   *
   * Therefore we validate the extension as well as MIME type.
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

  const isKnownRecording =
    isVideoExtension ||
    isVideoMime ||
    isBinary ||
    file.mimetype === 'text/plain';

  if (isKnownRecording) {
    cb(null, true);
  } else {
    cb(
      new Error(
        `Unsupported upload type: ${file.mimetype}`
      ),
      false
    );
  }
};

export const upload = multer({
  storage,

  limits: {
    fileSize: 200 * 1024 * 1024,
  },

  fileFilter,
});