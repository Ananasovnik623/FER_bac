import { useState, useRef, useEffect } from 'react';

/**
 * Video Recorder Component
 * Provides webcam recording functionality with proper aspect ratio handling
 * 
 * @param {Function} onVideoRecorded - Callback when a video is recorded
 * @param {Boolean} disabled - Whether the recorder is disabled
 */
function VideoRecorder({ onVideoRecorded, disabled }) {
  const [isRecording, setIsRecording] = useState(false);
  const [videoStream, setVideoStream] = useState(null);
  const [cameraActive, setCameraActive] = useState(false);
  const [cameraError, setCameraError] = useState(null);
  const videoRef = useRef(null);
  const mediaRecorderRef = useRef(null);
  const chunksRef = useRef([]);
  
  // Handle the camera initialization
  const startCamera = async () => {
    try {
      setCameraError(null);
      
      // Request camera access with explicit constraints
      const constraints = {
        audio: false, 
        video: { 
          width: { ideal: 640 },
          height: { ideal: 480 },
          facingMode: "user"
        }
      };
      
      console.log("Requesting camera with constraints:", constraints);
      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      
      console.log("Camera stream obtained:", stream);
      
      // First set camera active and let the component render with the video element
      setVideoStream(stream);
      setCameraActive(true);
      
      // Use setTimeout to ensure the video element is mounted before we try to use it
      setTimeout(() => {
        if (videoRef.current) {
          console.log("Setting video srcObject after delay");
          videoRef.current.srcObject = stream;
          
          // Force the video to play
          videoRef.current.play().catch(err => {
            console.error("Play error:", err);
            setCameraError(`Couldn't play video: ${err.message}`);
          });
        } else {
          console.error("Video ref is still null after delay");
          setCameraError("Failed to initialize video element");
        }
      }, 100);
      
      return stream;
    } catch (err) {
      console.error("Error accessing camera:", err);
      // Provide more user-friendly error messages
      if (err.name === 'NotAllowedError') {
        setCameraError("Camera access denied. Please grant permission to use your camera.");
      } else if (err.name === 'NotFoundError') {
        setCameraError("No camera found. Please make sure your camera is connected.");
      } else {
        setCameraError(`Camera error: ${err.message}`);
      }
      return null;
    }
  };
  
  const startRecording = async () => {
    try {
      // Start camera if not already active
      const stream = videoStream || await startCamera();
      if (!stream) return;
      
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      chunksRef.current = [];
      
      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          chunksRef.current.push(e.data);
        }
      };
      
      mediaRecorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: 'video/webm' });
        
        // Create a File object with a proper filename and extension
        const currentDate = new Date().toISOString().replace(/[:.]/g, '-');
        const fileName = `recording-${currentDate}.webm`;
        
        // Create a File object from the Blob
        const fileFromBlob = new File([blob], fileName, { 
          type: 'video/webm',
          lastModified: Date.now()
        });
        
        onVideoRecorded(fileFromBlob);
      };
      
      mediaRecorder.start();
      setIsRecording(true);
    } catch (err) {
      console.error("Error starting recording:", err);
      setCameraError("Failed to start recording");
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };
  
  const stopCamera = () => {
    if (videoStream) {
      videoStream.getTracks().forEach(track => track.stop());
      setVideoStream(null);
      setCameraActive(false);
      setCameraError(null);
    }
  };
  
  // Clean up camera when component unmounts
  useEffect(() => {
    return () => {
      stopCamera();
    };
  }, []);

  return (
    <div className="video-recorder">
      {/* Controls are positioned at the top so they're always accessible */}
      <div className="recording-controls">
        {!cameraActive ? (
          <button 
            onClick={startCamera} 
            disabled={disabled}
            className="btn camera-btn"
          >
            Turn On Camera
          </button>
        ) : (
          <>
            {!isRecording ? (
              <button 
                onClick={startRecording} 
                disabled={disabled}
                className="btn record-btn"
              >
                Start Recording
              </button>
            ) : (
              <button 
                onClick={stopRecording} 
                disabled={disabled}
                className="btn stop-btn"
              >
                Stop Recording
              </button>
            )}
            <button 
              onClick={stopCamera} 
              disabled={disabled}
              className="btn camera-off-btn"
            >
              Turn Off Camera
            </button>
            {isRecording && <span className="recording-indicator">● Recording</span>}
          </>
        )}
      </div>
      
      {/* Show errors if they occur */}
      {cameraError && (
        <div className="camera-error">
          Error: {cameraError}
        </div>
      )}
      
      {/* Video preview container - simplified structure */}
      {cameraActive && (
        <div className="video-preview-container">
          <div className="video-preview">
            <video 
              ref={videoRef}
              autoPlay
              playsInline
              muted
            />
          </div>
        </div>
      )}
    </div>
  );
}

export default VideoRecorder;
