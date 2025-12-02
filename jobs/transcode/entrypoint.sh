#!/bin/bash
# Entrypoint script for GPU-accelerated video transcoding
# Reads videos from GCS input volume and writes to output volume

set -e

# Check if required arguments are provided
if [ $# -lt 2 ]; then
  echo "Usage: $0 <input-file> <output-file> [ffmpeg-args...]"
  echo "Example: $0 input.mp4 output.mp4 -vcodec h264_nvenc -cq 21 -movflags +faststart"
  exit 1
fi

INPUT_FILE="$1"
OUTPUT_FILE="$2"
shift 2
FFMPEG_ARGS="$@"

# Define input/output directories (mounted from GCS)
INPUT_DIR="/inputs"
OUTPUT_DIR="/outputs"

INPUT_PATH="${INPUT_DIR}/${INPUT_FILE}"
OUTPUT_PATH="${OUTPUT_DIR}/${OUTPUT_FILE}"

# Check if input file exists
if [ ! -f "$INPUT_PATH" ]; then
  echo "Error: Input file not found: $INPUT_PATH"
  exit 1
fi

echo "=========================================="
echo "GPU-Accelerated Video Transcoding"
echo "=========================================="
echo "Input:  $INPUT_PATH"
echo "Output: $OUTPUT_PATH"
echo "Args:   $FFMPEG_ARGS"
echo "=========================================="

# Check NVIDIA GPU availability
if command -v nvidia-smi &> /dev/null; then
  echo "GPU Info:"
  nvidia-smi --query-gpu=name,memory.total,driver_version --format=csv,noheader
  echo "=========================================="
else
  echo "Warning: nvidia-smi not found. GPU may not be available."
fi

# Run FFmpeg with GPU acceleration
echo "Starting transcoding..."
START_TIME=$(date +%s)

ffmpeg -hwaccel cuda -i "$INPUT_PATH" $FFMPEG_ARGS "$OUTPUT_PATH"

END_TIME=$(date +%s)
DURATION=$((END_TIME - START_TIME))

echo "=========================================="
echo "Transcoding completed in ${DURATION} seconds"
echo "Output file: $OUTPUT_PATH"

# Get output file size
if [ -f "$OUTPUT_PATH" ]; then
  OUTPUT_SIZE=$(du -h "$OUTPUT_PATH" | cut -f1)
  echo "Output size: $OUTPUT_SIZE"
else
  echo "Error: Output file was not created"
  exit 1
fi

echo "=========================================="
echo "Success!"
