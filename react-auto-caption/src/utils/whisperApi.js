import OpenAI from 'openai';

export class WhisperService {
  constructor(apiKey, baseURL = 'https://api.openai.com') {
    const normalizedBaseURL = this.normalizeBaseURL(baseURL);
    
    this.client = new OpenAI({
      apiKey,
      baseURL: normalizedBaseURL,
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

  async transcribeAudio(audioFile, options = {}) {
    const {
      model = 'whisper-1',
      language = 'auto',
      responseFormat = 'verbose_json',
      timestampGranularities = ['segment']
    } = options;

    try {
      const transcription = await this.client.audio.transcriptions.create({
        file: audioFile,
        model,
        language: language === 'auto' ? undefined : language,
        response_format: responseFormat,
        timestamp_granularities: timestampGranularities
      });

      return this.formatTranscriptionResult(transcription);
    } catch (error) {
      console.error('Transcription error:', error);
      throw new Error(`Transcription failed: ${error.message}`);
    }
  }

  formatTranscriptionResult(transcription) {
    if (!transcription.segments) {
      return {
        text: transcription.text || '',
        segments: [{
          start: 0,
          end: 0,
          text: transcription.text || ''
        }]
      };
    }

    return {
      text: transcription.text,
      segments: transcription.segments.map(segment => ({
        start: segment.start,
        end: segment.end,
        text: segment.text.trim()
      }))
    };
  }

  async translateText(text, targetLanguage = 'zh', translationModel = 'gpt-3.5-turbo') {
    const languageMap = {
      'zh': 'Chinese',
      'en': 'English',
      'ja': 'Japanese',
      'ko': 'Korean',
      'fr': 'French',
      'de': 'German',
      'es': 'Spanish'
    };

    const targetLang = languageMap[targetLanguage] || 'Chinese';

    try {
      // Different parameters for o1 models vs other models
      const isO1Model = translationModel.startsWith('o1');
      const requestParams = {
        model: translationModel,
        messages: [
          {
            role: 'user',
            content: `Please translate the following text to ${targetLang}. Only return the translated text without any explanations:\n\n${text}`
          }
        ]
      };

      if (isO1Model) {
        // o1 models use max_completion_tokens and don't support temperature
        requestParams.max_completion_tokens = Math.max(50, Math.ceil(text.length * 1.5));
      } else {
        // Other models use max_tokens and support temperature
        requestParams.temperature = 0.3;
        requestParams.max_tokens = Math.max(50, Math.ceil(text.length * 1.5));
      }

      const response = await this.client.chat.completions.create(requestParams);

      return response.choices[0].message.content.trim();
    } catch (error) {
      console.error('Translation error:', error);
      throw new Error(`Translation failed: ${error.message}`);
    }
  }

  async testTranslationModel(modelId) {
    try {
      await this.translateText('Hello world', 'zh', modelId);
      return true;
    } catch (error) {
      console.warn(`Translation model ${modelId} test failed:`, error.message);
      return false;
    }
  }
}