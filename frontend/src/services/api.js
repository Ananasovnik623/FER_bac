import axios from 'axios';

// Make sure this matches your backend address
const API_BASE_URL = 'http://localhost:5001';

/**
 * Uploads a video file to the backend.
 * @param {File} file - The video file to upload.
 * @param {Function} onUploadProgress - Callback function for upload progress updates.
 * @returns {Promise<object>} - Promise resolving with backend response (e.g., { filename: 'video.mp4' })
 */
export const uploadVideo = async (file, onUploadProgress) => {
    const formData = new FormData();
    formData.append('file', file);

    try {
        const response = await axios.post(`${API_BASE_URL}/uploadVideo`, formData, {
            headers: {
                'Content-Type': 'multipart/form-data',
            },
            onUploadProgress: progressEvent => {
                const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
                if (onUploadProgress) {
                    onUploadProgress(percentCompleted);
                }
            }
        });
        return response.data; // Should contain { message: '...', filename: '...' }
    } catch (error) {
        console.error("Error uploading video:", error.response?.data || error.message);
        throw new Error(error.response?.data?.error || 'Failed to upload video');
    }
};

/**
 * Sends request to analyze the uploaded video.
 * This initiates an asynchronous job.
 * @param {string} videoFilename - The filename returned by the upload endpoint.
 * @param {number} frameInterval - The desired frame extraction interval.
 * @returns {Promise<object>} - Promise resolving with job initiation details (e.g., { job_id: '...', status_url: '...' })
 */
export const analyzeVideo = async (videoFilename, frameInterval = 30) => {
    try {
        console.log("Requesting analysis for video:", videoFilename);
        const response = await axios.post(`${API_BASE_URL}/analyzeVideo`, {
            video_filename: videoFilename,
            frame_interval: frameInterval
        }, {
            headers: {
                'Content-Type': 'application/json',
            }
        });
        console.log("Analysis request successful:", response.data);
        return response.data; // Should contain { job_id: '...', status_url: '...' }
    } catch (error) {
        console.error("Error initiating video analysis:", error.response?.data || error.message);
        throw new Error(error.response?.data?.error || 'Failed to initiate video analysis');
    }
};

/**
 * Fetches the status and result of an analysis job.
 * @param {string} jobId - The ID of the job to check.
 * @returns {Promise<object>} - Promise resolving with job status and data.
 */
export const getAnalysisJobStatus = async (jobId) => {
    try {
        const response = await axios.get(`${API_BASE_URL}/jobs/${jobId}`);
        return response.data; // Should contain { job_id: '...', status: '...', data: ... }
    } catch (error) {
        console.error("Error fetching job status:", error.response?.data || error.message);
        throw new Error(error.response?.data?.error || 'Failed to fetch job status');
    }
};

// --- Optional: Webcam Recording Functions ---
// NOTE: Implementing full webcam recording requires more state management
// in the component (stream, recorder instance, etc.)
// This is a placeholder structure.

let mediaRecorder;
let recordedChunks = [];

export const startRecording = async (stream) => {
    recordedChunks = []; // Reset chunks
    
    // Try different codec options depending on browser support
    const mimeTypes = [
        'video/webm;codecs=vp9,opus',
        'video/webm;codecs=vp8,opus',
        'video/webm',
        'video/mp4'
    ];
    
    let options = { mimeType: mimeTypes[0] };
    
    // Find a supported MIME type
    for (const type of mimeTypes) {
        if (MediaRecorder.isTypeSupported(type)) {
            options.mimeType = type;
            console.log(`Using supported MIME type: ${type}`);
            break;
        }
    }
    
    try {
        mediaRecorder = new MediaRecorder(stream, options);

        mediaRecorder.ondataavailable = (event) => {
            console.log(`Data available: ${event.data.size} bytes`);
            if (event.data.size > 0) {
                recordedChunks.push(event.data);
            }
        };
        
        // Set a timer to get data every second (helps ensure we get data)
        mediaRecorder.start(1000); 
        console.log("Recording started with options:", options);
        return true; // Indicate success
    } catch (error) {
        console.error("Error starting recording:", error);
        return false; // Indicate failure
    }
};

export const stopRecording = () => {
    return new Promise((resolve) => {
        if (mediaRecorder && mediaRecorder.state === "recording") {
            mediaRecorder.onstop = () => {
                const blob = new Blob(recordedChunks, { type: 'video/webm' });
                recordedChunks = []; // Clear chunks after creating blob
                console.log("Recording stopped, blob created:", blob);
                resolve(blob); // Resolve the promise with the blob
            };
            mediaRecorder.stop();
        } else {
             console.warn("MediaRecorder not recording or not initialized.");
             resolve(null); // Resolve with null if not recording
        }
    });
};
