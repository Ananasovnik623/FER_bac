import { useState, useRef } from 'react';

/**
 * Video Uploader Component
 * Provides drag-and-drop and file selector functionality for video uploads
 * 
 * @param {Function} onVideoSelected - Callback when a video file is selected
 * @param {Boolean} disabled - Whether the uploader is disabled
 */
function VideoUploader({ onVideoSelected, disabled }) {
  const fileInputRef = useRef(null);
  const [dragActive, setDragActive] = useState(false);
  
  /**
   * Handle file selection from the file dialog
   */
  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file && file.type.startsWith('video/')) {
      onVideoSelected(file);
    }
  };
  
  /**
   * Handle drag events for visual feedback
   */
  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };
  
  /**
   * Handle file drop event
   */
  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      if (file.type.startsWith('video/')) {
        onVideoSelected(file);
      }
    }
  };
  
  /**
   * Trigger file browser dialog when upload area is clicked
   */
  const handleUploadClick = () => {
    if (!disabled && fileInputRef.current) {
      fileInputRef.current.click();
    }
  };
  
  return (
    <div 
      className={`upload-area ${dragActive ? 'drag-active' : ''}`}
      onClick={handleUploadClick}
      onDragEnter={handleDrag}
      onDragOver={handleDrag}
      onDragLeave={handleDrag}
      onDrop={handleDrop}
      style={{ opacity: disabled ? 0.6 : 1 }}
    >
      <input 
        type="file" 
        ref={fileInputRef}
        onChange={handleFileChange}
        accept="video/*"
        style={{ display: 'none' }}
        disabled={disabled}
      />
      
      <div className="upload-icon">
        <svg xmlns="http://www.w3.org/2000/svg" width="36" height="36" fill="currentColor" viewBox="0 0 16 16">
          <path d="M.5 9.9a.5.5 0 0 1 .5.5v2.5a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1v-2.5a.5.5 0 0 1 1 0v2.5a2 2 0 0 1-2 2H2a2 2 0 0 1-2-2v-2.5a.5.5 0 0 1 .5-.5z"/>
          <path d="M7.646 1.146a.5.5 0 0 1 .708 0l3 3a.5.5 0 0 1-.708.708L8.5 2.707V11.5a.5.5 0 0 1-1 0V2.707L5.354 4.854a.5.5 0 1 1-.708-.708l3-3z"/>
        </svg>
      </div>
      
      <p>
        {dragActive 
          ? 'Drop video here' 
          : 'Click or drag a video file here to upload'
        }
      </p>
      <p className="file-info">
        Supports MP4, WebM, MOV, AVI (max 50MB)
      </p>
    </div>
  );
}

export default VideoUploader;
