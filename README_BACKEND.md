# Auto Caption - Python Backend + React Frontend

AI-powered video subtitle generation using OpenAI Whisper API with React frontend and Python Flask backend.

## Features

- **Auto Generation**: Upload video → Generate SRT → Edit subtitles → Embed into video
- **Manual Upload**: Upload your own SRT files and embed them into videos
- **Multiple Languages**: Support for transcription and translation
- **Customizable Settings**: Font size, color, bilingual subtitles
- **API Flexibility**: Use OpenAI API or compatible endpoints

## Architecture

- **Frontend**: React + Vite (Port 5173)
- **Backend**: Python Flask (Port 5000)
- **Video Processing**: FFmpeg
- **AI Services**: OpenAI Whisper + GPT models

## Quick Start

### Prerequisites

1. **Python 3.8+**
2. **Node.js 16+**
3. **FFmpeg** (for video processing)
   ```bash
   # Ubuntu/Debian
   sudo apt update && sudo apt install ffmpeg
   
   # macOS
   brew install ffmpeg
   
   # Windows
   # Download from https://ffmpeg.org/download.html
   ```

### Backend Setup

```bash
cd backend

# Install dependencies
pip install -r requirements.txt

# Start the backend server
python run.py
```

The backend will be available at `http://localhost:5000`

### Frontend Setup

```bash
cd react-auto-caption

# Install dependencies
npm install

# Start the development server
npm run dev
```

The frontend will be available at `http://localhost:5173`

## Usage

1. **Configure API Settings**
   - Enter your OpenAI API key
   - Set base URL (default: https://api.openai.com)
   - Select source and target languages

2. **Upload Video**
   - Supported formats: MP4, AVI, MOV, MKV, WebM, FLV
   - Maximum file size: 500MB

3. **Generate Subtitles**
   - Click "Generate Subtitles" to start processing
   - Review and edit the generated SRT content
   - Embed subtitles into the video

4. **Download Results**
   - Download the SRT file
   - Download the video with embedded subtitles

## API Endpoints

### Video Upload
```
POST /api/upload-video
Content-Type: multipart/form-data
Body: video file
```

### Generate Subtitles
```
POST /api/generate-subtitles
Content-Type: application/json
Body: {
  "file_id": "uuid",
  "settings": {
    "api_key": "sk-...",
    "base_url": "https://api.openai.com",
    "source_language": "auto",
    "target_language": "zh",
    "translation_model": "gpt-3.5-turbo",
    "bilingual": false
  }
}
```

### Embed Subtitles
```
POST /api/embed-subtitles
Content-Type: application/json
Body: {
  "file_id": "uuid",
  "srt_content": "subtitle content",
  "settings": {
    "hard_sub": true,
    "font_size": 24,
    "font_color": "white"
  }
}
```

## Configuration

### Environment Variables

- `FLASK_ENV`: Set to `development` for debug mode
- `MAX_CONTENT_LENGTH`: Maximum upload file size (default: 500MB)

### Supported Languages

- **Source**: Auto-detect, English, Chinese, Japanese, Korean, French, German, Spanish
- **Target**: None (no translation), Chinese, English, Japanese, Korean, French, German, Spanish

## Project Structure

```
Auto-Caption/
├── backend/                 # Flask backend
│   ├── services/           # Business logic services
│   │   ├── whisper_service.py
│   │   ├── video_service.py
│   │   └── subtitle_service.py
│   ├── app.py             # Main Flask application
│   ├── requirements.txt   # Python dependencies
│   └── run.py            # Startup script
├── react-auto-caption/    # React frontend
│   ├── src/
│   │   ├── components/    # React components
│   │   ├── services/      # API services
│   │   └── utils/         # Utility functions
│   ├── package.json       # Node dependencies
│   └── vite.config.js     # Vite configuration
└── README_BACKEND.md
```

## Troubleshooting

### Common Issues

1. **FFmpeg not found**
   - Ensure FFmpeg is installed and in your system PATH
   - Test with: `ffmpeg -version`

2. **CORS errors**
   - Backend runs on port 5000, frontend on 5173
   - CORS is configured in Flask app

3. **Upload fails**
   - Check file size limits (500MB default)
   - Ensure supported video format

4. **API errors**
   - Verify API key is correct
   - Check base URL format
   - Ensure model availability

### Logs

- Backend logs: Check console output where you ran `python run.py`
- Frontend logs: Check browser developer console

## License

MIT License