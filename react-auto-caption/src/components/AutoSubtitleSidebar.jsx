import React, { useState } from 'react';
import VideoUpload from './VideoUpload';
import SettingsPanel from './SettingsPanel';
import { Play, CheckCircle } from 'lucide-react';

const AutoSubtitleSidebar = ({ onGenerate, canGenerate, onDataChange }) => {
  const [selectedVideo, setSelectedVideo] = useState(null);
  const [settings, setSettings] = useState({
    apiKey: '',
    baseUrl: 'https://api.openai.com',
    sourceLanguage: 'auto',
    targetLanguage: 'zh',
    translationModel: 'o1-mini',
    bilingual: true,
    fontSize: 24,
    fontColor: 'white',
    hardSub: true
  });

  // Initialize parent component with default settings
  React.useEffect(() => {
    if (onDataChange) {
      onDataChange({ selectedVideo: null, settings });
    }
  }, []);

  const handleVideoSelect = (video) => {
    setSelectedVideo(video);
    if (onDataChange) {
      onDataChange({ selectedVideo: video, settings });
    }
  };

  const handleSettingsChange = (newSettings) => {
    setSettings(newSettings);
    if (onDataChange) {
      onDataChange({ selectedVideo, settings: newSettings });
    }
  };

  const isReadyToGenerate = selectedVideo && settings.apiKey;

  return (
    <div>
      <div className="mb-6">
        <h3 className="mb-2">Upload Video</h3>
        <p className="text-muted text-sm mb-4">
          Start by uploading your video file
        </p>
        <VideoUpload
          onVideoSelect={handleVideoSelect}
          selectedVideo={selectedVideo}
          onRemove={() => {
            setSelectedVideo(null);
            if (onDataChange) {
              onDataChange({ selectedVideo: null, settings });
            }
          }}
        />
      </div>

      <div className="mb-6">
        <h3 className="mb-2">Configuration</h3>
        <p className="text-muted text-sm mb-4">
          Configure API settings and subtitle preferences
        </p>
        <SettingsPanel
          settings={settings}
          onSettingsChange={handleSettingsChange}
        />
      </div>

      {/* Generate Button */}
      <div className="mb-6">
        <h3 className="mb-2">Generate Subtitles</h3>
        <p className="text-muted text-sm mb-4">
          Click to start the subtitle generation process
        </p>
        
        <button
          onClick={() => onGenerate && onGenerate()}
          disabled={!isReadyToGenerate}
          className="button w-full"
        >
          <Play size={16} className="mr-2" />
          Generate Subtitles
        </button>
        
        {!selectedVideo && (
          <p className="text-muted text-xs mt-2">
            Please upload a video file first
          </p>
        )}
        
        {selectedVideo && !settings.apiKey && (
          <p className="text-muted text-xs mt-2">
            Please enter your API key in the configuration
          </p>
        )}
        
        {isReadyToGenerate && (
          <div className="flex items-center gap-2 mt-2">
            <CheckCircle size={12} className="text-green-600" />
            <p className="text-green-600 text-xs">Ready to generate</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default AutoSubtitleSidebar;