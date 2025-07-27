import { FFmpeg } from '@ffmpeg/ffmpeg';
import { fetchFile, toBlobURL } from '@ffmpeg/util';

export class FFmpegService {
  constructor() {
    this.ffmpeg = new FFmpeg();
    this.loaded = false;
  }

  async load(onProgress = () => {}) {
    if (this.loaded) return;

    try {
      const baseURL = 'https://unpkg.com/@ffmpeg/core@0.12.6/dist/umd';
      
      // Load FFmpeg core
      await this.ffmpeg.load({
        coreURL: await toBlobURL(`${baseURL}/ffmpeg-core.js`, 'text/javascript'),
        wasmURL: await toBlobURL(`${baseURL}/ffmpeg-core.wasm`, 'application/wasm'),
      });

      this.ffmpeg.on('progress', onProgress);
      this.loaded = true;
      console.log('FFmpeg loaded successfully');
    } catch (error) {
      console.error('Failed to load FFmpeg:', error);
      throw new Error('Failed to load FFmpeg');
    }
  }

  async extractAudio(videoFile) {
    if (!this.loaded) {
      throw new Error('FFmpeg not loaded');
    }

    try {
      const inputName = 'input.mp4';
      const outputName = 'output.wav';

      // Write input file
      await this.ffmpeg.writeFile(inputName, await fetchFile(videoFile));

      // Extract audio
      await this.ffmpeg.exec([
        '-i', inputName,
        '-vn', // No video
        '-acodec', 'pcm_s16le', // PCM 16-bit
        '-ar', '16000', // Sample rate 16kHz
        '-ac', '1', // Mono
        outputName
      ]);

      // Read output file
      const data = await this.ffmpeg.readFile(outputName);
      const audioBlob = new Blob([data.buffer], { type: 'audio/wav' });

      // Clean up
      await this.ffmpeg.deleteFile(inputName);
      await this.ffmpeg.deleteFile(outputName);

      return new File([audioBlob], 'audio.wav', { type: 'audio/wav' });
    } catch (error) {
      console.error('Audio extraction failed:', error);
      throw new Error('Failed to extract audio from video');
    }
  }

  async embedSubtitles(videoFile, srtContent, options = {}) {
    if (!this.loaded) {
      throw new Error('FFmpeg not loaded');
    }

    try {
      const {
        hardSub = true,
        fontSize = 24,
        fontColor = 'white',
        outlineColor = 'black',
        outlineWidth = 2
      } = options;

      const inputName = 'input.mp4';
      const srtName = 'subtitles.srt';
      const outputName = 'output.mp4';

      // Write input files
      await this.ffmpeg.writeFile(inputName, await fetchFile(videoFile));
      await this.ffmpeg.writeFile(srtName, srtContent);

      if (hardSub) {
        // Hard subtitles (burned into video)
        const fontStyle = `FontSize=${fontSize},PrimaryColour=&H${this.colorToHex(fontColor)},OutlineColour=&H${this.colorToHex(outlineColor)},Outline=${outlineWidth}`;
        
        await this.ffmpeg.exec([
          '-i', inputName,
          '-vf', `subtitles=${srtName}:force_style='${fontStyle}'`,
          '-c:a', 'copy',
          outputName
        ]);
      } else {
        // Soft subtitles (separate track)
        await this.ffmpeg.exec([
          '-i', inputName,
          '-i', srtName,
          '-c:v', 'copy',
          '-c:a', 'copy',
          '-c:s', 'mov_text',
          '-metadata:s:s:0', 'language=eng',
          outputName
        ]);
      }

      // Read output file
      const data = await this.ffmpeg.readFile(outputName);
      const videoBlob = new Blob([data.buffer], { type: 'video/mp4' });

      // Clean up
      await this.ffmpeg.deleteFile(inputName);
      await this.ffmpeg.deleteFile(srtName);
      await this.ffmpeg.deleteFile(outputName);

      return videoBlob;
    } catch (error) {
      console.error('Subtitle embedding failed:', error);
      throw new Error('Failed to embed subtitles into video');
    }
  }

  colorToHex(color) {
    const colors = {
      white: 'ffffff',
      black: '000000',
      red: 'ff0000',
      green: '00ff00',
      blue: '0000ff',
      yellow: 'ffff00',
      gray: '808080'
    };
    return colors[color] || 'ffffff';
  }

  async terminate() {
    if (this.loaded) {
      await this.ffmpeg.terminate();
      this.loaded = false;
    }
  }
}