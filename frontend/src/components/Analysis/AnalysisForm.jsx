import { useState } from 'react';

function AnalysisForm({ onSubmit, isLoading, disabled }) {
  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit();
  };
  
  return (
    <form onSubmit={handleSubmit} className="analysis-form">
      <p>Click the button below to analyze emotions from uploaded video.</p>
      
      <button 
        type="submit" 
        disabled={isLoading || disabled}
        className="btn analyze-btn"
      >
        {isLoading ? 'Analyzing...' : 'Analyze Video'}
      </button>
    </form>
  );
}

export default AnalysisForm;
