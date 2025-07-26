#!/usr/bin/env python3
"""
Auto Caption System
自动字幕生成系统

基本流程:
1. 使用FFmpeg提取音频
2. 调用Whisper进行语音识别获得带时间戳的文本
3. 调用OpenAI o1-mini模型翻译文本
4. 生成SRT字幕文件
5. 交互模式：暂停让用户手动修正SRT字幕（可选）
6. 使用FFmpeg将字幕嵌入视频
"""

import os
import sys
import argparse
import subprocess
import tempfile
import json
from pathlib import Path
from typing import List, Dict, Tuple, Optional
import openai
import whisper
from datetime import timedelta


class AutoCaptionSystem:
    def __init__(self, openai_api_key: str, target_language: str = "zh"):
        """
        初始化自动字幕系统
        
        Args:
            openai_api_key: OpenAI API密钥
            target_language: 目标翻译语言，默认为中文
        """
        self.openai_client = openai.OpenAI(api_key=openai_api_key)
        self.target_language = target_language
        self.whisper_model = None
        
    def load_whisper_model(self, model_name: str = "base"):
        """加载Whisper模型"""
        print(f"Loading Whisper model: {model_name}")
        self.whisper_model = whisper.load_model(model_name)
        
    def extract_audio(self, video_path: str, audio_path: str, duration: Optional[int] = None) -> bool:
        """
        使用FFmpeg从视频中提取音频
        
        Args:
            video_path: 输入视频文件路径
            audio_path: 输出音频文件路径
            duration: 限制提取时长（秒），None表示提取全部
            
        Returns:
            bool: 提取成功返回True，失败返回False
        """
        try:
            cmd = ['ffmpeg', '-i', video_path]
            
            # 如果指定了时长限制，添加-t参数
            if duration is not None:
                cmd.extend(['-t', str(duration)])
            
            cmd.extend([
                '-vn',  # 不处理视频流
                '-acodec', 'pcm_s16le',  # 使用PCM编码
                '-ar', '16000',  # 采样率16kHz
                '-ac', '1',  # 单声道
                '-y',  # 覆盖输出文件
                audio_path
            ])
            
            if duration:
                print(f"Extracting audio from {video_path} (first {duration} seconds)...")
            else:
                print(f"Extracting audio from {video_path}...")
            result = subprocess.run(cmd, capture_output=True, text=True)
            
            if result.returncode == 0:
                print(f"Audio extracted to {audio_path}")
                return True
            else:
                print(f"FFmpeg error: {result.stderr}")
                return False
                
        except Exception as e:
            print(f"Error extracting audio: {e}")
            return False
    
    def transcribe_audio(self, audio_path: str) -> List[Dict]:
        """
        使用Whisper进行语音识别，获取带时间戳的文本
        
        Args:
            audio_path: 音频文件路径
            
        Returns:
            List[Dict]: 包含时间戳和文本的字典列表
        """
        if not self.whisper_model:
            self.load_whisper_model()
            
        print(f"Transcribing audio: {audio_path}")
        result = self.whisper_model.transcribe(audio_path, word_timestamps=True)
        
        segments = []
        for segment in result["segments"]:
            segments.append({
                "start": segment["start"],
                "end": segment["end"],
                "text": segment["text"].strip()
            })
            
        print(f"Transcription completed: {len(segments)} segments")
        return segments
    
    def translate_text(self, text: str) -> str:
        """
        使用OpenAI o1-mini模型翻译文本
        
        Args:
            text: 需要翻译的文本
            
        Returns:
            str: 翻译后的文本
        """
        try:
            language_map = {
                "zh": "Chinese",
                "en": "English",
                "ja": "Japanese",
                "ko": "Korean",
                "fr": "French",
                "de": "German",
                "es": "Spanish"
            }
            
            target_lang = language_map.get(self.target_language, "Chinese")
            
            response = self.openai_client.chat.completions.create(
                model="o1-mini",
                messages=[
                    {
                        "role": "user",
                        "content": f"Please translate the following text to {target_lang}. Only return the translated text without any explanations:\n\n{text}"
                    }
                ]
            )
            
            return response.choices[0].message.content.strip()
            
        except Exception as e:
            print(f"Translation error: {e}")
            return text  # 如果翻译失败，返回原文
    
    def format_timestamp(self, seconds: float) -> str:
        """
        将秒数转换为SRT时间戳格式
        
        Args:
            seconds: 秒数
            
        Returns:
            str: SRT格式的时间戳 (HH:MM:SS,mmm)
        """
        td = timedelta(seconds=seconds)
        hours, remainder = divmod(td.total_seconds(), 3600)
        minutes, seconds = divmod(remainder, 60)
        milliseconds = int((seconds % 1) * 1000)
        
        return f"{int(hours):02d}:{int(minutes):02d}:{int(seconds):02d},{milliseconds:03d}"
    
    def generate_srt(self, segments: List[Dict], output_path: str, translate: bool = True, bilingual: bool = False):
        """
        生成SRT字幕文件
        
        Args:
            segments: 包含时间戳和文本的字典列表
            output_path: 输出SRT文件路径
            translate: 是否翻译文本
            bilingual: 是否生成双语字幕（原文+翻译）
        """
        print(f"Generating SRT file: {output_path}")
        
        with open(output_path, 'w', encoding='utf-8') as f:
            for i, segment in enumerate(segments, 1):
                start_time = self.format_timestamp(segment["start"])
                end_time = self.format_timestamp(segment["end"])
                
                original_text = segment["text"].strip()
                
                if translate and self.target_language != "en":
                    print(f"Translating segment {i}/{len(segments)}...")
                    translated_text = self.translate_text(original_text)
                    
                    if bilingual:
                        # 双语字幕：原文在上，翻译在下
                        display_text = f"{original_text}\n{translated_text}"
                    else:
                        # 只显示翻译
                        display_text = translated_text
                else:
                    # 不翻译，只显示原文
                    display_text = original_text
                
                f.write(f"{i}\n")
                f.write(f"{start_time} --> {end_time}\n")
                f.write(f"{display_text}\n\n")
        
        print(f"SRT file generated: {output_path}")
    
    def embed_subtitles(self, video_path: str, srt_path: str, output_path: str, hard_sub: bool = True, duration: Optional[int] = None) -> bool:
        """
        使用FFmpeg将字幕嵌入视频，并可选裁剪视频时长
        
        Args:
            video_path: 输入视频文件路径
            srt_path: SRT字幕文件路径
            output_path: 输出视频文件路径
            hard_sub: 是否使用硬字幕（烧录到视频中），默认True
            duration: 要输出的视频时长（秒），None表示保持原时长
            
        Returns:
            bool: 嵌入成功返回True，失败返回False
        """
        try:
            # 基本命令参数
            cmd = ['ffmpeg', '-i', video_path]
            
            # 如果指定了时长限制，添加裁剪参数
            if duration is not None:
                cmd.extend(['-t', str(duration)])
            
            if hard_sub:
                # 硬字幕：直接烧录到视频画面上，使用中文字体
                font_path = "/usr/share/fonts/opentype/noto/NotoSansCJK-Regular.ttc"
                cmd.extend([
                    '-vf', f"subtitles='{srt_path}':force_style='FontName=Noto Sans CJK SC,FontSize=18,PrimaryColour=&Hffffff,OutlineColour=&H000000,Outline=2,Shadow=1'",
                    '-c:a', 'copy',  # 复制音频流
                ])
            else:
                # 软字幕：作为独立轨道嵌入
                cmd.extend([
                    '-i', srt_path,
                    '-c:v', 'copy',  # 复制视频流
                    '-c:a', 'copy',  # 复制音频流
                    '-c:s', 'mov_text',  # 字幕编码
                    '-metadata:s:s:0', 'language=chi',  # 设置字幕语言
                ])
            
            cmd.extend(['-y', output_path])  # 覆盖输出文件
            
            sub_type = "硬字幕" if hard_sub else "软字幕"
            duration_info = f" (trimmed to {duration}s)" if duration else ""
            print(f"Embedding subtitles into video ({sub_type}){duration_info}...")
            result = subprocess.run(cmd, capture_output=True, text=True)
            
            if result.returncode == 0:
                print(f"Video with subtitles saved to: {output_path}")
                return True
            else:
                print(f"FFmpeg error: {result.stderr}")
                return False
                
        except Exception as e:
            print(f"Error embedding subtitles: {e}")
            return False
    
    def process_video(self, video_path: str, output_dir: str = None, 
                     whisper_model: str = "base", translate: bool = True, 
                     duration: Optional[int] = None, hard_sub: bool = True, bilingual: bool = False, interactive: bool = False) -> bool:
        """
        处理视频文件的完整流程
        
        Args:
            video_path: 输入视频文件路径
            output_dir: 输出目录，默认为视频文件所在目录
            whisper_model: Whisper模型名称
            translate: 是否翻译字幕
            duration: 限制处理时长（秒），None表示处理全部
            hard_sub: 是否使用硬字幕（烧录到视频中）
            bilingual: 是否生成双语字幕（原文+翻译）
            interactive: 是否启用交互模式，允许手动修正SRT字幕
            
        Returns:
            bool: 处理成功返回True，失败返回False
        """
        video_path = Path(video_path)
        if not video_path.exists():
            print(f"Video file not found: {video_path}")
            return False
        
        if output_dir is None:
            output_dir = video_path.parent
        else:
            output_dir = Path(output_dir)
            output_dir.mkdir(parents=True, exist_ok=True)
        
        video_name = video_path.stem
        if duration:
            video_name += f"_first_{duration}s"
        
        # 临时音频文件
        temp_audio = tempfile.NamedTemporaryFile(suffix='.wav', delete=False)
        temp_audio.close()
        
        # 输出文件路径
        srt_path = output_dir / f"{video_name}.srt"
        output_video_path = output_dir / f"{video_name}_with_subtitles{video_path.suffix}"
        
        try:
            # 1. 提取音频
            if not self.extract_audio(str(video_path), temp_audio.name, duration):
                return False
            
            # 2. 加载Whisper模型
            if not self.whisper_model:
                self.load_whisper_model(whisper_model)
            
            # 3. 语音识别
            segments = self.transcribe_audio(temp_audio.name)
            if not segments:
                print("No speech found in audio")
                return False
            
            # 4. 生成SRT字幕
            self.generate_srt(segments, str(srt_path), translate, bilingual)
            
            # 5. 交互式修正SRT字幕（如果启用）
            if interactive:
                print(f"\n字幕文件已生成: {srt_path}")
                print("请在外部编辑器中修正SRT字幕文件，完成后按Enter继续...")
                input("按Enter键继续字幕嵌入...")
                
                # 检查SRT文件是否仍然存在且有效
                if not Path(srt_path).exists():
                    print(f"错误: SRT文件不存在: {srt_path}")
                    return False
            
            # 6. 嵌入字幕
            if not self.embed_subtitles(str(video_path), str(srt_path), str(output_video_path), hard_sub, duration):
                return False
            
            print(f"\nProcess completed successfully!")
            print(f"SRT file: {srt_path}")
            print(f"Video with subtitles: {output_video_path}")
            return True
            
        except Exception as e:
            print(f"Error processing video: {e}")
            return False
            
        finally:
            # 清理临时文件
            try:
                os.unlink(temp_audio.name)
            except:
                pass


def main():
    parser = argparse.ArgumentParser(description="Auto Caption System - 自动字幕生成系统")
    parser.add_argument("video", help="输入视频文件路径")
    parser.add_argument("--api-key", required=True, help="OpenAI API密钥")
    parser.add_argument("--output-dir", help="输出目录，默认为视频文件所在目录")
    parser.add_argument("--target-lang", default="zh", 
                       choices=["zh", "en", "ja", "ko", "fr", "de", "es"],
                       help="目标翻译语言 (默认: zh)")
    parser.add_argument("--whisper-model", default="base",
                       choices=["tiny", "base", "small", "medium", "large"],
                       help="Whisper模型大小 (默认: base)")
    parser.add_argument("--no-translate", action="store_true", 
                       help="不翻译，只生成原语言字幕")
    parser.add_argument("--duration", type=int, 
                       help="限制处理时长（秒），用于测试前几分钟，如: 180表示前3分钟")
    parser.add_argument("--soft-sub", action="store_true", 
                       help="使用软字幕（默认使用硬字幕）")
    parser.add_argument("--bilingual", action="store_true", 
                       help="生成双语字幕（原文+翻译）")
    parser.add_argument("--interactive", action="store_true", 
                       help="启用交互模式，生成SRT后暂停以便手动修正")
    
    args = parser.parse_args()
    
    # 检查FFmpeg是否可用
    try:
        subprocess.run(['ffmpeg', '-version'], capture_output=True, check=True)
    except (subprocess.CalledProcessError, FileNotFoundError):
        print("Error: FFmpeg not found. Please install FFmpeg first.")
        sys.exit(1)
    
    # 初始化系统
    caption_system = AutoCaptionSystem(
        openai_api_key=args.api_key,
        target_language=args.target_lang
    )
    
    # 处理视频
    success = caption_system.process_video(
        video_path=args.video,
        output_dir=args.output_dir,
        whisper_model=args.whisper_model,
        translate=not args.no_translate,
        duration=args.duration,
        hard_sub=not args.soft_sub,
        bilingual=args.bilingual,
        interactive=args.interactive
    )
    
    if success:
        print("✅ 处理完成!")
    else:
        print("❌ 处理失败!")
        sys.exit(1)


if __name__ == "__main__":
    main()