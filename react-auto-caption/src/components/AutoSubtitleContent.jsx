import React, { useState, useEffect } from 'react';
import { Play, FileText, Video, Download } from 'lucide-react';
import { WhisperService } from '../utils/whisperApi';
import { AudioService } from '../utils/audioUtils';
import { generateSRT } from '../utils/subtitleUtils';

const AutoSubtitleContent = ({ workflow, data, onWorkflowChange }) => {
  const [processing, setProcessing] = useState({
    status: 'idle',
    progress: 0,
    currentStep: '',
    error: null
  });

  const [results, setResults] = useState({
    srtContent: null,
    segments: null,
    processedVideo: null
  });

  const [audioService] = useState(() => new AudioService());

  // Update processing status when workflow changes
  useEffect(() => {
    if (workflow.phase === 'generate-srt' && workflow.processing) {
      startSRTGeneration();
    }
  }, [workflow]);

  const updateProgress = (step, progress) => {
    setProcessing(prev => ({
      ...prev,
      currentStep: step,
      progress
    }));
  };

  const startSRTGeneration = async () => {
    if (!data?.selectedVideo || !data?.settings?.apiKey) {
      setProcessing({
        status: 'error',
        progress: 0,
        currentStep: '',
        error: 'Missing video file or API key'
      });
      return;
    }

    try {
      setProcessing({
        status: 'processing',
        progress: 0,
        currentStep: 'Initializing...',
        error: null
      });

      const whisperService = new WhisperService(data.settings.apiKey, data.settings.baseUrl);
      
      // Step 1: Extract audio from video
      updateProgress('Extracting audio from video...', 20);
      const audioFile = await audioService.extractAudioFromVideo(data.selectedVideo);
      
      // Step 2: Transcribe audio with Whisper
      updateProgress('Transcribing audio with Whisper...', 50);
      const transcriptionResult = await whisperService.transcribeAudio(audioFile, {
        language: data.settings.sourceLanguage === 'auto' ? undefined : data.settings.sourceLanguage
      });

      let segments = transcriptionResult.segments;
      
      // Step 3: Translate if needed
      if (data.settings.targetLanguage !== 'none') {
        updateProgress('Translating text...', 70);
        
        for (let i = 0; i < segments.length; i++) {
          const translatedText = await whisperService.translateText(
            segments[i].text, 
            data.settings.targetLanguage,
            data.settings.translationModel || 'o1-mini'
          );
          segments[i].translatedText = translatedText;
          
          updateProgress(
            `Translating segment ${i + 1}/${segments.length}...`, 
            70 + (i / segments.length) * 25
          );
        }
      }

      // Step 4: Generate SRT
      updateProgress('Generating SRT file...', 95);
      const srtContent = generateSRT(segments, {
        bilingual: data.settings.bilingual && data.settings.targetLanguage !== 'none'
      });

      updateProgress('SRT Generated!', 100);

      setResults({
        srtContent,
        segments,
        processedVideo: null
      });

      setProcessing({
        status: 'completed',
        progress: 100,
        currentStep: 'SRT generated successfully!',
        error: null
      });

      // Update workflow to edit phase
      onWorkflowChange({
        phase: 'edit-srt',
        processing: false
      });

    } catch (error) {
      console.error('SRT generation error:', error);
      
      let errorMessage = error.message;
      if (error.message.includes('audio') || error.message.includes('Audio')) {
        errorMessage = 'Failed to extract audio from video. Please ensure the video file contains audio.';
      } else if (error.message.includes('API') || error.message.includes('transcrib') || error.message.includes('translat')) {
        errorMessage = 'API request failed. Please check your API key and base URL settings.';
      }
      
      setProcessing({
        status: 'error',
        progress: 0,
        currentStep: '',
        error: errorMessage
      });
      
      // Reset workflow to upload phase on error
      onWorkflowChange({
        phase: 'upload',
        processing: false
      });
    }
  };

  const renderUploadPhase = () => {
    const hasVideo = data?.selectedVideo;
    const hasApiKey = data?.settings?.apiKey;
    
    return (
      <div className="flex flex-col items-center justify-center min-h-full text-center">
        <div className="max-w-md">
          <FileText size={48} className="text-muted mx-auto mb-4" />
          <h2 className="mb-2">Ready to Generate Subtitles</h2>
          <p className="text-muted mb-6">
            Upload a video file and configure your settings in the sidebar to begin automatic subtitle generation.
          </p>
          <div className="flex flex-col gap-3 text-sm">
            <div className="flex items-center gap-3">
              <div className={`w-3 h-3 rounded-full ${hasVideo ? 'bg-green-600' : 'bg-gray'}`}></div>
              <span className={hasVideo ? 'text-green-600' : 'text-muted'}>
                {hasVideo ? '✓ Video uploaded' : 'Upload your video file'}
              </span>
            </div>
            <div className="flex items-center gap-3">
              <div className={`w-3 h-3 rounded-full ${hasApiKey ? 'bg-green-600' : 'bg-gray'}`}></div>
              <span className={hasApiKey ? 'text-green-600' : 'text-muted'}>
                {hasApiKey ? '✓ API key configured' : 'Enter your OpenAI API key'}
              </span>
            </div>
            <div className="flex items-center gap-3">
              <div className={`w-3 h-3 rounded-full ${data?.settings ? 'bg-green-600' : 'bg-gray'}`}></div>
              <span className={data?.settings ? 'text-green-600' : 'text-muted'}>
                {data?.settings ? '✓ Language settings configured' : 'Configure language settings'}
              </span>
            </div>
            <div className="flex items-center gap-3">
              <div className={`w-3 h-3 rounded-full ${hasVideo && hasApiKey ? 'bg-green-600' : 'bg-gray'}`}></div>
              <span className={hasVideo && hasApiKey ? 'text-green-600' : 'text-muted'}>
                {hasVideo && hasApiKey ? '✓ Ready to generate' : 'Click Generate to start'}
              </span>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const renderProcessingPhase = () => (
    <div className="card">
      <div className="flex items-center gap-2 mb-4">
        <FileText size={20} />
        <h2>Generating Subtitles</h2>
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

  const handleDownloadSRT = () => {
    if (results.srtContent) {
      const blob = new Blob([results.srtContent], { type: 'text/plain;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'subtitles.srt';
      a.click();
      URL.revokeObjectURL(url);
    }
  };


  const renderEditPhase = () => (
    <div>
      <div className="card mb-4">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <FileText size={20} />
            <h2>Review & Edit Subtitles</h2>
          </div>
          <div className="flex gap-2">
            <button className="button" onClick={handleDownloadSRT}>
              <Download size={16} />
              Download SRT
            </button>
          </div>
        </div>
        
        <div className="status-message status-success">
          <strong>Success!</strong> Your subtitle file is ready for download. You can use any video editing software to embed these subtitles into your video.
        </div>
      </div>

      {/* SRT Content Display */}
      <div className="card">
        <h3 className="mb-3">Subtitle Content</h3>
        <div className="bg-gray p-4 rounded max-h-96 overflow-y-auto">
          <pre className="text-sm whitespace-pre-wrap">{results.srtContent}</pre>
        </div>
        
        <div className="mt-4 p-3 bg-blue-50 rounded border border-blue-200">
          <h4 className="text-blue-800 font-medium mb-2">How to use these subtitles:</h4>
          <ul className="text-blue-700 text-sm space-y-1">
            <li>• Download the SRT file above</li>
            <li>• Use video editing software like DaVinci Resolve, Premiere Pro, or VLC to embed subtitles</li>
            <li>• Most video players support SRT files for soft subtitles</li>
          </ul>
        </div>
      </div>
    </div>
  );


  const renderContent = () => {
    switch (workflow?.phase) {
      case 'upload':
        return renderUploadPhase();
      case 'generate-srt':
        return renderProcessingPhase();
      case 'edit-srt':
        return renderEditPhase();
      default:
        return renderUploadPhase();
    }
  };

  return (
    <div className="h-full">
      {renderContent()}
    </div>
  );
};

export default AutoSubtitleContent;