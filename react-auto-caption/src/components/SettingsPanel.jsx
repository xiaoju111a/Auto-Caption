import React from 'react';
import { Settings, Key, Globe, Palette } from 'lucide-react';
import ModelSelector from './ModelSelector';

const SettingsPanel = ({ settings, onSettingsChange }) => {
  const handleChange = (key, value) => {
    onSettingsChange({
      ...settings,
      [key]: value
    });
  };

  return (
    <div className="sidebar-card">
      
      <div className="space-y-6">
        {/* API Configuration */}
        <div>
          <div className="flex items-center gap-2 mb-3">
            <Key size={16} />
            <h4>API Configuration</h4>
          </div>
          
          <div className="form-group">
            <label htmlFor="apiKey">API Key</label>
            <input
              id="apiKey"
              type="password"
              className="input"
              value={settings.apiKey}
              onChange={(e) => handleChange('apiKey', e.target.value)}
              placeholder="sk-..."
            />
          </div>
          
          <div className="form-group">
            <label htmlFor="baseUrl">Base URL</label>
            <input
              id="baseUrl"
              type="url"
              className="input"
              value={settings.baseUrl}
              onChange={(e) => handleChange('baseUrl', e.target.value)}
              placeholder="https://api.openai.com"
            />
          </div>
        </div>

        {/* Language Settings */}
        <div>
          <div className="flex items-center gap-2 mb-3">
            <Globe size={16} />
            <h4>Language</h4>
          </div>
          
          <div className="form-group">
            <label htmlFor="sourceLanguage">Source</label>
            <select
              id="sourceLanguage"
              className="select"
              value={settings.sourceLanguage}
              onChange={(e) => handleChange('sourceLanguage', e.target.value)}
            >
              <option value="auto">Auto Detect</option>
              <option value="en">English</option>
              <option value="zh">Chinese</option>
              <option value="ja">Japanese</option>
              <option value="ko">Korean</option>
              <option value="fr">French</option>
              <option value="de">German</option>
              <option value="es">Spanish</option>
            </select>
          </div>
          
          <div className="form-group">
            <label htmlFor="targetLanguage">Target</label>
            <select
              id="targetLanguage"
              className="select"
              value={settings.targetLanguage}
              onChange={(e) => handleChange('targetLanguage', e.target.value)}
            >
              <option value="none">No Translation</option>
              <option value="zh">Chinese</option>
              <option value="en">English</option>
              <option value="ja">Japanese</option>
              <option value="ko">Korean</option>
              <option value="fr">French</option>
              <option value="de">German</option>
              <option value="es">Spanish</option>
            </select>
          </div>
          
          <div className="checkbox-group mb-3">
            <input
              id="bilingual"
              type="checkbox"
              checked={settings.bilingual}
              onChange={(e) => handleChange('bilingual', e.target.checked)}
              disabled={settings.targetLanguage === 'none'}
            />
            <label htmlFor="bilingual">Bilingual</label>
          </div>

          <ModelSelector
            apiKey={settings.apiKey}
            baseUrl={settings.baseUrl}
            selectedModel={settings.translationModel}
            onModelSelect={(model) => handleChange('translationModel', model)}
            type="chat"
            disabled={settings.targetLanguage === 'none'}
          />
        </div>

        {/* Subtitle Settings */}
        <div>
          <div className="flex items-center gap-2 mb-3">
            <Palette size={16} />
            <h4>Subtitles</h4>
          </div>
          
          <div className="form-group">
            <label htmlFor="fontSize">Font Size</label>
            <select
              id="fontSize"
              className="select"
              value={settings.fontSize}
              onChange={(e) => handleChange('fontSize', parseInt(e.target.value))}
            >
              <option value="16">Small</option>
              <option value="20">Medium</option>
              <option value="24">Large</option>
              <option value="28">X-Large</option>
            </select>
          </div>
          
          <div className="form-group">
            <label htmlFor="fontColor">Color</label>
            <select
              id="fontColor"
              className="select"
              value={settings.fontColor}
              onChange={(e) => handleChange('fontColor', e.target.value)}
            >
              <option value="white">White</option>
              <option value="black">Black</option>
              <option value="yellow">Yellow</option>
              <option value="red">Red</option>
            </select>
          </div>
          
          <div className="checkbox-group">
            <input
              id="hardSub"
              type="checkbox"
              checked={settings.hardSub}
              onChange={(e) => handleChange('hardSub', e.target.checked)}
            />
            <label htmlFor="hardSub">Burned-in</label>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SettingsPanel;