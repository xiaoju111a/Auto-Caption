import React, { useState, useCallback } from 'react';
import VideoUpload from './VideoUpload';
import SRTUpload from './SRTUpload';
import ProcessingStatus from './ProcessingStatus';
import { FFmpegService } from '../utils/ffmpegUtils';
import { validateSRT, getSRTInfo } from '../utils/subtitleUtils';
import { Play, Settings, Info } from 'lucide-react';

const ManualSubtitleMode = () => {
  const [selectedVideo, setSelectedVideo] = useState(null);
  const [selectedSRT, setSelectedSRT] = useState(null);
  const [srtInfo, setSrtInfo] = useState(null);
  
  const [settings, setSettings] = useState({
    fontSize: 24,
    fontColor: 'white',
    outlineColor: 'black',
    outlineWidth: 2,
    hardSub: true
  });
  
  const [processing, setProcessing] = useState({
    status: 'idle',
    progress: 0,
    currentStep: '',
    error: null
  });
  
  const [results, setResults] = useState({
    processedVideo: null
  });

  const [ffmpegService] = useState(() => new FFmpegService());

  const updateProgress = useCallback((step, progress) => {
    setProcessing(prev => ({
      ...prev,
      currentStep: step,
      progress
    }));
  }, []);

  const handleSRTSelect = (srtData) => {
    setSelectedSRT(srtData);
    
    // Validate and get SRT info
    const validation = validateSRT(srtData.content);
    if (validation.isValid) {
      const info = getSRTInfo(srtData.content);
      setSrtInfo(info);
    } else {
      setSrtInfo(null);
      alert(`SRT validation failed: ${validation.error}`);
    }
  };

  const handleSRTRemove = () => {
    setSelectedSRT(null);
    setSrtInfo(null);
    resetProcessing();
  };

  const handleVideoRemove = () => {
    setSelectedVideo(null);
    resetProcessing();
  };

  const resetProcessing = () => {
    setProcessing({
      status: 'idle',
      progress: 0,
      currentStep: '',
      error: null
    });
    setResults({
      processedVideo: null
    });
  };

  const processVideoWithSubtitles = async () => {
    if (!selectedVideo || !selectedSRT) {
      alert('Please select both a video file and an SRT file');
      return;
    }

    setProcessing({
      status: 'processing',
      progress: 0,
      currentStep: 'Initializing...',
      error: null
    });

    setResults({
      processedVideo: null
    });

    try {
      // Step 1: Load FFmpeg
      updateProgress('Loading FFmpeg...', 10);
      await ffmpegService.load((progress) => {
        updateProgress('Loading FFmpeg...', 10 + (progress.ratio || 0) * 20);
      });

      // Step 2: Validate SRT content
      updateProgress('Validating subtitles...', 30);
      const validation = validateSRT(selectedSRT.content);
      if (!validation.isValid) {
        throw new Error(`Invalid SRT file: ${validation.error}`);
      }

      // Step 3: Embed subtitles
      updateProgress('Embedding subtitles into video...', 50);
      const processedVideoBlob = await ffmpegService.embedSubtitles(
        selectedVideo,
        selectedSRT.content,
        {
          hardSub: settings.hardSub,
          fontSize: settings.fontSize,
          fontColor: settings.fontColor,
          outlineColor: settings.outlineColor,
          outlineWidth: settings.outlineWidth
        }
      );

      updateProgress('Completed!', 100);

      setResults({
        processedVideo: processedVideoBlob
      });

      setProcessing(prev => ({
        ...prev,
        status: 'completed'
      }));

    } catch (error) {
      console.error('Processing error:', error);
      setProcessing(prev => ({
        ...prev,
        status: 'error',
        error: error.message
      }));
    }
  };

  const handleDownloadVideo = () => {
    if (results.processedVideo) {
      const url = URL.createObjectURL(results.processedVideo);
      const link = document.createElement('a');
      link.href = url;
      link.download = selectedVideo ? 
        `${selectedVideo.name.replace(/\.[^/.]+$/, '')}_with_subtitles.mp4` : 
        'video_with_subtitles.mp4';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    }
  };

  const handleSettingsChange = (key, value) => {
    setSettings(prev => ({
      ...prev,
      [key]: value
    }));
  };

  return (
    <div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem', marginBottom: '2rem' }}>
        <VideoUpload
          onVideoSelect={setSelectedVideo}
          selectedVideo={selectedVideo}
          onRemove={handleVideoRemove}
        />
        
        <SRTUpload
          onSRTSelect={handleSRTSelect}
          selectedSRT={selectedSRT}
          onRemove={handleSRTRemove}
        />
      </div>

      {/* SRT Info Display */}
      {srtInfo && (
        <div className="card">
          <h3 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
            <Info size={20} />
            Subtitle Information
          </h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
            <div>
              <p style={{ fontWeight: '600', marginBottom: '0.25rem' }}>Segments</p>
              <p style={{ color: '#718096' }}>{srtInfo.segmentCount} subtitle blocks</p>
            </div>
            <div>
              <p style={{ fontWeight: '600', marginBottom: '0.25rem' }}>Duration</p>
              <p style={{ color: '#718096' }}>{srtInfo.formattedDuration}</p>
            </div>
            <div>
              <p style={{ fontWeight: '600', marginBottom: '0.25rem' }}>Languages</p>
              <p style={{ color: '#718096' }}>{srtInfo.languages.join(', ') || 'Unknown'}</p>
            </div>
            <div>
              <p style={{ fontWeight: '600', marginBottom: '0.25rem' }}>Avg. Segment Length</p>
              <p style={{ color: '#718096' }}>{srtInfo.averageSegmentLength.toFixed(1)}s</p>
            </div>
          </div>
        </div>
      )}

      {/* Subtitle Settings */}
      <div className="card">
        <h3 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
          <Settings size={20} />
          Subtitle Settings
        </h3>
        
        <div className="settings-grid">
          <div>
            <div className="form-group">
              <label htmlFor="fontSize">Font Size</label>
              <select
                id="fontSize"
                className="select"
                value={settings.fontSize}
                onChange={(e) => handleSettingsChange('fontSize', parseInt(e.target.value))}
              >
                <option value="16">Small (16px)</option>
                <option value="20">Medium (20px)</option>
                <option value="24">Large (24px)</option>
                <option value="28">Extra Large (28px)</option>
                <option value="32">Huge (32px)</option>
              </select>
            </div>
            
            <div className="form-group">
              <label htmlFor="fontColor">Font Color</label>
              <select
                id="fontColor"
                className="select"
                value={settings.fontColor}
                onChange={(e) => handleSettingsChange('fontColor', e.target.value)}
              >
                <option value="white">White</option>
                <option value="black">Black</option>
                <option value="yellow">Yellow</option>
                <option value="red">Red</option>
                <option value="green">Green</option>
                <option value="blue">Blue</option>
              </select>
            </div>
          </div>

          <div>
            <div className="form-group">
              <label htmlFor="outlineColor">Outline Color</label>
              <select
                id="outlineColor"
                className="select"
                value={settings.outlineColor}
                onChange={(e) => handleSettingsChange('outlineColor', e.target.value)}
              >
                <option value="black">Black</option>
                <option value="white">White</option>
                <option value="gray">Gray</option>
              </select>
            </div>
            
            <div className="form-group">
              <label htmlFor="outlineWidth">Outline Width</label>
              <select
                id="outlineWidth"
                className="select"
                value={settings.outlineWidth}
                onChange={(e) => handleSettingsChange('outlineWidth', parseInt(e.target.value))}
              >
                <option value="0">None</option>
                <option value="1">Thin (1px)</option>
                <option value="2">Medium (2px)</option>
                <option value="3">Thick (3px)</option>
                <option value="4">Extra Thick (4px)</option>
              </select>
            </div>
          </div>

          <div>
            <div className="checkbox-group">
              <input
                id="hardSub"
                type="checkbox"
                checked={settings.hardSub}
                onChange={(e) => handleSettingsChange('hardSub', e.target.checked)}
              />
              <label htmlFor="hardSub">Hard Subtitles (Burned-in)</label>
            </div>
            <p style={{ fontSize: '0.9rem', color: '#718096', marginTop: '0.5rem' }}>
              Hard subtitles are permanently embedded into the video and cannot be turned off.
              Soft subtitles are stored as a separate track and can be toggled on/off.
            </p>
          </div>
        </div>
      </div>

      {/* Process Button */}
      <div className="card">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
          <h2>Embed Subtitles</h2>
          <div style={{ display: 'flex', gap: '1rem' }}>
            <button
              onClick={processVideoWithSubtitles}
              className="button"
              disabled={!selectedVideo || !selectedSRT || processing.status === 'processing'}
              style={{ 
                opacity: (!selectedVideo || !selectedSRT || processing.status === 'processing') ? 0.5 : 1,
                cursor: (!selectedVideo || !selectedSRT || processing.status === 'processing') ? 'not-allowed' : 'pointer'
              }}
            >
              <Play size={20} style={{ marginRight: '0.5rem' }} />
              {processing.status === 'processing' ? 'Processing...' : 'Embed Subtitles'}
            </button>
            
            {(processing.status === 'completed' || processing.status === 'error') && (
              <button
                onClick={resetProcessing}
                className="button button-secondary"
              >
                Reset
              </button>
            )}
          </div>
        </div>
        
        {/* Debug info */}
        <div style={{ fontSize: '12px', color: '#666', marginTop: '0.5rem' }}>
          Debug: Video={selectedVideo ? '✓' : '✗'}, SRT={selectedSRT ? '✓' : '✗'}, Status={processing.status}
        </div>
        
        {(!selectedVideo || !selectedSRT) && (
          <p style={{ color: '#718096', marginTop: '1rem' }}>
            Please upload both a video file and an SRT subtitle file to begin processing.
          </p>
        )}
        
        {selectedVideo && selectedSRT && (
          <p style={{ color: '#38a169', marginTop: '1rem', fontWeight: '600' }}>
            ✅ Ready to process! Click "Embed Subtitles" to start.
          </p>
        )}
      </div>

      {/* Processing Status */}
      <ProcessingStatus
        status={processing.status}
        progress={processing.progress}
        currentStep={processing.currentStep}
        error={processing.error}
        onDownloadVideo={handleDownloadVideo}
        processedVideo={results.processedVideo}
      />

      {/* Preview */}
      {results.processedVideo && (
        <div className="card">
          <h3>Preview Video with Subtitles</h3>
          <video
            src={URL.createObjectURL(results.processedVideo)}
            controls
            className="video-preview"
            style={{ width: '100%', maxHeight: '400px' }}
          />
        </div>
      )}
    </div>
  );
};

export default ManualSubtitleMode;