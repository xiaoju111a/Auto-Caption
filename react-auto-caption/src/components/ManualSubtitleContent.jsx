import React, { useState } from 'react';
import { Play, Video, Upload, Download, Info } from 'lucide-react';

const ManualSubtitleContent = () => {
  const [processing, setProcessing] = useState({
    status: 'idle',
    progress: 0,
    currentStep: '',
    error: null
  });

  const renderWaitingState = () => (
    <div className="flex flex-col items-center justify-center min-h-full text-center">
      <div className="max-w-md">
        <Upload size={48} className="text-muted mx-auto mb-4" />
        <h2 className="mb-2">Upload Your Files</h2>
        <p className="text-muted mb-6">
          Upload both a video file and an SRT subtitle file to begin processing.
        </p>
        <div className="flex flex-col gap-2 text-sm text-muted">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-gray rounded-full"></div>
            <span>Upload your video file</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-gray rounded-full"></div>
            <span>Upload your SRT subtitle file</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-gray rounded-full"></div>
            <span>Configure subtitle settings</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-gray rounded-full"></div>
            <span>Click Process to embed subtitles</span>
          </div>
        </div>
      </div>
    </div>
  );

  const renderReadyState = () => (
    <div>
      <div className="card mb-4">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Info size={20} />
            <h2>Subtitle Information</h2>
          </div>
          <button className="button">
            <Play size={16} />
            Embed Subtitles
          </button>
        </div>
        
        <div className="grid grid-2 gap-4 mb-4">
          <div className="bg-gray p-3 rounded">
            <h4 className="mb-1">Video File</h4>
            <p className="text-sm text-muted">sample-video.mp4 (45.2 MB)</p>
          </div>
          <div className="bg-gray p-3 rounded">
            <h4 className="mb-1">Subtitle File</h4>
            <p className="text-sm text-muted">subtitles.srt (156 segments)</p>
          </div>
        </div>

        <div className="grid grid-4 gap-4">
          <div>
            <h4 className="text-sm font-medium mb-1">Segments</h4>
            <p className="text-muted">156 subtitle blocks</p>
          </div>
          <div>
            <h4 className="text-sm font-medium mb-1">Duration</h4>
            <p className="text-muted">00:12:35</p>
          </div>
          <div>
            <h4 className="text-sm font-medium mb-1">Languages</h4>
            <p className="text-muted">English, Chinese</p>
          </div>
          <div>
            <h4 className="text-sm font-medium mb-1">Avg. Length</h4>
            <p className="text-muted">4.8s per segment</p>
          </div>
        </div>
      </div>

      <div className="card">
        <h3 className="mb-3">Subtitle Preview</h3>
        <div className="bg-gray p-4 rounded max-h-64 overflow-y-auto">
          <div className="space-y-3 font-mono text-sm">
            <div>
              <div className="text-xs text-muted">1</div>
              <div className="text-xs text-muted">00:00:01,000 --> 00:00:04,000</div>
              <div>Hello, welcome to our video tutorial</div>
            </div>
            <div>
              <div className="text-xs text-muted">2</div>
              <div className="text-xs text-muted">00:00:05,000 --> 00:00:08,000</div>
              <div>Today we'll learn about video processing</div>
            </div>
            <div>
              <div className="text-xs text-muted">3</div>
              <div className="text-xs text-muted">00:00:09,000 --> 00:00:12,000</div>
              <div>Let's start with the basics</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  const renderProcessingState = () => (
    <div className="card">
      <div className="flex items-center gap-2 mb-4">
        <Video size={20} />
        <h2>Embedding Subtitles</h2>
      </div>
      
      <div className="mb-4">
        <div className="flex justify-between text-sm mb-2">
          <span>{processing.currentStep || 'Processing...'}</span>
          <span>{processing.progress.toFixed(1)}%</span>
        </div>
        <div className="progress-bar">
          <div 
            className="progress-fill" 
            style={{ width: `${processing.progress}%` }}
          />
        </div>
      </div>
      
      {processing.status === 'error' && (
        <div className="status-message status-error">
          <strong>Error:</strong> {processing.error}
        </div>
      )}
    </div>
  );

  const renderCompletedState = () => (
    <div>
      <div className="card mb-4">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Video size={20} />
            <h2>Processing Complete</h2>
          </div>
          <button className="button">
            <Download size={16} />
            Download Video
          </button>
        </div>
        
        <div className="status-message status-success">
          <strong>Success!</strong> Your video with embedded subtitles is ready for download.
        </div>
      </div>

      <div className="card">
        <h3 className="mb-3">Preview</h3>
        <div className="bg-gray p-8 rounded text-center">
          <Video size={48} className="text-muted mx-auto mb-2" />
          <p className="text-muted">Video preview with embedded subtitles</p>
        </div>
      </div>
    </div>
  );

  const renderContent = () => {
    switch (processing.status) {
      case 'idle':
        return renderWaitingState();
      case 'ready':
        return renderReadyState();
      case 'processing':
        return renderProcessingState();
      case 'completed':
        return renderCompletedState();
      default:
        return renderWaitingState();
    }
  };

  return (
    <div className="h-full">
      {renderContent()}
    </div>
  );
};

export default ManualSubtitleContent;