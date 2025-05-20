import { useState } from 'react';
import VideoRecorder from './components/VideoCapture/VideoRecorder';
import VideoUploader from './components/VideoCapture/VideoUploader';
import AnalysisForm from './components/Analysis/AnalysisForm';
import AnalysisResults from './components/Analysis/AnalysisResults';
import LoadingIndicator from './components/common/LoadingIndicator';
import ErrorMessage from './components/common/ErrorMessage';
import { uploadVideo, analyzeVideo, getAnalysisJobStatus } from './services/api';
import './App.css';

/**
 * Main application component handling:
 * - Video upload/recording state management
 * - API communication
 * - Analysis flow coordination
 * - Results display
 */
function App() {
  // Video and file state
  const [videoFile, setVideoFile] = useState(null);
  const [videoSource, setVideoSource] = useState(null);
  const [uploadedFilename, setUploadedFilename] = useState(null);
  
  // Analysis process state
  const [jobId, setJobId] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isPolling, setIsPolling] = useState(false);
  const [error, setError] = useState(null);
  const [results, setResults] = useState(null);
  const [uploadProgress, setUploadProgress] = useState(0);

  /**
   * Handles a newly selected video (from recorder or uploader)
   * Automatically starts the upload process
   */
  const handleVideoSelected = (file) => {
    setVideoFile(file);
    setVideoSource(file.name || 'Recorded video');
    setUploadedFilename(null);
    setResults(null);
    setError(null);
    setJobId(null);

    // Automatically start the upload when a file is selected
    handleUpload(file);
  };
  
  /**
   * Uploads video to the backend server with progress tracking
   */
  const handleUpload = async (file) => {
    try {
      setIsUploading(true);
      setError(null);
      setUploadProgress(0);
      
      const uploadResponse = await uploadVideo(file, progress => {
        setUploadProgress(progress);
      });
      
      console.log("File uploaded successfully:", uploadResponse);
      setUploadedFilename(uploadResponse.filename);
    } catch (err) {
      console.error("Upload error:", err);
      setError(err.message || 'Failed to upload video');
    } finally {
      setIsUploading(false);
    }
  };

  /**
   * Initiates the emotion analysis process on the uploaded video
   */
  const handleAnalysisSubmit = async () => {
    if (!uploadedFilename) {
      setError('Please wait for video upload to complete');
      return;
    }
    
    try {
      setIsAnalyzing(true);
      setError(null);
      
      // Use a fixed frame interval of 30
      const analysisResponse = await analyzeVideo(uploadedFilename, 30);
      
      if (analysisResponse.job_id) {
        setJobId(analysisResponse.job_id);
        // Start polling for job status
        pollJobStatus(analysisResponse.job_id);
      } else {
        throw new Error('No job ID returned from analysis request');
      }
    } catch (err) {
      console.error("Analysis error:", err);
      setError(err.message || 'Failed to analyze video');
      setIsAnalyzing(false);
    }
  };
  
  /**
   * Polls the backend for analysis job status until complete or error
   * Updates UI based on current status
   */
  const pollJobStatus = async (jid) => {
  try {
    setIsPolling(true);
    
    // Poll every 2 seconds
    const checkStatus = async () => {
      try {
        const statusResponse = await getAnalysisJobStatus(jid);
        console.log("Job status response:", statusResponse);
        
        if (statusResponse.status === 'done') {
          console.log("Analysis complete, setting results");
          setResults(statusResponse.data);
          setIsAnalyzing(false);
          setIsPolling(false);
        } else if (statusResponse.status === 'error' || statusResponse.status === 'failed') {
          throw new Error(statusResponse.error || 'Analysis failed');
        } else {
          // Still processing, poll again after delay
          console.log("Job still processing, polling again...");
          setTimeout(checkStatus, 2000);
        }
      } catch (err) {
        console.error("Status polling error:", err);
        setError(err.message);
        setIsAnalyzing(false);
        setIsPolling(false);
      }
    };
    
    // Start polling
    checkStatus();
    
  } catch (err) {
    setError(err.message || 'Failed to check analysis status');
    setIsAnalyzing(false);
    setIsPolling(false);
  }
};

  return (
    <div className="app-container">
      <header>
        <h1>Emotion Analysis Demo</h1>
        <p>Upload or record a video to analyze facial expressions and emotions</p>
      </header>
      
      <main>
        <section className="video-section">
          <h2>Video Input</h2>
          
          <div className="video-inputs">
            <VideoUploader 
              onVideoSelected={handleVideoSelected} 
              disabled={isUploading || isAnalyzing}
            />
            <VideoRecorder 
              onVideoRecorded={handleVideoSelected} 
              disabled={isUploading || isAnalyzing}
            />
          </div>
          {videoSource && (
            <div className="selected-video">
              <p>Selected: {videoSource}</p>
              {uploadedFilename && <p className="success-message">✓ Upload complete</p>}
            </div>
          )}
        </section>

        <section className="analysis-section">
          <h2>Analysis Options</h2>
          <AnalysisForm 
            onSubmit={handleAnalysisSubmit} 
            isLoading={isAnalyzing} 
            disabled={!uploadedFilename || isUploading || isAnalyzing}
          />
          
          {isUploading && (
            <div className="status-container">
              <h3>Uploading Video</h3>
              <LoadingIndicator progress={uploadProgress} />
            </div>
          )}
          
          {isAnalyzing && (
            <div className="status-container">
              <h3>Analyzing Video</h3>
              <LoadingIndicator />
              <p>This may take a few moments...</p>
            </div>
          )}
          
          {error && (
            <ErrorMessage message={error} />
          )}
        </section>
        
        {results && (
          <section className="results-section">
            <h2>Analysis Results</h2>
            <AnalysisResults results={results} />
          </section>
        )}
      </main>
      
      <footer>
        <p>Emotion Analysis Demo • Bachelor Thesis Project</p>
      </footer>
    </div>
  );
}

export default App;
