import React, { useState } from 'react';
import AutoSubtitleSidebar from './components/AutoSubtitleSidebar';
import AutoSubtitleContent from './components/AutoSubtitleContent';
import ManualSubtitleSidebar from './components/ManualSubtitleSidebar';
import ManualSubtitleContent from './components/ManualSubtitleContent';
import { Bot, Upload } from 'lucide-react';

function App() {
  const [activeTab, setActiveTab] = useState('auto'); // 'auto' or 'manual'
  
  // Auto generation state
  const [autoData, setAutoData] = useState({
    selectedVideo: null,
    settings: null
  });
  
  const [autoWorkflow, setAutoWorkflow] = useState({
    phase: 'upload', // upload, generate-srt, edit-srt
    processing: false
  });

  const handleAutoGenerate = () => {
    if (autoData.selectedVideo && autoData.settings?.apiKey) {
      setAutoWorkflow({
        phase: 'generate-srt',
        processing: true
      });
    }
  };

  return (
    <div className="container">
      {/* Header */}
      <header className="header">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="mb-1">Auto Caption</h1>
            <p className="text-muted text-sm">AI-powered video subtitle generation</p>
          </div>
          
          {/* Tab Navigation in Header */}
          <div className="flex gap-1 bg-gray p-1 rounded">
            <button
              onClick={() => setActiveTab('auto')}
              className={`flex items-center gap-2 px-3 py-2 rounded text-sm font-medium transition-all ${
                activeTab === 'auto' 
                  ? 'bg-white text-black shadow-sm' 
                  : 'text-muted hover:text-black'
              }`}
            >
              <Bot size={14} />
              AI Generate
            </button>
            <button
              onClick={() => setActiveTab('manual')}
              className={`flex items-center gap-2 px-3 py-2 rounded text-sm font-medium transition-all ${
                activeTab === 'manual' 
                  ? 'bg-white text-black shadow-sm' 
                  : 'text-muted hover:text-black'
              }`}
            >
              <Upload size={14} />
              Upload SRT
            </button>
          </div>
        </div>
      </header>

      {/* Main Layout */}
      <div className="main-content">
        {/* Sidebar */}
        <div className="sidebar">
          {activeTab === 'auto' ? (
            <AutoSubtitleSidebar 
              onGenerate={handleAutoGenerate}
              onDataChange={setAutoData}
            />
          ) : (
            <ManualSubtitleSidebar />
          )}
        </div>

        {/* Content Area */}
        <div className="content-area">
          {activeTab === 'auto' ? (
            <AutoSubtitleContent 
              workflow={autoWorkflow}
              data={autoData}
              onWorkflowChange={setAutoWorkflow}
            />
          ) : (
            <ManualSubtitleContent />
          )}
        </div>
      </div>
    </div>
  );
}

export default App;