import React, { useState } from 'react';
import { Radar } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  RadialLinearScale,
  PointElement,
  LineElement,
  Filler,
  Tooltip,
  Legend,
} from 'chart.js';
import ChartDataLabels from 'chartjs-plugin-datalabels';

// Register required Chart.js components
ChartJS.register(
  RadialLinearScale,
  PointElement,
  LineElement,
  Filler,
  Tooltip,
  Legend,
  ChartDataLabels
);

// All emotions that should always be displayed in this specific order
// This order is important to prevent visual wrapping issues
const ALL_EMOTIONS = [
  "happy", "surprise", "neutral", "contempt", 
  "angry", "disgust", "fear", "sad"
];

/**
 * Emotion Chart Component
 * Displays a radar chart visualization of emotion distribution
 * 
 * @param {Object} data - Emotion distribution data (emotion: percentage)
 * @param {Number} totalFrames - Total number of analyzed frames
 */
function EmotionChart({ data, totalFrames }) {
  // Add state for toggling chart visibility
  const [showStandardChart, setShowStandardChart] = useState(true);
  const [showEnhancedChart, setShowEnhancedChart] = useState(false);
  
  // Ensure all emotions exist in data
  const completeData = { ...data };
  ALL_EMOTIONS.forEach(emotion => {
    if (!(emotion in completeData)) {
      completeData[emotion] = 0;
    }
  });
  
  // Calculate maximum value for scale (with 10% padding)
  const maxValue = Math.max(...Object.values(completeData)) * 1.1 || 1;
  
  // Standard chart data
  const chartData = {
    labels: ALL_EMOTIONS,
    datasets: [
      {
        label: 'Emotion Distribution',
        data: ALL_EMOTIONS.map(emotion => completeData[emotion]),
        backgroundColor: 'rgba(54, 162, 235, 0.4)',
        borderColor: 'rgba(54, 162, 235, 1)',
        borderWidth: 1,
        pointBackgroundColor: 'rgba(54, 162, 235, 1)',
        pointBorderColor: '#fff',
        pointHoverBackgroundColor: '#fff',
        pointHoverBorderColor: 'rgba(54, 162, 235, 1)',
        fill: true,
        totalFrames: totalFrames, // Store for tooltip use
      },
    ],
  };
  
  // Better transformation for logarithmic scale that prevents wrapping
  // Using a square root transformation instead of log for better visualization
  const transformedData = {};
  ALL_EMOTIONS.forEach(emotion => {
    // Square root transformation maintains zero values as zero
    // and emphasizes small values without making them too prominent
    transformedData[emotion] = Math.sqrt(completeData[emotion]);
  });
  
  const maxTransformedValue = Math.max(...Object.values(transformedData)) * 1.1 || 1;
  
  // Transformed scale chart data
  const transformedChartData = {
    labels: ALL_EMOTIONS,
    datasets: [
      {
        label: 'Enhanced Scale',
        data: ALL_EMOTIONS.map(emotion => transformedData[emotion]),
        backgroundColor: 'rgba(255, 99, 132, 0.4)',
        borderColor: 'rgba(255, 99, 132, 1)',
        borderWidth: 1,
        pointBackgroundColor: 'rgba(255, 99, 132, 1)',
        pointBorderColor: '#fff',
        pointHoverBackgroundColor: '#fff',
        pointHoverBorderColor: 'rgba(255, 99, 132, 1)',
        fill: true,
        // Store original values for tooltip and data labels
        originalValues: ALL_EMOTIONS.map(emotion => completeData[emotion]),
        totalFrames: totalFrames,
      },
    ],
  };
  
  // Standard chart options
  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    scales: {
      r: {
        beginAtZero: true,
        min: 0,
        max: maxValue,
        ticks: {
          stepSize: Math.max(maxValue / 5, 0.01),
          font: { size: 12 },
          backdropColor: 'rgba(255, 255, 255, 0.8)',
          backdropPadding: 2,
          callback: (value) => (value * 100).toFixed(0) + '%'
        },
        grid: {
          color: '#e0e0e0',
          borderDash: [3, 3],
        },
        angleLines: {
          color: '#e0e0e0',
        },
        pointLabels: {
          font: { size: 14 },
          color: '#333',
        }
      }
    },
    plugins: {
      legend: {
        position: 'top',
        align: 'center',
      },
      tooltip: {
        callbacks: {
          label: (context) => {
            const value = context.raw;
            const percentage = (value * 100).toFixed(1) + '%';
            const count = Math.round(value * context.dataset.totalFrames);
            return `${context.label}: ${percentage} (${count} frames)`;
          }
        }
      },
      datalabels: {
        formatter: (value) => (value > 0.01 ? (value * 100).toFixed(0) + '%' : ''),
        color: '#000',
        anchor: 'end',
        align: 'end',
        offset: 8,
        font: {
          size: 10,
          weight: 'bold'
        },
        backgroundColor: 'rgba(255, 255, 255, 0.7)',
        borderRadius: 3,
        padding: {
          top: 2,
          bottom: 2,
          left: 4,
          right: 4
        },
        display: (context) => context.dataset.data[context.dataIndex] > 0.01
      }
    }
  };
  
  // Enhanced scale chart options
  const transformedChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    scales: {
      r: {
        beginAtZero: true,
        min: 0,
        max: maxTransformedValue,
        ticks: {
          font: { size: 12 },
          backdropColor: 'rgba(255, 255, 255, 0.8)',
          backdropPadding: 2,
          display: false // Hide numeric labels on this chart
        },
        grid: {
          color: '#e0e0e0',
          borderDash: [3, 3],
        },
        angleLines: {
          color: '#e0e0e0',
        },
        pointLabels: {
          font: { size: 14 },
          color: '#333',
        }
      }
    },
    plugins: {
      legend: {
        position: 'top',
        align: 'center',
      },
      tooltip: {
        callbacks: {
          label: (context) => {
            const originalValue = context.dataset.originalValues[context.dataIndex];
            const percentage = (originalValue * 100).toFixed(1) + '%';
            const count = Math.round(originalValue * context.dataset.totalFrames);
            return `${context.label}: ${percentage} (${count} frames)`;
          }
        }
      },
      datalabels: {
        formatter: (value, context) => {
          const originalValue = context.dataset.originalValues[context.dataIndex];
          return originalValue > 0 ? (originalValue * 100).toFixed(1) + '%' : '';
        },
        color: '#000',
        anchor: 'end',
        align: 'end',
        offset: 8,
        font: {
          size: 10,
          weight: 'bold'
        },
        backgroundColor: 'rgba(255, 255, 255, 0.7)',
        borderRadius: 3,
        padding: {
          top: 2,
          bottom: 2,
          left: 4,
          right: 4
        },
        display: (context) => context.dataset.originalValues[context.dataIndex] > 0
      }
    }
  };

  return (
    <div className="emotion-charts">
      {/* Chart toggle buttons */}
      <div className="chart-toggles">
        <button 
          className="btn toggle-btn btn-small"
          onClick={() => setShowStandardChart(!showStandardChart)}
        >
          {showStandardChart ? 'Hide Standard Chart' : 'Show Standard Chart'}
        </button>
        <button 
          className="btn toggle-btn btn-small"
          onClick={() => setShowEnhancedChart(!showEnhancedChart)}
        >
          {showEnhancedChart ? 'Hide Enhanced Scale' : 'Show Enhanced Scale'}
        </button>
      </div>
      
      {/* Standard chart with reduced height */}
      {showStandardChart && (
        <div className="chart-container">
          <h4>Emotion Distribution</h4>
          <Radar data={chartData} options={chartOptions} />
        </div>
      )}
      
      {/* Enhanced scale chart with reduced height */}
      {showEnhancedChart && (
        <div className="chart-container">
          <h4>Emotion Distribution (Enhanced Scale)</h4>
          <p className="chart-description">
            Enhanced scale helps visualize less frequent emotions that would 
            otherwise appear too small on the standard chart.
          </p>
          <Radar data={transformedChartData} options={transformedChartOptions} />
        </div>
      )}
    </div>
  );
}

export default EmotionChart;
