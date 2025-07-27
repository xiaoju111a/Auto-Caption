import React from 'react';
import { AlertCircle, CheckCircle, Clock, Download } from 'lucide-react';

const ProcessingStatus = ({ 
  status, 
  progress, 
  currentStep, 
  error, 
  onDownloadSRT, 
  onDownloadVideo,
  srtContent,
  processedVideo 
}) => {
  const getStatusIcon = () => {
    switch (status) {
      case 'processing':
        return <Clock size={24} style={{ color: '#667eea' }} />;
      case 'completed':
        return <CheckCircle size={24} style={{ color: '#38a169' }} />;
      case 'error':
        return <AlertCircle size={24} style={{ color: '#e53e3e' }} />;
      default:
        return null;
    }
  };

  const getStatusMessage = () => {
    switch (status) {
      case 'processing':
        return currentStep || 'Processing...';
      case 'completed':
        return 'Processing completed successfully!';
      case 'error':
        return error || 'An error occurred during processing';
      default:
        return '';
    }
  };

  const getStatusClass = () => {
    switch (status) {
      case 'processing':
        return 'status-info';
      case 'completed':
        return 'status-success';
      case 'error':
        return 'status-error';
      default:
        return '';
    }
  };

  if (status === 'idle') return null;

  return (
    <div className="card">
      <div className={`status-message ${getStatusClass()}`}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
          {getStatusIcon()}
          <span style={{ fontWeight: '600' }}>{getStatusMessage()}</span>
        </div>
        
        {status === 'processing' && (
          <div style={{ marginBottom: '1rem' }}>
            <div className="progress-bar">
              <div 
                className="progress-fill" 
                style={{ width: `${progress}%` }}
              />
            </div>
            <p style={{ fontSize: '0.9rem', marginTop: '0.5rem', textAlign: 'center' }}>
              {progress.toFixed(1)}%
            </p>
          </div>
        )}
        
        {status === 'completed' && (
          <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
            {srtContent && (
              <button
                onClick={onDownloadSRT}
                className="button"
                style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}
              >
                <Download size={20} />
                Download SRT
              </button>
            )}
            
            {processedVideo && (
              <button
                onClick={onDownloadVideo}
                className="button"
                style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}
              >
                <Download size={20} />
                Download Video
              </button>
            )}
          </div>
        )}
      </div>
      
      {status === 'completed' && srtContent && (
        <div style={{ marginTop: '1rem' }}>
          <h4>Generated Subtitles Preview:</h4>
          <div style={{ 
            background: '#f7fafc', 
            padding: '1rem', 
            borderRadius: '8px', 
            maxHeight: '200px', 
            overflow: 'auto',
            fontSize: '0.9rem',
            fontFamily: 'monospace',
            whiteSpace: 'pre-wrap'
          }}>
            {srtContent.slice(0, 500)}
            {srtContent.length > 500 && '...'}
          </div>
        </div>
      )}
    </div>
  );
};

export default ProcessingStatus;