import OpenAI from 'openai';

export class ModelDetectionService {
  constructor(apiKey, baseURL = 'https://api.openai.com') {
    this.apiKey = apiKey;
    this.baseURL = this.normalizeBaseURL(baseURL);
    
    this.client = new OpenAI({
      apiKey,
      baseURL: this.baseURL,
      dangerouslyAllowBrowser: true
    });
  }

  normalizeBaseURL(baseURL) {
    if (!baseURL) return 'https://api.openai.com/v1';
    
    // Remove trailing slash
    let normalized = baseURL.replace(/\/$/, '');
    
    // Add /v1 if not present
    if (!normalized.endsWith('/v1')) {
      normalized += '/v1';
    }
    
    return normalized;
  }

  async detectAvailableModels() {
    try {
      const response = await this.client.models.list();
      const models = response.data || [];
      
      return this.categorizeModels(models);
    } catch (error) {
      console.warn('Failed to fetch models from API:', error);
      return this.getFallbackModels();
    }
  }

  categorizeModels(models) {
    const chatModels = [];
    const whisperModels = [];
    const allModels = [];

    models.forEach(model => {
      const modelId = model.id;
      allModels.push({
        id: modelId,
        name: this.getDisplayName(modelId),
        category: this.getModelCategory(modelId)
      });

      // Categorize for specific use cases
      if (this.isChatModel(modelId)) {
        chatModels.push({
          id: modelId,
          name: this.getDisplayName(modelId),
          capabilities: this.getModelCapabilities(modelId)
        });
      }

      if (this.isWhisperModel(modelId)) {
        whisperModels.push({
          id: modelId,
          name: this.getDisplayName(modelId)
        });
      }
    });

    // Sort by preference
    chatModels.sort((a, b) => this.getModelPriority(a.id) - this.getModelPriority(b.id));

    return {
      chat: chatModels.length > 0 ? chatModels : this.getFallbackChatModels(),
      whisper: whisperModels.length > 0 ? whisperModels : this.getFallbackWhisperModels(),
      all: allModels
    };
  }

  isChatModel(modelId) {
    const chatPatterns = [
      /^gpt-/,
      /^o1-/,
      /^claude-/,
      /^llama/i,
      /^qwen/i,
      /^yi-/,
      /^baichuan/i,
      /^chatglm/i,
      /^internlm/i,
      /^deepseek/i,
      /^mistral/i,
      /^mixtral/i,
      /^gemma/i,
      /^phi-/i
    ];

    return chatPatterns.some(pattern => pattern.test(modelId)) &&
           !this.isWhisperModel(modelId);
  }

  isWhisperModel(modelId) {
    return modelId.includes('whisper');
  }

  getModelCategory(modelId) {
    if (this.isWhisperModel(modelId)) return 'audio';
    if (this.isChatModel(modelId)) return 'chat';
    if (modelId.includes('embedding')) return 'embedding';
    if (modelId.includes('tts') || modelId.includes('speech')) return 'speech';
    if (modelId.includes('vision') || modelId.includes('image')) return 'vision';
    return 'other';
  }

  getDisplayName(modelId) {
    const displayNames = {
      'gpt-3.5-turbo': 'GPT-3.5 Turbo',
      'gpt-4': 'GPT-4',
      'gpt-4-turbo': 'GPT-4 Turbo',
      'gpt-4o': 'GPT-4o',
      'gpt-4o-mini': 'GPT-4o Mini',
      'o1-preview': 'O1 Preview',
      'o1-mini': 'O1 Mini',
      'whisper-1': 'Whisper'
    };

    return displayNames[modelId] || this.formatModelName(modelId);
  }

  formatModelName(modelId) {
    return modelId
      .replace(/-/g, ' ')
      .replace(/\b\w/g, l => l.toUpperCase())
      .replace(/\d+/g, match => ` ${match}`)
      .trim();
  }

  getModelCapabilities(modelId) {
    const capabilities = {
      reasoning: false,
      coding: false,
      multimodal: false,
      fast: false,
      cost_effective: false
    };

    // O1 models - reasoning
    if (modelId.includes('o1')) {
      capabilities.reasoning = true;
      if (modelId.includes('mini')) {
        capabilities.cost_effective = true;
        capabilities.fast = true;
      }
    }

    // GPT-4 models
    if (modelId.includes('gpt-4')) {
      capabilities.coding = true;
      if (modelId.includes('turbo') || modelId.includes('4o')) {
        capabilities.fast = true;
      }
      if (modelId.includes('vision') || modelId.includes('4o')) {
        capabilities.multimodal = true;
      }
    }

    // GPT-3.5 - cost effective and fast
    if (modelId.includes('gpt-3.5')) {
      capabilities.fast = true;
      capabilities.cost_effective = true;
    }

    return capabilities;
  }

  getModelPriority(modelId) {
    const priorities = {
      'o1-mini': 1,
      'gpt-4o-mini': 2,
      'gpt-4o': 3,
      'gpt-4-turbo': 4,
      'gpt-4': 5,
      'gpt-3.5-turbo': 6,
      'o1-preview': 7
    };

    return priorities[modelId] || 100;
  }

  getFallbackModels() {
    return {
      chat: this.getFallbackChatModels(),
      whisper: this.getFallbackWhisperModels(),
      all: []
    };
  }

  getFallbackChatModels() {
    const isOpenAI = this.baseURL.includes('openai.com');
    
    if (isOpenAI) {
      return [
        { id: 'gpt-4o-mini', name: 'GPT-4o Mini', type: 'chat' },
        { id: 'gpt-4o', name: 'GPT-4o', type: 'chat' },
        { id: 'gpt-4-turbo', name: 'GPT-4 Turbo', type: 'chat' },
        { id: 'gpt-3.5-turbo', name: 'GPT-3.5 Turbo', type: 'chat' },
        { id: 'o1-mini', name: 'O1 Mini', type: 'chat' },
        { id: 'o1-preview', name: 'O1 Preview', type: 'chat' }
      ];
    } else {
      // Generic fallback for other providers
      return [
        { id: 'gpt-3.5-turbo', name: 'GPT-3.5 Turbo', type: 'chat' },
        { id: 'gpt-4', name: 'GPT-4', type: 'chat' },
        { id: 'gpt-4o-mini', name: 'GPT-4o Mini', type: 'chat' }
      ];
    }
  }

  getFallbackWhisperModels() {
    return [
      { id: 'whisper-1', name: 'Whisper', type: 'whisper' }
    ];
  }

  getRecommendedTranslationModel(models) {
    // Priority order for translation tasks
    const translationPreference = [
      'o1-mini',        // Good reasoning for context-aware translation
      'gpt-4o-mini',    // Fast and cost-effective
      'gpt-4o',         // High quality
      'gpt-4-turbo',    // Good balance
      'gpt-3.5-turbo'   // Fallback
    ];

    for (const preferred of translationPreference) {
      const model = models.find(m => m.id === preferred);
      if (model) return model;
    }

    // Return first available model if no preferred model found
    return models.length > 0 ? models[0] : { id: 'gpt-3.5-turbo', name: 'GPT-3.5 Turbo' };
  }

  async testModelAvailability(modelId) {
    try {
      await this.client.chat.completions.create({
        model: modelId,
        messages: [{ role: 'user', content: 'test' }],
        max_tokens: 1
      });
      return true;
    } catch (error) {
      console.warn(`Model ${modelId} not available:`, error.message);
      return false;
    }
  }

  getProviderInfo() {
    const url = this.baseURL.toLowerCase();
    
    if (url.includes('openai.com')) {
      return { name: 'OpenAI', official: true };
    } else if (url.includes('anthropic.com')) {
      return { name: 'Anthropic', official: true };
    } else if (url.includes('together.xyz') || url.includes('together.ai')) {
      return { name: 'Together AI', official: false };
    } else if (url.includes('deepseek.com')) {
      return { name: 'DeepSeek', official: false };
    } else if (url.includes('moonshot.cn')) {
      return { name: 'Moonshot AI', official: false };
    } else if (url.includes('zhipuai.cn')) {
      return { name: 'ZhipuAI', official: false };
    } else {
      return { name: 'Custom Provider', official: false };
    }
  }
}