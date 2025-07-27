import React, { useState } from 'react';
import VideoUpload from './VideoUpload';
import SRTUpload from './SRTUpload';

const ManualSubtitleSidebar = () => {
  const [selectedVideo, setSelectedVideo] = useState(null);
  const [selectedSRT, setSelectedSRT] = useState(null);
  const [settings, setSettings] = useState({
    fontSize: 24,
    fontColor: 'white',
    outlineColor: 'black',
    outlineWidth: 2,
    hardSub: true
  });

  return (
    <div>
      <div className="mb-6">
        <h3 className="mb-2">Upload Files</h3>
        <p className="text-muted text-sm mb-4">
          Upload your video and SRT subtitle file
        </p>
        
        <div className="mb-4">
          <VideoUpload
            onVideoSelect={setSelectedVideo}
            selectedVideo={selectedVideo}
            onRemove={() => setSelectedVideo(null)}
          />
        </div>

        <SRTUpload
          onSRTSelect={setSelectedSRT}
          selectedSRT={selectedSRT}
          onRemove={() => setSelectedSRT(null)}
        />
      </div>

      <div>
        <h3 className="mb-2">Subtitle Settings</h3>
        <p className="text-muted text-sm mb-4">
          Customize subtitle appearance
        </p>
        
        <div className="space-y-4">
          <div className="form-group">
            <label htmlFor="fontSize">Font Size</label>
            <select
              id="fontSize"
              className="select"
              value={settings.fontSize}
              onChange={(e) => setSettings(prev => ({
                ...prev,
                fontSize: parseInt(e.target.value)
              }))}
            >
              <option value="16">Small</option>
              <option value="20">Medium</option>
              <option value="24">Large</option>
              <option value="28">X-Large</option>
              <option value="32">XX-Large</option>
            </select>
          </div>
          
          <div className="form-group">
            <label htmlFor="fontColor">Font Color</label>
            <select
              id="fontColor"
              className="select"
              value={settings.fontColor}
              onChange={(e) => setSettings(prev => ({
                ...prev,
                fontColor: e.target.value
              }))}
            >
              <option value="white">White</option>
              <option value="black">Black</option>
              <option value="yellow">Yellow</option>
              <option value="red">Red</option>
              <option value="green">Green</option>
              <option value="blue">Blue</option>
            </select>
          </div>
          
          <div className="form-group">
            <label htmlFor="outlineColor">Outline Color</label>
            <select
              id="outlineColor"
              className="select"
              value={settings.outlineColor}
              onChange={(e) => setSettings(prev => ({
                ...prev,
                outlineColor: e.target.value
              }))}
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
              onChange={(e) => setSettings(prev => ({
                ...prev,
                outlineWidth: parseInt(e.target.value)
              }))}
            >
              <option value="0">None</option>
              <option value="1">Thin</option>
              <option value="2">Medium</option>
              <option value="3">Thick</option>
              <option value="4">Extra Thick</option>
            </select>
          </div>
          
          <div className="checkbox-group">
            <input
              id="hardSub"
              type="checkbox"
              checked={settings.hardSub}
              onChange={(e) => setSettings(prev => ({
                ...prev,
                hardSub: e.target.checked
              }))}
            />
            <label htmlFor="hardSub">Hard Subtitles (Burned-in)</label>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ManualSubtitleSidebar;