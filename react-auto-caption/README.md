# Auto Caption - React Video Subtitle Generator

A React application that automatically generates subtitles for videos using OpenAI's Whisper API and embeds them using FFmpeg.

## Features

- 🎥 **Video Upload**: Drag & drop or click to upload video files
- 🎤 **Speech Recognition**: Uses OpenAI Whisper API for accurate transcription
- 🌍 **Multi-language Support**: Auto-detect source language and translate to target language
- 📝 **Subtitle Generation**: Creates SRT subtitle files
- 🎨 **Customizable Subtitles**: Adjustable font size, color, and style
- 💾 **Video Processing**: Embeds subtitles into video using FFmpeg
- 🔧 **Flexible API**: Configurable OpenAI API base URL for custom endpoints

## Supported Languages

- English
- Chinese (Simplified)
- Japanese
- Korean
- French
- German
- Spanish

## Prerequisites

- Node.js 16+ 
- OpenAI API key with access to Whisper API
- Modern web browser with SharedArrayBuffer support

## Installation

1. Clone or download this project
2. Navigate to the project directory:
   ```bash
   cd react-auto-caption
   ```
3. Install dependencies:
   ```bash
   npm install
   ```

## Usage

1. Start the development server:
   ```bash
   npm run dev
   ```

2. Open your browser and navigate to the local development URL (typically `http://localhost:5173`)

3. Configure your settings:
   - Enter your OpenAI API key
   - (Optional) Customize the base URL if using a different endpoint
   - Select source and target languages
   - Adjust subtitle appearance settings

4. Upload a video file by dragging it onto the upload area or clicking to browse

5. Click "Start Processing" to begin automatic subtitle generation

6. Download the generated SRT file and/or video with embedded subtitles

## Configuration Options

### API Settings
- **API Key**: Your OpenAI API key
- **Base URL**: API endpoint (default: https://api.openai.com/v1)

### Language Settings
- **Source Language**: Auto-detect or specify the video's language
- **Target Language**: Language to translate subtitles to (or "None" for no translation)
- **Bilingual Subtitles**: Show both original and translated text

### Subtitle Appearance
- **Font Size**: 16px to 28px
- **Font Color**: White, Black, Yellow, or Red
- **Hard Subtitles**: Burn subtitles into video (vs. separate subtitle track)

## Technical Details

### Dependencies
- **React**: UI framework
- **OpenAI**: API client for Whisper speech-to-text
- **@ffmpeg/ffmpeg**: Browser-based video processing
- **Lucide React**: Icon library

### Processing Pipeline
1. **Audio Extraction**: Extract audio track from video using FFmpeg
2. **Speech Recognition**: Send audio to OpenAI Whisper API for transcription
3. **Translation**: (Optional) Translate text using OpenAI GPT models
4. **SRT Generation**: Create standard subtitle file format
5. **Video Processing**: Embed subtitles into video using FFmpeg

### Browser Requirements
This application requires a modern browser with:
- SharedArrayBuffer support
- Cross-origin isolation headers
- WebAssembly support

## Building for Production

```bash
npm run build
```

The built files will be in the `dist` directory.

## Troubleshooting

### Common Issues

1. **FFmpeg Loading Errors**: Ensure your browser supports SharedArrayBuffer and the page is served with appropriate headers
2. **API Errors**: Verify your OpenAI API key has access to the Whisper API
3. **Large Video Files**: Processing time depends on video length and your internet connection
4. **Browser Compatibility**: Use a modern browser (Chrome 88+, Firefox 89+, Safari 15.2+)

### Performance Tips

- Use smaller video files for faster processing
- Choose appropriate Whisper model size (smaller = faster, larger = more accurate)
- Consider using hard subtitles for better compatibility across devices

## License

MIT License

## Contributing

Feel free to submit issues and pull requests to improve this application.