import React, { useState, useEffect } from 'react';
import { RefreshCw, Cpu, Zap, DollarSign, Brain, Eye, AlertCircle, CheckCircle, Loader } from 'lucide-react';
import { ModelDetectionService } from '../utils/modelDetection';

const ModelSelector = ({ 
  apiKey, 
  baseUrl, 
  selectedModel, 
  onModelSelect, 
  type = 'chat', // 'chat' or 'whisper'
  disabled = false 
}) => {
  const [models, setModels] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [providerInfo, setProviderInfo] = useState(null);
  const [lastFetch, setLastFetch] = useState(null);

  const detectModels = async (showLoading = true) => {
    if (!apiKey || !baseUrl) {
      setModels([]);
      setError('API key and base URL required');
      return;
    }

    if (showLoading) setLoading(true);
    setError(null);

    try {
      const detectionService = new ModelDetectionService(apiKey, baseUrl);
      const detectedModels = await detectionService.detectAvailableModels();
      
      const relevantModels = type === 'whisper' ? detectedModels.whisper : detectedModels.chat;
      setModels(relevantModels);
      setProviderInfo(detectionService.getProviderInfo());
      setLastFetch(new Date());

      // Auto-select recommended model if none selected
      if (!selectedModel && relevantModels.length > 0) {
        const recommended = type === 'whisper' 
          ? relevantModels[0] 
          : detectionService.getRecommendedTranslationModel(relevantModels);
        onModelSelect(recommended.id);
      }

    } catch (err) {
      console.error('Model detection failed:', err);
      setError(`Failed to detect models: ${err.message}`);
      
      // Use fallback models
      const detectionService = new ModelDetectionService(apiKey, baseUrl);
      const fallbackModels = detectionService.getFallbackModels();
      const relevantModels = type === 'whisper' ? fallbackModels.whisper : fallbackModels.chat;
      setModels(relevantModels);
      
    } finally {
      if (showLoading) setLoading(false);
    }
  };

  useEffect(() => {
    if (apiKey && baseUrl) {
      detectModels();
    }
  }, [apiKey, baseUrl, type]);

  const handleRefresh = () => {
    detectModels(true);
  };

  const getCapabilityIcon = (capability) => {
    const icons = {
      reasoning: <Brain size={14} title="Advanced Reasoning" />,
      coding: <Cpu size={14} title="Code Generation" />,
      multimodal: <Eye size={14} title="Vision Capabilities" />,
      fast: <Zap size={14} title="Fast Response" />,
      cost_effective: <DollarSign size={14} title="Cost Effective" />
    };
    return icons[capability];
  };

  const formatLastFetch = (date) => {
    const now = new Date();
    const diff = now - date;
    const minutes = Math.floor(diff / 60000);
    
    if (minutes < 1) return 'just now';
    if (minutes === 1) return '1 minute ago';
    if (minutes < 60) return `${minutes} minutes ago`;
    
    const hours = Math.floor(minutes / 60);
    if (hours === 1) return '1 hour ago';
    return `${hours} hours ago`;
  };

  if (disabled) {
    return (
      <div className="form-group">
        <label>Translation Model</label>
        <div style={{ 
          padding: '12px',
          background: '#f7fafc',
          border: '2px solid #e2e8f0',
          borderRadius: '8px',
          color: '#718096',
          fontSize: '0.9rem'
        }}>
          Model selection disabled (no translation selected)
        </div>
      </div>
    );
  }

  return (
    <div className="form-group">
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
        <label>
          {type === 'whisper' ? 'Whisper Model' : 'Translation Model'}
        </label>
        
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          {providerInfo && (
            <span style={{ 
              fontSize: '0.8rem', 
              color: '#718096',
              display: 'flex',
              alignItems: 'center',
              gap: '0.25rem'
            }}>
              {providerInfo.official ? <CheckCircle size={12} color="#38a169" /> : <AlertCircle size={12} color="#f56565" />}
              {providerInfo.name}
            </span>
          )}
          
          {lastFetch && (
            <span style={{ 
              fontSize: '0.8rem', 
              color: '#a0aec0' 
            }}>
              {formatLastFetch(lastFetch)}
            </span>
          )}
          
          <button
            type="button"
            onClick={handleRefresh}
            disabled={loading || !apiKey || !baseUrl}
            style={{
              background: 'none',
              border: 'none',
              color: '#667eea',
              cursor: 'pointer',
              padding: '4px',
              borderRadius: '4px',
              display: 'flex',
              alignItems: 'center'
            }}
            title="Refresh model list"
          >
            {loading ? <Loader size={14} className="spinning" /> : <RefreshCw size={14} />}
          </button>
        </div>
      </div>

      {error && (
        <div style={{ 
          padding: '8px 12px',
          background: '#fed7d7',
          color: '#e53e3e',
          borderRadius: '6px',
          fontSize: '0.9rem',
          marginBottom: '0.5rem',
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem'
        }}>
          <AlertCircle size={14} />
          {error}
        </div>
      )}

      <select
        className="select"
        value={selectedModel || ''}
        onChange={(e) => onModelSelect(e.target.value)}
        disabled={loading || models.length === 0}
      >
        {models.length === 0 ? (
          <option value="">
            {loading ? 'Loading models...' : 'No models available'}
          </option>
        ) : (
          <>
            {!selectedModel && (
              <option value="">Select a model</option>
            )}
            {models.map((model) => (
              <option key={model.id} value={model.id}>
                {model.name}
              </option>
            ))}
          </>
        )}
      </select>

      {/* Model capabilities display */}
      {selectedModel && models.length > 0 && (
        <div style={{ marginTop: '0.5rem' }}>
          {(() => {
            const model = models.find(m => m.id === selectedModel);
            if (model && model.capabilities && type === 'chat') {
              const activeCapabilities = Object.entries(model.capabilities)
                .filter(([_, active]) => active)
                .map(([capability, _]) => capability);

              if (activeCapabilities.length > 0) {
                return (
                  <div style={{ 
                    display: 'flex', 
                    gap: '0.5rem', 
                    alignItems: 'center',
                    fontSize: '0.8rem',
                    color: '#718096'
                  }}>
                    <span>Capabilities:</span>
                    {activeCapabilities.map(capability => (
                      <span key={capability} style={{ 
                        display: 'flex', 
                        alignItems: 'center', 
                        gap: '0.25rem',
                        background: '#e2e8f0',
                        padding: '2px 6px',
                        borderRadius: '12px'
                      }}>
                        {getCapabilityIcon(capability)}
                        {capability.replace('_', ' ')}
                      </span>
                    ))}
                  </div>
                );
              }
            }
            return null;
          })()}
        </div>
      )}

      {/* Helper text */}
      <p style={{ 
        fontSize: '0.8rem', 
        color: '#a0aec0', 
        marginTop: '0.5rem',
        marginBottom: 0 
      }}>
        {type === 'whisper' 
          ? 'Whisper models are used for speech-to-text transcription'
          : 'Translation model is used to translate subtitles to the target language'
        }
      </p>
    </div>
  );
};

export default ModelSelector;