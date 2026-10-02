import React, {
  useState,
  useEffect,
  useRef,
  useImperativeHandle,
  forwardRef,
} from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Video,
  AlertCircle,
  Check,
  StopCircle,
} from 'lucide-react';

import {
  createRecordingSession,
  uploadReactionChunk,
  finalizeReactionSession,
  markSessionIncomplete,
} from '../services/reactionService';

const CameraRecorder = forwardRef(function CameraRecorder(
  {
    isRecordingActive,
    dayNumber,
    date,
    sessionId: propSessionId,
    onSessionStarted,
    onRecordingFinalized,
    onError,
    onStopRequested,
  },
  ref
) {
  const videoPreviewRef = useRef(null);
  const mediaRecorderRef = useRef(null);
  const streamRef = useRef(null);

  const chunkIndexRef = useRef(0);
  const allChunksRef = useRef([]);

  const sessionIdRef = useRef(
    propSessionId ||
      `session_${Date.now()}_${Math.random()
        .toString(36)
        .slice(2, 8)}`
  );

  const isFinalizedRef = useRef(false);

  // IMPORTANT:
  // Keep every upload promise so we can wait for ALL uploads.
  const uploadPromisesRef = useRef([]);

  const [hasPermission, setHasPermission] = useState(false);
  const [isInitializing, setIsInitializing] = useState(true);
  const [errorMessage, setErrorMessage] = useState(null);
  const [savedSeconds, setSavedSeconds] = useState(0);
  const [statusMessage, setStatusMessage] = useState(
    'Your reaction is being saved while you watch ❤️'
  );
  const [isFinishing, setIsFinishing] = useState(false);

  useImperativeHandle(ref, () => ({
    stopAndFinalize,
  }));

  /*
   * Timer
   */
  useEffect(() => {
    if (!hasPermission || isFinishing) return;

    const interval = setInterval(() => {
      setSavedSeconds((prev) => prev + 1);
    }, 1000);

    return () => clearInterval(interval);
  }, [hasPermission, isFinishing]);

  /*
   * Upload one chunk
   */
  const handleUploadChunk = (blob, chunkNumber) => {
    const uploadPromise = uploadReactionChunk({
      sessionId: sessionIdRef.current,
      dayNumber,
      chunkNumber,
      chunkBlob: blob,
    })
      .then((result) => {
        if (!result.success) {
          throw result.error || new Error(
            `Chunk ${chunkNumber} upload failed`
          );
        }

        setStatusMessage(
          `Reaction saved ❤️ (${chunkNumber + 1} chunk${
            chunkNumber === 0 ? '' : 's'
          })`
        );

        return result;
      })
      .catch((error) => {
        console.error(
          `❌ Chunk ${chunkNumber} upload failed:`,
          error
        );

        setStatusMessage(
          'Unable to upload reaction chunk. Please check your connection.'
        );

        throw error;
      });

    uploadPromisesRef.current.push(uploadPromise);

    return uploadPromise;
  };

  /*
   * Wait for MediaRecorder to completely stop.
   */
  const stopRecorderAndWait = () => {
    return new Promise((resolve) => {
      const recorder = mediaRecorderRef.current;

      if (!recorder || recorder.state === 'inactive') {
        resolve();
        return;
      }

      const oldOnStop = recorder.onstop;

      recorder.onstop = (event) => {
        if (oldOnStop) {
          try {
            oldOnStop(event);
          } catch (e) {
            console.warn('Previous onstop handler error:', e);
          }
        }

        resolve();
      };

      try {
        /*
         * Ask MediaRecorder to release any buffered data.
         */
        if (typeof recorder.requestData === 'function') {
          try {
            recorder.requestData();
          } catch (e) {
            console.warn('requestData warning:', e);
          }
        }

        recorder.stop();
      } catch (error) {
        console.warn('MediaRecorder stop error:', error);
        resolve();
      }
    });
  };

  /*
   * Stop recording and finalize.
   */
  const stopAndFinalize = async () => {
    if (isFinalizedRef.current) {
      return;
    }

    isFinalizedRef.current = true;
    setIsFinishing(true);

    setStatusMessage(
      'Finishing your reaction and saving the video ❤️...'
    );

    try {
      /*
       * STEP 1
       * Stop MediaRecorder and WAIT for the final dataavailable event.
       */
      await stopRecorderAndWait();

      /*
       * STEP 2
       * Wait for every chunk upload to finish.
       */
      const uploadPromises = uploadPromisesRef.current;

      if (uploadPromises.length > 0) {
        console.log(
          `⏳ Waiting for ${uploadPromises.length} chunk upload(s)...`
        );

        const results = await Promise.allSettled(uploadPromises);

        const failedUploads = results.filter(
          (result) => result.status === 'rejected'
        );

        if (failedUploads.length > 0) {
          throw new Error(
            `${failedUploads.length} video chunk upload(s) failed.`
          );
        }

        console.log('✅ All video chunks uploaded.');
      }

      /*
       * STEP 3
       * Make sure we actually recorded something.
       */
      if (allChunksRef.current.length === 0) {
        throw new Error(
          'No video data was recorded. Please record for a few seconds and try again.'
        );
      }

      const fallbackBlob = new Blob(
        allChunksRef.current,
        { type: 'video/webm' }
      );

      console.log(
        '🎥 Recorded chunks:',
        allChunksRef.current.length
      );

      console.log(
        '🎥 Recorded size:',
        fallbackBlob.size,
        'bytes'
      );

      /*
       * STEP 4
       * Finalize backend session.
       */
      const finalizeRes = await finalizeReactionSession({
        sessionId: sessionIdRef.current,
        dayNumber,
        date,
        localFallbackBlob: fallbackBlob,
      });

      console.log(
        '✅ Finalization response:',
        finalizeRes
      );

      if (onRecordingFinalized) {
        onRecordingFinalized(
          finalizeRes.data?.reaction || null
        );
      }
    } catch (error) {
      console.error(
        '❌ Recording finalization failed:',
        error
      );

      setStatusMessage(
        'Could not save the reaction video. Please try again.'
      );

      if (onError) {
        onError(error.message);
      }

      if (onRecordingFinalized) {
        onRecordingFinalized(null);
      }
    } finally {
      /*
       * Stop camera and microphone.
       */
      if (streamRef.current) {
        streamRef.current
          .getTracks()
          .forEach((track) => track.stop());

        streamRef.current = null;
      }

      setIsFinishing(false);
    }
  };

  /*
   * Initialize camera.
   */
  useEffect(() => {
    let isCancelled = false;

    async function initCamera() {
      setIsInitializing(true);
      setErrorMessage(null);

      if (
        !navigator.mediaDevices ||
        !navigator.mediaDevices.getUserMedia
      ) {
        const error =
          'Camera access is not supported by this browser.';

        setErrorMessage(error);
        setIsInitializing(false);

        if (onError) {
          onError(error);
        }

        return;
      }

      if (typeof MediaRecorder === 'undefined') {
        const error =
          'MediaRecorder is not supported by this browser.';

        setErrorMessage(error);
        setIsInitializing(false);

        if (onError) {
          onError(error);
        }

        return;
      }

      try {
        const stream =
          await navigator.mediaDevices.getUserMedia({
            video: {
              width: { ideal: 640 },
              height: { ideal: 480 },
              facingMode: 'user',
            },
            audio: true,
          });

        if (isCancelled) {
          stream
            .getTracks()
            .forEach((track) => track.stop());

          return;
        }

        streamRef.current = stream;
        setHasPermission(true);

        if (videoPreviewRef.current) {
          videoPreviewRef.current.srcObject = stream;
        }

        /*
         * Find supported video format.
         */
        const preferredTypes = [
          'video/webm;codecs=vp9,opus',
          'video/webm;codecs=vp8,opus',
          'video/webm',
          'video/mp4',
        ];

        const mimeType = preferredTypes.find((type) =>
          MediaRecorder.isTypeSupported(type)
        );

        console.log(
          '🎥 MediaRecorder MIME type:',
          mimeType || 'browser default'
        );

        const recorderOptions = mimeType
          ? { mimeType }
          : undefined;

        const mediaRecorder = new MediaRecorder(
          stream,
          recorderOptions
        );

        mediaRecorderRef.current = mediaRecorder;

        allChunksRef.current = [];
        chunkIndexRef.current = 0;
        uploadPromisesRef.current = [];

        /*
         * Create MongoDB recording session.
         */
        const sessionResult =
          await createRecordingSession({
            sessionId: sessionIdRef.current,
            dayNumber,
            date,
          });

        console.log(
          '✅ Recording session:',
          sessionResult
        );

        if (onSessionStarted) {
          onSessionStarted(
            sessionIdRef.current
          );
        }

        /*
         * IMPORTANT:
         * Every time MediaRecorder produces data,
         * save it locally AND upload it.
         */
        mediaRecorder.ondataavailable = (event) => {
          console.log(
            '📦 dataavailable:',
            event.data?.size || 0,
            'bytes'
          );

          if (
            event.data &&
            event.data.size > 0
          ) {
            allChunksRef.current.push(
              event.data
            );

            const currentChunk =
              chunkIndexRef.current;

            chunkIndexRef.current += 1;

            handleUploadChunk(
              event.data,
              currentChunk
            );
          }
        };

        mediaRecorder.onerror = (event) => {
          console.error(
            '❌ MediaRecorder error:',
            event
          );
        };

        mediaRecorder.onstart = () => {
          console.log(
            '🔴 MediaRecorder started'
          );
        };

        mediaRecorder.onstop = () => {
          console.log(
            '⏹ MediaRecorder stopped'
          );
        };

        /*
         * Generate one chunk every 5 seconds.
         */
        mediaRecorder.start(5000);

        console.log(
          '🎥 Recording started successfully.'
        );

        setStatusMessage(
          'Your reaction is being recorded and saved ❤️'
        );

        setIsInitializing(false);
      } catch (error) {
        console.error(
          '❌ Camera initialization error:',
          error
        );

        setIsInitializing(false);

        const friendly =
          error.name === 'NotAllowedError' ||
          error.name === 'PermissionDeniedError'
            ? 'Camera permission was not granted ❤️'
            : 'Could not access camera/microphone.';

        setErrorMessage(friendly);

        if (onError) {
          onError(friendly);
        }
      }
    }

    if (isRecordingActive) {
      initCamera();
    }

    return () => {
      isCancelled = true;

      /*
       * Do NOT finalize automatically here.
       * Just preserve the session if the page is closed.
       */
      if (
        !isFinalizedRef.current &&
        sessionIdRef.current
      ) {
        markSessionIncomplete(
          sessionIdRef.current
        );
      }

      if (
        mediaRecorderRef.current &&
        mediaRecorderRef.current.state !==
          'inactive'
      ) {
        try {
          mediaRecorderRef.current.stop();
        } catch (error) {
          console.warn(
            'Cleanup recorder stop warning:',
            error
          );
        }
      }

      if (streamRef.current) {
        streamRef.current
          .getTracks()
          .forEach((track) => track.stop());

        streamRef.current = null;
      }
    };
  }, [isRecordingActive, dayNumber, date]);

  if (errorMessage) {
    return (
      <div className="bg-white/95 border border-rose-200 text-rose-800 text-xs p-3.5 rounded-2xl flex items-center gap-2 max-w-sm mx-auto shadow-sm">
        <AlertCircle className="w-4 h-4 text-rose-500 shrink-0" />

        <span>{errorMessage}</span>
      </div>
    );
  }

  return (
    <div className="fixed bottom-6 right-6 z-40">
      <AnimatePresence>
        <motion.div
          initial={{
            opacity: 0,
            scale: 0.85,
            y: 20,
          }}
          animate={{
            opacity: 1,
            scale: 1,
            y: 0,
          }}
          exit={{
            opacity: 0,
            scale: 0.85,
            y: 20,
          }}
          className="relative w-48 sm:w-60 bg-gray-950 rounded-3xl overflow-hidden shadow-2xl border-2 border-rose-400"
        >
          <div className="relative aspect-[4/3] bg-black">
            <video
              ref={videoPreviewRef}
              autoPlay
              playsInline
              muted
              className="w-full h-full object-cover"
              style={{
                transform: 'scaleX(-1)',
              }}
            />

            <div className="absolute top-2.5 left-2.5 flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-red-600/90 text-white text-[10px] font-bold tracking-wider uppercase shadow-md">
              <span className="w-2 h-2 rounded-full bg-white animate-ping" />
              <span>RECORDING</span>
            </div>

            <div className="absolute top-2.5 right-2.5 p-1 rounded-full bg-black/50 text-rose-300">
              <Video className="w-3.5 h-3.5" />
            </div>

            <div className="absolute bottom-2 left-2.5 px-2 py-0.5 rounded-full bg-black/70 backdrop-blur-sm text-white text-[10px] font-mono flex items-center gap-1">
              <span className="text-emerald-400">
                ●
              </span>

              <span>
                Saved: {savedSeconds}s
              </span>
            </div>
          </div>

          <div className="p-3 bg-gray-900 text-center border-t border-gray-800">
            <p className="text-[11px] font-medium text-rose-200 leading-snug mb-1.5">
              {statusMessage}
            </p>

            <div className="flex items-center justify-between text-[10px] text-gray-400 pt-1 border-t border-gray-800/80">
              <span className="text-emerald-400 flex items-center gap-1">
                <Check className="w-3 h-3" />
                <span>Reaction saving</span>
              </span>

              <button
                type="button"
                onClick={() => {
                  if (onStopRequested) {
                    onStopRequested();
                  } else {
                    stopAndFinalize();
                  }
                }}
                disabled={isFinishing}
                className="text-rose-400 hover:text-rose-300 font-semibold flex items-center gap-1 transition-colors"
              >
                <StopCircle className="w-3.5 h-3.5" />

                <span>
                  {isFinishing
                    ? 'Saving...'
                    : 'Stop'}
                </span>
              </button>
            </div>
          </div>
        </motion.div>
      </AnimatePresence>
    </div>
  );
});

export default CameraRecorder;