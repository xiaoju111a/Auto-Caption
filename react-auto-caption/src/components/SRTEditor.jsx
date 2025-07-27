import React, { useState, useEffect } from 'react';
import { Edit3, Save, Download, RefreshCw, Eye, EyeOff, Clock, Type } from 'lucide-react';
import { validateSRT, getSRTInfo, parseSRT, generateSRT, downloadSRT } from '../utils/subtitleUtils';

const SRTEditor = ({ 
  srtContent, 
  segments, 
  onSRTChange, 
  onSave, 
  originalVideo,
  className = "" 
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editedContent, setEditedContent] = useState(srtContent || '');
  const [editedSegments, setEditedSegments] = useState(segments || []);
  const [validationError, setValidationError] = useState(null);
  const [activeSegment, setActiveSegment] = useState(null);
  const [showPreview, setShowPreview] = useState(true);

  useEffect(() => {
    if (srtContent) {
      setEditedContent(srtContent);
    }
    if (segments) {
      setEditedSegments([...segments]);
    }
  }, [srtContent, segments]);

  const handleRawSRTChange = (value) => {
    setEditedContent(value);
    
    // Validate the SRT content
    const validation = validateSRT(value);
    if (validation.isValid) {
      setValidationError(null);
      const parsedSegments = parseSRT(value);
      setEditedSegments(parsedSegments);
    } else {
      setValidationError(validation.error);
    }
  };

  const handleSegmentChange = (index, field, value) => {
    const newSegments = [...editedSegments];
    if (field === 'start' || field === 'end') {
      // Parse time format (HH:MM:SS,mmm or just seconds)
      let timeValue = value;
      if (typeof value === 'string' && value.includes(':')) {
        const [time, ms] = value.split(',');
        const [hours, minutes, seconds] = time.split(':').map(Number);
        timeValue = hours * 3600 + minutes * 60 + seconds + (parseInt(ms || '0') / 1000);
      } else {
        timeValue = parseFloat(value) || 0;
      }
      newSegments[index][field] = timeValue;
    } else {
      newSegments[index][field] = value;
    }
    
    setEditedSegments(newSegments);
    
    // Update raw SRT content
    const newSRTContent = generateSRT(newSegments);
    setEditedContent(newSRTContent);
    setValidationError(null);
  };

  const formatTimeForInput = (seconds) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = Math.floor(seconds % 60);
    const milliseconds = Math.floor((seconds % 1) * 1000);
    
    return `${hours.toString().padStart(2, '0')}:${minutes
      .toString()
      .padStart(2, '0')}:${secs.toString().padStart(2, '0')},${milliseconds
      .toString()
      .padStart(3, '0')}`;
  };

  const handleSave = () => {
    if (validationError) {
      alert('Please fix the validation errors before saving');
      return;
    }

    onSRTChange(editedContent, editedSegments);
    if (onSave) {
      onSave(editedContent, editedSegments);
    }
    setIsEditing(false);
  };

  const handleDownload = () => {
    const filename = originalVideo ? 
      `${originalVideo.name.replace(/\.[^/.]+$/, '')}_subtitles.srt` : 
      'edited_subtitles.srt';
    downloadSRT(editedContent, filename);
  };

  const handleReset = () => {
    setEditedContent(srtContent);
    setEditedSegments(segments || []);
    setValidationError(null);
    setIsEditing(false);
  };

  const addNewSegment = () => {
    const lastSegment = editedSegments[editedSegments.length - 1];
    const newStart = lastSegment ? lastSegment.end + 1 : 0;
    const newSegment = {
      index: editedSegments.length + 1,
      start: newStart,
      end: newStart + 3,
      text: 'New subtitle text'
    };
    
    const newSegments = [...editedSegments, newSegment];
    setEditedSegments(newSegments);
    
    const newSRTContent = generateSRT(newSegments);
    setEditedContent(newSRTContent);
  };

  const deleteSegment = (index) => {
    const newSegments = editedSegments.filter((_, i) => i !== index);
    // Reindex segments
    const reindexedSegments = newSegments.map((seg, i) => ({
      ...seg,
      index: i + 1
    }));
    
    setEditedSegments(reindexedSegments);
    
    const newSRTContent = generateSRT(reindexedSegments);
    setEditedContent(newSRTContent);
  };

  const srtInfo = getSRTInfo(editedContent);

  return (
    <div className={`card ${className}`}>
      <div style={{ 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'space-between', 
        marginBottom: '1rem',
        flexWrap: 'wrap',
        gap: '1rem'
      }}>
        <h3 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Edit3 size={20} />
          Subtitle Editor
        </h3>
        
        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
          <button
            onClick={() => setShowPreview(!showPreview)}
            className="button button-secondary"
            style={{ padding: '8px 12px' }}
          >
            {showPreview ? <EyeOff size={16} /> : <Eye size={16} />}
            {showPreview ? 'Hide' : 'Show'} Preview
          </button>
          
          <button
            onClick={handleDownload}
            className="button button-secondary"
            style={{ padding: '8px 12px' }}
          >
            <Download size={16} />
            Download SRT
          </button>
          
          {isEditing ? (
            <>
              <button
                onClick={handleReset}
                className="button button-secondary"
                style={{ padding: '8px 12px' }}
              >
                <RefreshCw size={16} />
                Reset
              </button>
              <button
                onClick={handleSave}
                className="button"
                disabled={!!validationError}
                style={{ padding: '8px 12px' }}
              >
                <Save size={16} />
                Save Changes
              </button>
            </>
          ) : (
            <button
              onClick={() => setIsEditing(true)}
              className="button"
              style={{ padding: '8px 12px' }}
            >
              <Edit3 size={16} />
              Edit Subtitles
            </button>
          )}
        </div>
      </div>

      {/* SRT Info */}
      {srtInfo && (
        <div style={{ 
          background: '#f7fafc', 
          padding: '1rem', 
          borderRadius: '8px', 
          marginBottom: '1rem',
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
          gap: '1rem'
        }}>
          <div>
            <p style={{ fontWeight: '600', marginBottom: '0.25rem', fontSize: '0.9rem' }}>Segments</p>
            <p style={{ color: '#718096', margin: 0 }}>{srtInfo.segmentCount}</p>
          </div>
          <div>
            <p style={{ fontWeight: '600', marginBottom: '0.25rem', fontSize: '0.9rem' }}>Duration</p>
            <p style={{ color: '#718096', margin: 0 }}>{srtInfo.formattedDuration}</p>
          </div>
          <div>
            <p style={{ fontWeight: '600', marginBottom: '0.25rem', fontSize: '0.9rem' }}>Languages</p>
            <p style={{ color: '#718096', margin: 0 }}>{srtInfo.languages.join(', ') || 'Unknown'}</p>
          </div>
        </div>
      )}

      {/* Validation Error */}
      {validationError && (
        <div className="status-message status-error">
          <strong>Validation Error:</strong> {validationError}
        </div>
      )}

      {/* Editor Tabs */}
      <div style={{ marginBottom: '1rem' }}>
        <div style={{ 
          display: 'flex', 
          borderBottom: '2px solid #e2e8f0',
          marginBottom: '1rem'
        }}>
          <button
            onClick={() => setShowPreview(true)}
            style={{
              padding: '0.75rem 1rem',
              border: 'none',
              background: showPreview ? '#667eea' : 'transparent',
              color: showPreview ? 'white' : '#4a5568',
              borderRadius: '8px 8px 0 0',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              fontWeight: '600'
            }}
          >
            <Eye size={16} />
            Visual Editor
          </button>
          <button
            onClick={() => setShowPreview(false)}
            style={{
              padding: '0.75rem 1rem',
              border: 'none',
              background: !showPreview ? '#667eea' : 'transparent',
              color: !showPreview ? 'white' : '#4a5568',
              borderRadius: '8px 8px 0 0',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              fontWeight: '600'
            }}
          >
            <Type size={16} />
            Raw SRT
          </button>
        </div>

        {showPreview ? (
          // Visual Editor
          <div>
            <div style={{ 
              display: 'flex', 
              justifyContent: 'space-between', 
              alignItems: 'center',
              marginBottom: '1rem'
            }}>
              <h4 style={{ margin: 0 }}>Subtitle Segments</h4>
              {isEditing && (
                <button
                  onClick={addNewSegment}
                  className="button button-secondary"
                  style={{ padding: '6px 12px', fontSize: '0.9rem' }}
                >
                  + Add Segment
                </button>
              )}
            </div>
            
            <div style={{ 
              maxHeight: '400px', 
              overflow: 'auto',
              border: '1px solid #e2e8f0',
              borderRadius: '8px'
            }}>
              {editedSegments.map((segment, index) => (
                <div
                  key={index}
                  style={{
                    padding: '1rem',
                    borderBottom: index < editedSegments.length - 1 ? '1px solid #e2e8f0' : 'none',
                    background: activeSegment === index ? '#f7fafc' : 'white'
                  }}
                  onClick={() => setActiveSegment(activeSegment === index ? null : index)}
                >
                  <div style={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    gap: '1rem',
                    marginBottom: '0.5rem'
                  }}>
                    <span style={{ 
                      fontWeight: '600', 
                      color: '#667eea',
                      minWidth: '30px'
                    }}>
                      #{segment.index}
                    </span>
                    
                    {isEditing ? (
                      <>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                          <Clock size={14} />
                          <input
                            type="text"
                            value={formatTimeForInput(segment.start)}
                            onChange={(e) => handleSegmentChange(index, 'start', e.target.value)}
                            style={{ 
                              width: '120px', 
                              padding: '4px 8px',
                              border: '1px solid #e2e8f0',
                              borderRadius: '4px',
                              fontSize: '0.9rem'
                            }}
                          />
                          <span>→</span>
                          <input
                            type="text"
                            value={formatTimeForInput(segment.end)}
                            onChange={(e) => handleSegmentChange(index, 'end', e.target.value)}
                            style={{ 
                              width: '120px', 
                              padding: '4px 8px',
                              border: '1px solid #e2e8f0',
                              borderRadius: '4px',
                              fontSize: '0.9rem'
                            }}
                          />
                        </div>
                        
                        <button
                          onClick={() => deleteSegment(index)}
                          style={{
                            background: '#fed7d7',
                            color: '#e53e3e',
                            border: 'none',
                            borderRadius: '4px',
                            padding: '4px 8px',
                            fontSize: '0.8rem',
                            cursor: 'pointer'
                          }}
                        >
                          Delete
                        </button>
                      </>
                    ) : (
                      <div style={{ 
                        display: 'flex', 
                        alignItems: 'center', 
                        gap: '0.5rem',
                        color: '#718096',
                        fontSize: '0.9rem'
                      }}>
                        <Clock size={14} />
                        {formatTimeForInput(segment.start)} → {formatTimeForInput(segment.end)}
                      </div>
                    )}
                  </div>
                  
                  {isEditing ? (
                    <textarea
                      value={segment.text}
                      onChange={(e) => handleSegmentChange(index, 'text', e.target.value)}
                      style={{
                        width: '100%',
                        minHeight: '60px',
                        padding: '8px',
                        border: '1px solid #e2e8f0',
                        borderRadius: '4px',
                        resize: 'vertical',
                        fontFamily: 'inherit'
                      }}
                    />
                  ) : (
                    <p style={{ 
                      margin: 0, 
                      whiteSpace: 'pre-wrap',
                      lineHeight: '1.5'
                    }}>
                      {segment.text}
                    </p>
                  )}
                </div>
              ))}
            </div>
          </div>
        ) : (
          // Raw SRT Editor
          <div>
            <textarea
              value={editedContent}
              onChange={(e) => handleRawSRTChange(e.target.value)}
              readOnly={!isEditing}
              style={{
                width: '100%',
                height: '400px',
                padding: '1rem',
                border: '1px solid #e2e8f0',
                borderRadius: '8px',
                fontFamily: 'monospace',
                fontSize: '0.9rem',
                resize: 'vertical',
                background: isEditing ? 'white' : '#f7fafc'
              }}
              placeholder="SRT content will appear here..."
            />
          </div>
        )}
      </div>
    </div>
  );
};

export default SRTEditor;