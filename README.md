# Auto-Caption 自动字幕生成系统

一个基于 Whisper 和 OpenAI 的自动视频字幕生成工具，支持语音识别、翻译和字幕嵌入。

## 功能特性

- 🎵 **音频提取**: 使用 FFmpeg 从视频中提取高质量音频
- 🗣️ **语音识别**: 基于 OpenAI Whisper 模型的多语言语音转文字
- 🌐 **智能翻译**: 使用 OpenAI o1-mini 模型进行高质量翻译
- 📝 **字幕生成**: 生成标准 SRT 格式字幕文件
- ✏️ **手动修正**: 支持交互模式，允许用户编辑字幕后再嵌入
- 🎬 **字幕嵌入**: 支持硬字幕（烧录）和软字幕（独立轨道）
- 🌍 **多语言支持**: 支持中英日韩法德西等多种目标语言
- 📱 **双语字幕**: 可生成原文+翻译的双语字幕

## 安装要求

### 系统依赖
- Python 3.7+
- FFmpeg

### Python 依赖
```bash
pip install -r requirements.txt
```

主要依赖包：
- `openai` - OpenAI API 客户端
- `openai-whisper` - Whisper 语音识别模型
- `pathlib` - 路径处理

## 使用方法

### 基本用法
```bash
python auto_caption.py video.mp4 --api-key YOUR_OPENAI_API_KEY
```

### 完整参数示例
```bash
python auto_caption.py video.mp4 \
    --api-key YOUR_OPENAI_API_KEY \
    --target-lang zh \
    --whisper-model base \
    --output-dir ./output \
    --interactive \
    --bilingual \
    --duration 180
```

### 参数说明

| 参数 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `video` | 必需 | - | 输入视频文件路径 |
| `--api-key` | 必需 | - | OpenAI API 密钥 |
| `--output-dir` | 可选 | 视频所在目录 | 输出文件目录 |
| `--target-lang` | 可选 | `zh` | 目标翻译语言 |
| `--whisper-model` | 可选 | `base` | Whisper 模型大小 |
| `--no-translate` | 标志 | False | 跳过翻译，只生成原语言字幕 |
| `--duration` | 可选 | - | 限制处理时长（秒），用于测试 |
| `--soft-sub` | 标志 | False | 使用软字幕（默认硬字幕） |
| `--bilingual` | 标志 | False | 生成双语字幕 |
| `--interactive` | 标志 | False | 启用交互模式，允许手动修正 |

### 支持的语言
- `zh` - 中文（默认）
- `en` - 英语
- `ja` - 日语
- `ko` - 韩语
- `fr` - 法语
- `de` - 德语
- `es` - 西班牙语

### Whisper 模型选择
| 模型 | 大小 | 内存需求 | 速度 | 准确率 | 适用场景 |
|------|------|----------|------|--------|----------|
| `tiny` | 39M | ~1GB | 最快 | 较低 | 快速测试 |
| `base` | 74M | ~1GB | 快 | 一般 | 日常使用（推荐） |
| `small` | 244M | ~2GB | 中等 | 良好 | 提升准确率 |
| `medium` | 769M | ~5GB | 慢 | 很好 | 高质量需求 |
| `large` | 1550M | ~10GB | 最慢 | 最佳 | 专业级质量 |

## 硬字幕 vs 软字幕

### 硬字幕（默认）
- ✅ 兼容性好，任何播放器都能显示
- ✅ 字体样式固定，显示效果一致
- ❌ 文件较大，需要重新编码视频
- ❌ 无法关闭或调整样式

### 软字幕
```bash
python auto_caption.py video.mp4 --api-key YOUR_KEY --soft-sub
```
- ✅ 文件较小，只复制视频流
- ✅ 可以开关字幕
- ✅ 播放器可调整字体样式
- ❌ 需要播放器支持

## 交互模式

启用交互模式可以在字幕嵌入前手动修正 SRT 文件：

```bash
python auto_caption.py video.mp4 --api-key YOUR_KEY --interactive
```

### 工作流程
1. 系统自动生成初始 SRT 字幕文件
2. 暂停并提示用户手动编辑 SRT 文件
3. 用户使用任意文本编辑器修正字幕内容、时间戳或翻译
4. 按 Enter 键继续，系统将修正后的字幕嵌入视频

## 使用示例

### 快速测试（处理前30秒）
```bash
python auto_caption.py test.mp4 --api-key YOUR_KEY --duration 30
```

### 生成双语字幕
```bash
python auto_caption.py video.mp4 --api-key YOUR_KEY --bilingual
```

### 只生成英文字幕（不翻译）
```bash
python auto_caption.py english_video.mp4 --api-key YOUR_KEY --no-translate
```

### 高质量模式（大模型 + 交互修正）
```bash
python auto_caption.py video.mp4 \
    --api-key YOUR_KEY \
    --whisper-model large \
    --interactive \
    --bilingual
```

## 输出文件

处理完成后会生成以下文件：
- `{video_name}.srt` - SRT 字幕文件
- `{video_name}_with_subtitles.{ext}` - 嵌入字幕的视频文件

如果指定了时长限制，文件名会包含时长信息：
- `{video_name}_first_{duration}s.srt`
- `{video_name}_first_{duration}s_with_subtitles.{ext}`

## 注意事项

### API 费用
- Whisper 语音识别在本地运行，无需付费
- OpenAI 翻译按 token 计费，建议先用短视频测试

### 系统要求
- 确保已安装 FFmpeg：`ffmpeg -version`
- 足够的磁盘空间存储临时音频文件
- 根据 Whisper 模型大小准备相应内存

### 性能优化
- 测试阶段使用 `--duration` 参数限制时长
- 选择合适的 Whisper 模型平衡速度和准确率
- 使用 `--no-translate` 跳过翻译可大幅节省时间和费用

## 故障排除

### 常见问题

1. **FFmpeg 未找到**
   ```
   Error: FFmpeg not found. Please install FFmpeg first.
   ```
   解决：安装 FFmpeg 并确保在 PATH 中

2. **OpenAI API 错误**
   - 检查 API 密钥是否正确
   - 确认账户有足够余额
   - 检查网络连接

3. **内存不足**
   - 使用较小的 Whisper 模型（如 `tiny` 或 `base`）
   - 使用 `--duration` 参数处理较短片段

4. **字幕显示异常**
   - 硬字幕：检查系统是否有中文字体
   - 软字幕：确认播放器支持 SRT 格式

## 许可证

[许可证类型] - 详见 LICENSE 文件

## 贡献

欢迎提交 Issue 和 Pull Request 来改进这个项目。