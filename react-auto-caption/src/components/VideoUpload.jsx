import React, { useState, useRef } from 'react';
import { Upload, Video, X } from 'lucide-react';

const VideoUpload = ({ onVideoSelect, selectedVideo, onRemove }) => {
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef(null);

  const handleDragOver = (e) => {
    e.preventDefault();
    setDragOver(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    setDragOver(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragOver(false);
    
    const files = Array.from(e.dataTransfer.files);
    const videoFile = files.find(file => file.type.startsWith('video/'));
    
    if (videoFile) {
      onVideoSelect(videoFile);
    }
  };

  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (file && file.type.startsWith('video/')) {
      onVideoSelect(file);
    }
  };

  const handleClick = () => {
    fileInputRef.current?.click();
  };

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <div className="sidebar-card">
      <div className="flex items-center gap-2 mb-3">
        <Video size={16} />
        <h4>Video File</h4>
      </div>
      
      {!selectedVideo ? (
        <div
          className={`drag-zone ${dragOver ? 'drag-over' : ''}`}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={handleClick}
        >
          <Upload size={32} className="text-muted mb-3" />
          <h4 className="mb-2">Drop your video here or click to browse</h4>
          <p className="text-muted text-sm">
            Supports MP4, MOV, AVI, and other video formats
          </p>
          
          <input
            ref={fileInputRef}
            type="file"
            accept="video/*"
            onChange={handleFileSelect}
            style={{ display: 'none' }}
          />
        </div>
      ) : (
        <div className="flex items-center gap-3 p-3 bg-gray rounded">
          <Video size={24} />
          <div className="flex-1">
            <p className="font-medium mb-1">{selectedVideo.name}</p>
            <p className="text-muted text-sm">{formatFileSize(selectedVideo.size)}</p>
          </div>
          <button
            onClick={onRemove}
            className="button-secondary p-2"
          >
            <X size={16} />
          </button>
        </div>
      )}
      
      {selectedVideo && (
        <div className="mt-4">
          <video
            src={URL.createObjectURL(selectedVideo)}
            controls
            className="video-preview w-full rounded"
            style={{ maxHeight: '300px' }}
          />
        </div>
      )}
    </div>
  );
};

export default VideoUpload;