# SyllabAI Product Demo Videos Directory

Place your exported product demo video loops here:

1. `/public/videos/demo.webm` (Primary WebM format)
2. `/public/videos/demo.mp4` (Fallback MP4 format)

Recommended Encoding:
- Duration: 6–10 seconds loop
- Resolution: 1920x1080 or 1280x720 (silent, high quality)
- WebM conversion command:
  ffmpeg -i input.mov -c:v libvpx-vp9 -b:v 0 -crf 30 -an public/videos/demo.webm
