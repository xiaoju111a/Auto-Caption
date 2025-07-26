from setuptools import setup, find_packages

with open("README.md", "r", encoding="utf-8") as fh:
    long_description = fh.read()

setup(
    name="auto-caption",
    version="1.0.0",
    author="Auto Caption Team",
    description="自动视频字幕生成系统",
    long_description=long_description,
    long_description_content_type="text/markdown",
    py_modules=["auto_caption"],
    install_requires=[
        "openai>=1.0.0",
        "openai-whisper>=20231117",
        "torch>=2.0.0",
        "torchaudio>=2.0.0",
        "ffmpeg-python>=0.2.0",
    ],
    python_requires=">=3.8",
    entry_points={
        "console_scripts": [
            "auto-caption=auto_caption:main",
        ]
    },
    classifiers=[
        "Development Status :: 4 - Beta",
        "Intended Audience :: Developers",
        "License :: OSI Approved :: MIT License",
        "Operating System :: OS Independent",
        "Programming Language :: Python :: 3",
        "Programming Language :: Python :: 3.8",
        "Programming Language :: Python :: 3.9",
        "Programming Language :: Python :: 3.10",
        "Programming Language :: Python :: 3.11",
    ],
)