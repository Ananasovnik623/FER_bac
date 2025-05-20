function LoadingIndicator({ progress }) {
  return (
    <div className="loading-indicator">
      {progress !== undefined ? (
        <div className="progress-container">
          <div className="progress-text">
            {progress < 100 ? "Uploading..." : "Processing..."}
          </div>
          <div className="progress-bar-container">
            <div 
              className="progress-bar-fill" 
              style={{ width: `${progress}%` }} 
            />
          </div>
          <div className="progress-percentage">{progress}%</div>
        </div>
      ) : (
        <div className="spinner">
          <div className="spinner-inner"></div>
          <div className="loading-text">Loading...</div>
        </div>
      )}
    </div>
  );
}

export default LoadingIndicator;
