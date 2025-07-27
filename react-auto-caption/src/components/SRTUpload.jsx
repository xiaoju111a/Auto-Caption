import React, { useState, useRef } from 'react';
import { FileText, Upload, X, Eye, Edit3 } from 'lucide-react';

const SRTUpload = ({ onSRTSelect, selectedSRT, onRemove }) => {
  const [dragOver, setDragOver] = useState(false);
  const [srtPreview, setSrtPreview] = useState('');
  const [showPreview, setShowPreview] = useState(false);
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
    const srtFile = files.find(file => 
      file.type === 'text/plain' || 
      file.name.toLowerCase().endsWith('.srt')
    );
    
    if (srtFile) {
      handleSRTFile(srtFile);
    }
  };

  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (file) {
      handleSRTFile(file);
    }
  };

  const handleSRTFile = async (file) => {
    try {
      const content = await file.text();
      if (validateSRT(content)) {
        setSrtPreview(content);
        onSRTSelect({ file, content });
      } else {
        alert('Invalid SRT file format. Please check your file.');
      }
    } catch (error) {
      console.error('Error reading SRT file:', error);
      alert('Error reading SRT file');
    }
  };

  const validateSRT = (content) => {
    // Basic SRT validation
    const lines = content.trim().split('\n');
    if (lines.length < 3) return false;
    
    // Check for basic SRT structure
    const timeRegex = /\d{2}:\d{2}:\d{2},\d{3} --> \d{2}:\d{2}:\d{2},\d{3}/;
    return timeRegex.test(content);
  };

  const handleClick = () => {
    fileInputRef.current?.click();
  };

  const handleRemove = () => {
    setSrtPreview('');
    setShowPreview(false);
    onRemove();
  };

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getSubtitleCount = (content) => {
    if (!content) return 0;
    return content.split(/\n\s*\n/).filter(block => block.trim()).length;
  };

  return (
    <div className="sidebar-card">
      <div className="flex items-center gap-2 mb-3">
        <FileText size={16} />
        <h4>SRT File</h4>
      </div>
      
      {!selectedSRT ? (
        <div
          className={`drag-zone ${dragOver ? 'drag-over' : ''}`}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={handleClick}
        >
          <Upload size={48} style={{ color: '#cbd5e0', marginBottom: '1rem' }} />
          <p style={{ fontSize: '1.2rem', fontWeight: '600', marginBottom: '0.5rem' }}>
            Drop your SRT file here or click to browse
          </p>
          <p style={{ color: '#718096' }}>
            Supports .srt subtitle files
          </p>
          
          <input
            ref={fileInputRef}
            type="file"
            accept=".srt,text/plain"
            onChange={handleFileSelect}
            style={{ display: 'none' }}
          />
        </div>
      ) : (
        <div>
          <div style={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: '1rem', 
            padding: '1rem', 
            background: '#f7fafc', 
            borderRadius: '8px',
            marginBottom: '1rem'
          }}>
            <FileText size={40} style={{ color: '#667eea' }} />
            <div style={{ flex: 1 }}>
              <p style={{ fontWeight: '600', marginBottom: '0.25rem' }}>
                {selectedSRT.file.name}
              </p>
              <p style={{ color: '#718096', fontSize: '0.9rem' }}>
                {formatFileSize(selectedSRT.file.size)} • {getSubtitleCount(selectedSRT.content)} subtitles
              </p>
            </div>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <button
                onClick={() => setShowPreview(!showPreview)}
                className="button button-secondary"
                style={{ padding: '8px', minWidth: 'auto' }}
              >
                <Eye size={20} />
              </button>
              <button
                onClick={handleRemove}
                className="button button-secondary"
                style={{ padding: '8px', minWidth: 'auto' }}
              >
                <X size={20} />
              </button>
            </div>
          </div>
          
          {showPreview && (
            <div style={{ marginTop: '1rem' }}>
              <div style={{ 
                display: 'flex', 
                alignItems: 'center', 
                gap: '0.5rem', 
                marginBottom: '0.5rem' 
              }}>
                <Edit3 size={16} />
                <h4 style={{ margin: 0 }}>SRT Preview</h4>
              </div>
              <div style={{ 
                background: '#f7fafc', 
                padding: '1rem', 
                borderRadius: '8px', 
                maxHeight: '300px', 
                overflow: 'auto',
                fontSize: '0.9rem',
                fontFamily: 'monospace',
                whiteSpace: 'pre-wrap',
                border: '1px solid #e2e8f0'
              }}>
                {srtPreview.slice(0, 1000)}
                {srtPreview.length > 1000 && (
                  <div style={{ 
                    color: '#718096', 
                    fontStyle: 'italic', 
                    marginTop: '1rem' 
                  }}>
                    ... and {srtPreview.length - 1000} more characters
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default SRTUpload;