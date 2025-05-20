import React, { useState } from 'react';
import EmotionChart from './EmotionChart';

/**
 * Analysis Results Component
 * Displays processed emotion analysis results including:
 * - Summary of dominant emotions
 * - Radar chart visualization
 * - Frame-by-frame breakdown (limited to first 10 frames)
 * 
 * @param {Array} results - Array of frame analysis results from the backend
 */
function AnalysisResults({ results }) {
  // Add state for toggling frame analysis visibility
  const [showFrameAnalysis, setShowFrameAnalysis] = useState(false);
  // Track which frames have expanded details
  const [expandedFrames, setExpandedFrames] = useState({});
  
  // Check if we have valid results data
  if (!results || !Array.isArray(results)) {
    return <p>No analysis data available.</p>;
  }

  // Process emotion data from the dominant emotion of each frame
  const totalFrames = results.length;
  const emotionCounts = {};
  
  // Count occurrences of each dominant emotion
  results.forEach(frame => {
    if (frame.emotion) {
      emotionCounts[frame.emotion] = (emotionCounts[frame.emotion] || 0) + 1;
    }
  });
  
  // Convert raw counts to distribution percentages for visualization
  const emotionDistribution = {};
  Object.entries(emotionCounts).forEach(([emotion, count]) => {
    emotionDistribution[emotion] = count / totalFrames;
  });
  
  // Find the dominant emotions (top 3) for the summary section
  const dominantEmotions = Object.entries(emotionCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)
    .map(([name, count]) => ({
      name,
      count,
      percentage: ((count / totalFrames) * 100).toFixed(1)
    }));

  // Toggle details for a specific frame
  const toggleFrameDetails = (frameIndex) => {
    setExpandedFrames(prev => ({
      ...prev, 
      [frameIndex]: !prev[frameIndex]
    }));
  };

  return (
    <div className="analysis-results">
      {/* Summary section with emotions and charts */}
      <div className="summary-section">
        <h3>Emotion Analysis Summary</h3>
        
        {dominantEmotions.length > 0 && (
          <div className="dominant-emotions">
            <h4>Top Emotions Detected</h4>
            <ul className="dominant-list">
              {dominantEmotions.map((emotion, index) => (
                <li key={index} className={`emotion-item emotion-${emotion.name}`}>
                  <span className="emotion-name">{emotion.name}</span>
                  <span className="emotion-percentage">{emotion.percentage}%</span>
                  <div className="emotion-bar" 
                    style={{width: `${emotion.percentage}%`}}></div>
                </li>
              ))}
            </ul>
          </div>
        )}
        
        {/* Radar chart visualization of emotion distribution */}
        <EmotionChart data={emotionDistribution} totalFrames={totalFrames} />
      </div>
      
      {/* Clear separator to ensure toggle appears below charts */}
      <div className="frames-section-toggle">
        <button 
          className="btn toggle-btn"
          onClick={() => setShowFrameAnalysis(!showFrameAnalysis)}
        >
          {showFrameAnalysis ? 'Hide Frame Details' : 'Show Frame-by-Frame Analysis'}
        </button>
      </div>
      
      {/* Only show frames section if toggle is enabled */}
      {showFrameAnalysis && (
        <div className="frames-section">
          <h3>Frame-by-Frame Analysis</h3>
          <div className="frames-list">
            {/* Show only first 10 frames to avoid overwhelming the UI */}
            {results.slice(0, 10).map((frame) => (
              <div key={frame.frame_index} className="frame-card">
                <h4>Frame {frame.frame_index + 1}</h4>
                <p>
                  <strong>Emotion:</strong> {frame.emotion}<br />
                  <strong>Confidence:</strong> {(frame.confidence * 100).toFixed(1)}%
                </p>
                
                {/* If detailed scores are available, add toggle button */}
                {frame.scores && (
                  <div className="frame-details">
                    <button 
                      className="btn btn-small" 
                      onClick={() => toggleFrameDetails(frame.frame_index)}
                    >
                      {expandedFrames[frame.frame_index] ? 'Hide All Emotions' : 'Show All Emotions'}
                    </button>
                    
                    {/* Only show all emotions when toggled */}
                    {expandedFrames[frame.frame_index] && (
                      <div className="emotion-scores">
                        <h5>All Emotions:</h5>
                        <ul>
                          {Object.entries(frame.scores)
                            .sort((a, b) => b[1] - a[1])
                            .map(([emotion, score]) => (
                              <li key={emotion}>
                                {emotion}: {(score * 100).toFixed(1)}%
                              </li>
                            ))}
                        </ul>
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))}
            {results.length > 10 && (
              <p className="more-frames">... and {results.length - 10} more frames</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default AnalysisResults;
