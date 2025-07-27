export function formatTimestamp(seconds) {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);
  const milliseconds = Math.floor((seconds % 1) * 1000);

  return `${hours.toString().padStart(2, '0')}:${minutes
    .toString()
    .padStart(2, '0')}:${secs.toString().padStart(2, '0')},${milliseconds
    .toString()
    .padStart(3, '0')}`;
}

export function generateSRT(segments, options = {}) {
  const { bilingual = false, originalLanguage = 'en' } = options;
  
  let srtContent = '';
  
  segments.forEach((segment, index) => {
    const startTime = formatTimestamp(segment.start);
    const endTime = formatTimestamp(segment.end);
    
    let displayText = segment.text;
    
    if (bilingual && segment.translatedText) {
      displayText = `${segment.text}\n${segment.translatedText}`;
    } else if (segment.translatedText) {
      displayText = segment.translatedText;
    }
    
    srtContent += `${index + 1}\n`;
    srtContent += `${startTime} --> ${endTime}\n`;
    srtContent += `${displayText}\n\n`;
  });
  
  return srtContent;
}

export function downloadSRT(srtContent, filename = 'subtitles.srt') {
  const blob = new Blob([srtContent], { type: 'text/plain;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

export function parseSRT(srtContent) {
  const segments = [];
  const blocks = srtContent.trim().split(/\n\s*\n/);
  
  blocks.forEach(block => {
    const lines = block.trim().split('\n');
    if (lines.length >= 3) {
      const index = parseInt(lines[0]);
      const timeMatch = lines[1].match(/(\d{2}:\d{2}:\d{2},\d{3}) --> (\d{2}:\d{2}:\d{2},\d{3})/);
      
      if (timeMatch) {
        const start = parseTimestamp(timeMatch[1]);
        const end = parseTimestamp(timeMatch[2]);
        const text = lines.slice(2).join('\n');
        
        segments.push({
          index,
          start,
          end,
          text
        });
      }
    }
  });
  
  return segments;
}

export function validateSRT(content) {
  if (!content || typeof content !== 'string') {
    return { isValid: false, error: 'Content is empty or invalid' };
  }

  const lines = content.trim().split('\n');
  if (lines.length < 3) {
    return { isValid: false, error: 'File too short to be a valid SRT' };
  }

  // Check for time format
  const timeRegex = /\d{2}:\d{2}:\d{2},\d{3} --> \d{2}:\d{2}:\d{2},\d{3}/;
  if (!timeRegex.test(content)) {
    return { isValid: false, error: 'Invalid timestamp format' };
  }

  // Try to parse the content
  try {
    const segments = parseSRT(content);
    if (segments.length === 0) {
      return { isValid: false, error: 'No valid subtitle segments found' };
    }

    // Check for overlapping or invalid timestamps
    for (let i = 0; i < segments.length; i++) {
      const segment = segments[i];
      if (segment.start >= segment.end) {
        return { 
          isValid: false, 
          error: `Invalid timestamp in segment ${segment.index}: start time must be before end time` 
        };
      }
      
      if (i > 0 && segment.start < segments[i - 1].end) {
        console.warn(`Warning: Segment ${segment.index} overlaps with previous segment`);
      }
    }

    return { 
      isValid: true, 
      segments,
      duration: segments[segments.length - 1]?.end || 0,
      count: segments.length
    };
  } catch (error) {
    return { isValid: false, error: `Parse error: ${error.message}` };
  }
}

export function getSRTInfo(content) {
  const validation = validateSRT(content);
  if (!validation.isValid) {
    return null;
  }

  const { segments, duration, count } = validation;
  
  return {
    segmentCount: count,
    duration: duration,
    formattedDuration: formatTimestamp(duration),
    languages: detectLanguages(segments),
    averageSegmentLength: segments.reduce((sum, seg) => sum + (seg.end - seg.start), 0) / count
  };
}

function detectLanguages(segments) {
  // Simple language detection based on character sets
  const languages = new Set();
  
  segments.forEach(segment => {
    const text = segment.text;
    
    if (/[\u4e00-\u9fff]/.test(text)) {
      languages.add('Chinese');
    }
    if (/[\u3040-\u309f\u30a0-\u30ff]/.test(text)) {
      languages.add('Japanese');
    }
    if (/[\uac00-\ud7af]/.test(text)) {
      languages.add('Korean');
    }
    if (/[a-zA-Z]/.test(text)) {
      languages.add('Latin');
    }
  });
  
  return Array.from(languages);
}

function parseTimestamp(timeStr) {
  const [time, ms] = timeStr.split(',');
  const [hours, minutes, seconds] = time.split(':').map(Number);
  return hours * 3600 + minutes * 60 + seconds + parseInt(ms) / 1000;
}