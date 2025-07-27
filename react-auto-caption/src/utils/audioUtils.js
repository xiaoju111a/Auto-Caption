export class AudioService {
  constructor() {
    this.audioContext = null;
  }

  async extractAudioFromVideo(videoFile) {
    try {
      // Create audio context
      this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
      
      // Read video file as array buffer
      const arrayBuffer = await videoFile.arrayBuffer();
      
      // Decode audio data
      const audioBuffer = await this.audioContext.decodeAudioData(arrayBuffer);
      
      // Convert to WAV format
      const wavFile = this.audioBufferToWav(audioBuffer);
      
      return new File([wavFile], 'audio.wav', { type: 'audio/wav' });
    } catch (error) {
      console.error('Error extracting audio:', error);
      throw new Error(`Audio extraction failed: ${error.message}`);
    }
  }

  audioBufferToWav(audioBuffer) {
    const numChannels = audioBuffer.numberOfChannels;
    const sampleRate = audioBuffer.sampleRate;
    const format = 1; // PCM
    const bitDepth = 16;
    
    const channels = [];
    for (let i = 0; i < numChannels; i++) {
      channels.push(audioBuffer.getChannelData(i));
    }
    
    const interleaved = this.interleave(channels);
    const dataLength = interleaved.length * (bitDepth / 8);
    const headerLength = 44;
    const totalLength = headerLength + dataLength;
    
    const arrayBuffer = new ArrayBuffer(totalLength);
    const view = new DataView(arrayBuffer);
    
    // WAV header
    const writeString = (offset, string) => {
      for (let i = 0; i < string.length; i++) {
        view.setUint8(offset + i, string.charCodeAt(i));
      }
    };
    
    writeString(0, 'RIFF');
    view.setUint32(4, totalLength - 8, true);
    writeString(8, 'WAVE');
    writeString(12, 'fmt ');
    view.setUint32(16, 16, true);
    view.setUint16(20, format, true);
    view.setUint16(22, numChannels, true);
    view.setUint32(24, sampleRate, true);
    view.setUint32(28, sampleRate * numChannels * (bitDepth / 8), true);
    view.setUint16(32, numChannels * (bitDepth / 8), true);
    view.setUint16(34, bitDepth, true);
    writeString(36, 'data');
    view.setUint32(40, dataLength, true);
    
    // Convert samples to 16-bit PCM
    let offset = 44;
    for (let i = 0; i < interleaved.length; i++) {
      const sample = Math.max(-1, Math.min(1, interleaved[i]));
      view.setInt16(offset, sample < 0 ? sample * 0x8000 : sample * 0x7FFF, true);
      offset += 2;
    }
    
    return arrayBuffer;
  }

  interleave(channels) {
    const length = channels[0].length;
    const numChannels = channels.length;
    const interleaved = new Float32Array(length * numChannels);
    
    for (let i = 0; i < length; i++) {
      for (let channel = 0; channel < numChannels; channel++) {
        interleaved[i * numChannels + channel] = channels[channel][i];
      }
    }
    
    return interleaved;
  }

  async getVideoInfo(videoFile) {
    return new Promise((resolve, reject) => {
      const video = document.createElement('video');
      video.preload = 'metadata';
      
      video.onloadedmetadata = () => {
        resolve({
          duration: video.duration,
          videoWidth: video.videoWidth,
          videoHeight: video.videoHeight,
          size: videoFile.size,
          name: videoFile.name,
          type: videoFile.type
        });
        
        URL.revokeObjectURL(video.src);
      };
      
      video.onerror = () => {
        reject(new Error('Failed to load video metadata'));
        URL.revokeObjectURL(video.src);
      };
      
      video.src = URL.createObjectURL(videoFile);
    });
  }

  cleanup() {
    if (this.audioContext) {
      this.audioContext.close();
      this.audioContext = null;
    }
  }
}