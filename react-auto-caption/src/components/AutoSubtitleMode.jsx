import React, { useState, useCallback } from 'react';
import VideoUpload from './VideoUpload';
import SettingsPanel from './SettingsPanel';
import ProcessingStatus from './ProcessingStatus';
import SRTEditor from './SRTEditor';
import { WhisperService } from '../utils/whisperApi';
import { FFmpegService } from '../utils/ffmpegUtils';
import { generateSRT, downloadSRT } from '../utils/subtitleUtils';
import { Play, Pause, FileText, Video } from 'lucide-react';

const AutoSubtitleMode = () => {
  const [selectedVideo, setSelectedVideo] = useState(null);
  const [settings, setSettings] = useState({
    apiKey: '',
    baseUrl: 'https://api.openai.com/v1',
    sourceLanguage: 'auto',
    targetLanguage: 'zh',
    translationModel: 'o1-mini',
    bilingual: true,
    fontSize: 24,
    fontColor: 'white',
    hardSub: true
  });
  
  const [processing, setProcessing] = useState({
    status: 'idle', // idle, generating-srt, srt-ready, embedding-video, completed, error
    progress: 0,
    currentStep: '',
    error: null
  });
  
  const [results, setResults] = useState({
    srtContent: null,
    processedVideo: null,
    segments: null
  });

  const [workflow, setWorkflow] = useState({
    phase: 'upload', // upload, generate-srt, edit-srt, embed-video, completed
    srtGenerated: false,
    srtApproved: false
  });

  const [ffmpegService] = useState(() => new FFmpegService());

  const updateProgress = useCallback((step, progress) => {
    setProcessing(prev => ({
      ...prev,
      currentStep: step,
      progress
    }));
  }, []);

  // Phase 1: Generate SRT from video
  const generateSRTFromVideo = async () => {
    if (!selectedVideo || !settings.apiKey) {
      alert('Please select a video and enter your OpenAI API key');
      return;
    }

    setProcessing({
      status: 'generating-srt',
      progress: 0,
      currentStep: 'Initializing...',
      error: null
    });

    try {
      const whisperService = new WhisperService(settings.apiKey, settings.baseUrl);
      
      updateProgress('Loading FFmpeg...', 10);
      await ffmpegService.load((progress) => {
        updateProgress('Loading FFmpeg...', 10 + (progress.ratio || 0) * 10);
      });

      updateProgress('Extracting audio from video...', 20);
      const audioFile = await ffmpegService.extractAudio(selectedVideo);
      
      updateProgress('Transcribing audio with Whisper...', 50);
      const transcriptionResult = await whisperService.transcribeAudio(audioFile, {
        language: settings.sourceLanguage === 'auto' ? undefined : settings.sourceLanguage
      });

      let segments = transcriptionResult.segments;
      
      if (settings.targetLanguage !== 'none') {
        updateProgress('Translating text...', 70);
        console.log('Starting translation with settings:', {
          targetLanguage: settings.targetLanguage,
          translationModel: settings.translationModel,
          bilingual: settings.bilingual
        });
        
        for (let i = 0; i < segments.length; i++) {
          try {
            const translatedText = await whisperService.translateText(
              segments[i].text, 
              settings.targetLanguage,
              settings.translationModel || 'o1-mini'
            );
            segments[i].translatedText = translatedText;
            
            console.log(`Segment ${i + 1} translation:`, {
              original: segments[i].text,
              translated: translatedText
            });
          } catch (error) {
            console.error(`Translation failed for segment ${i + 1}:`, error);
            segments[i].translatedText = `[Translation failed: ${error.message}]`;
          }
          
          updateProgress(
            `Translating segment ${i + 1}/${segments.length}...`, 
            70 + (i / segments.length) * 25
          );
        }
      }

      updateProgress('Generating SRT file...', 95);
      const srtContent = generateSRT(segments, {
        bilingual: settings.bilingual && settings.targetLanguage !== 'none'
      });
      
      console.log('Generated SRT with options:', {
        bilingual: settings.bilingual && settings.targetLanguage !== 'none',
        targetLanguage: settings.targetLanguage,
        segmentCount: segments.length,
        hasTranslations: segments.some(s => s.translatedText)
      });

      updateProgress('SRT Generated!', 100);

      setResults(prev => ({
        ...prev,
        srtContent,
        segments
      }));

      setWorkflow({
        phase: 'edit-srt',
        srtGenerated: true,
        srtApproved: false
      });

      setProcessing({
        status: 'srt-ready',
        progress: 100,
        currentStep: 'SRT generated successfully! Review and edit if needed.',
        error: null
      });

    } catch (error) {
      console.error('SRT generation error:', error);
      setProcessing({
        status: 'error',
        progress: 0,
        currentStep: '',
        error: error.message
      });
    }
  };

  // Phase 2: Embed SRT into video
  const embedSubtitles = async (finalSRTContent = null) => {
    const srtToEmbed = finalSRTContent || results.srtContent;
    
    if (!selectedVideo || !srtToEmbed) {
      alert('Missing video or SRT content');
      return;
    }

    setProcessing({
      status: 'embedding-video',
      progress: 0,
      currentStep: 'Preparing to embed subtitles...',
      error: null
    });

    try {
      updateProgress('Loading FFmpeg...', 10);
      if (!ffmpegService.loaded) {
        await ffmpegService.load((progress) => {
          updateProgress('Loading FFmpeg...', 10 + (progress.ratio || 0) * 20);
        });
      }

      updateProgress('Embedding subtitles into video...', 40);
      const processedVideoBlob = await ffmpegService.embedSubtitles(
        selectedVideo,
        srtToEmbed,
        {
          hardSub: settings.hardSub,
          fontSize: settings.fontSize,
          fontColor: settings.fontColor
        }
      );

      updateProgress('Video processing completed!', 100);

      setResults(prev => ({
        ...prev,
        srtContent: srtToEmbed,
        processedVideo: processedVideoBlob
      }));

      setWorkflow({
        phase: 'completed',
        srtGenerated: true,
        srtApproved: true
      });

      setProcessing({
        status: 'completed',
        progress: 100,
        currentStep: 'Video with subtitles ready for download!',
        error: null
      });

    } catch (error) {
      console.error('Video embedding error:', error);
      setProcessing({
        status: 'error',
        progress: 0,
        currentStep: '',
        error: error.message
      });
    }
  };

  const handleDownloadSRT = () => {
    if (results.srtContent) {
      const filename = selectedVideo ? 
        `${selectedVideo.name.replace(/\.[^/.]+$/, '')}_subtitles.srt` : 
        'subtitles.srt';
      downloadSRT(results.srtContent, filename);
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

  const handleSRTChange = (newSRTContent, newSegments) => {
    setResults(prev => ({
      ...prev,
      srtContent: newSRTContent,
      segments: newSegments
    }));
  };

  const handleSRTApprove = () => {
    setWorkflow(prev => ({
      ...prev,
      srtApproved: true
    }));
  };

  const resetProcessing = () => {
    setProcessing({
      status: 'idle',
      progress: 0,
      currentStep: '',
      error: null
    });
    setResults({
      srtContent: null,
      processedVideo: null,
      segments: null
    });
    setWorkflow({
      phase: 'upload',
      srtGenerated: false,
      srtApproved: false
    });
  };

  return (
    <div>
      {/* Step 1: Video Upload and Settings */}
      {workflow.phase === 'upload' && (
        <>
          <VideoUpload
            onVideoSelect={setSelectedVideo}
            selectedVideo={selectedVideo}
            onRemove={() => {
              setSelectedVideo(null);
              resetProcessing();
            }}
          />

          <SettingsPanel
            settings={settings}
            onSettingsChange={setSettings}
          />

          <div className="card">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <FileText size={20} />
                <h2>Generate Subtitles</h2>
              </div>
              <div className="flex gap-2">
                {processing.status === 'generating-srt' ? (
                  <button className="button" disabled>
                    <Pause size={16} />
                    Generating...
                  </button>
                ) : (
                  <button
                    onClick={generateSRTFromVideo}
                    className="button"
                    disabled={!selectedVideo || !settings.apiKey}
                  >
                    <Play size={16} />
                    Generate SRT
                  </button>
                )}
                
                {processing.status === 'error' && (
                  <button
                    onClick={resetProcessing}
                    className="button-secondary"
                  >
                    Reset
                  </button>
                )}
              </div>
            </div>
            
            {!selectedVideo && (
              <p className="text-muted">
                Please upload a video file to begin subtitle generation.
              </p>
            )}
            
            {!settings.apiKey && selectedVideo && (
              <p className="text-red-600">
                Please enter your OpenAI API key in the settings to proceed.
              </p>
            )}
          </div>

          <ProcessingStatus
            status={processing.status}
            progress={processing.progress}
            currentStep={processing.currentStep}
            error={processing.error}
          />
        </>
      )}

      {/* Step 2: SRT Editing */}
      {workflow.phase === 'edit-srt' && workflow.srtGenerated && (
        <>
          <div className="card">
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
              <h2 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <FileText size={24} />
                Review & Edit Subtitles
              </h2>
              <div style={{ display: 'flex', gap: '1rem' }}>
                <button
                  onClick={() => embedSubtitles()}
                  className="button"
                  disabled={processing.status === 'embedding-video'}
                >
                  <Video size={20} style={{ marginRight: '0.5rem' }} />
                  {processing.status === 'embedding-video' ? 'Embedding...' : 'Embed into Video'}
                </button>
                
                <button
                  onClick={resetProcessing}
                  className="button button-secondary"
                >
                  Start Over
                </button>
              </div>
            </div>
            
            <p style={{ color: '#718096', marginTop: '1rem' }}>
              Review the generated subtitles below. You can edit the text, adjust timing, or add/remove segments before embedding them into your video.
            </p>
          </div>

          <SRTEditor
            srtContent={results.srtContent}
            segments={results.segments}
            onSRTChange={handleSRTChange}
            originalVideo={selectedVideo}
          />

          <ProcessingStatus
            status={processing.status}
            progress={processing.progress}
            currentStep={processing.currentStep}
            error={processing.error}
          />
        </>
      )}

      {/* Step 3: Completed */}
      {workflow.phase === 'completed' && (
        <>
          <div className="card">
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
              <h2 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Video size={24} />
                Video Processing Complete
              </h2>
              <button
                onClick={resetProcessing}
                className="button button-secondary"
              >
                Process Another Video
              </button>
            </div>
            
            <p style={{ color: '#38a169', marginTop: '1rem', fontWeight: '600' }}>
              ✅ Your video with embedded subtitles is ready for download!
            </p>
          </div>

          <ProcessingStatus
            status={processing.status}
            progress={processing.progress}
            currentStep={processing.currentStep}
            error={processing.error}
            onDownloadSRT={handleDownloadSRT}
            onDownloadVideo={handleDownloadVideo}
            srtContent={results.srtContent}
            processedVideo={results.processedVideo}
          />

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
        </>
      )}
    </div>
  );
};

export default AutoSubtitleMode;