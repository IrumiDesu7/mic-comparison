# Microphone Comparison Tool

## Why

**Making the right audio choice shouldn't require guesswork.**

Whether you're a podcaster, content creator, musician, or remote worker, your microphone is your voice to the world. Yet choosing between microphones has always meant relying on manufacturer specs, online reviews, or expensive trial-and-error purchases. What if you could hear the actual difference between your microphones with your own voice, in your own environment?

We believe everyone deserves to make informed audio decisions based on real, comparative listening—not just marketing claims.

## How

This tool changes the microphone comparison process by:

- **Recording simultaneously** from two microphones at once, ensuring identical conditions for fair comparison
- **Disabling audio processing** (no echo cancellation, noise suppression, or auto gain) to capture the true character of each microphone
- **Providing real-time visualization** so you can see the audio signals as you record
- **Running entirely in your browser** with no installations, accounts, or uploads required—your audio stays private on your device
- **Making comparison effortless** with side-by-side playback controls and downloadable recordings

## What

A lightweight, privacy-focused web application that lets you record from two different microphones simultaneously and compare their audio quality side-by-side.

### Features

- **Simultaneous dual recording** - Record from two microphones at the same time
- **Real-time waveform visualization** - See audio levels while recording
- **Side-by-side playback** - Compare recordings instantly
- **Download recordings** - Save both audio files for future reference
- **No processing** - Pure, unaltered audio capture (echo cancellation, noise suppression, and auto gain control disabled)
- **Privacy-first** - All processing happens locally in your browser
- **Keyboard shortcuts** - Press Space to start/stop recording
- **Fully accessible** - ARIA labels and keyboard navigation support

### Browser Support

Works on modern browsers with WebRTC support:
- Chrome/Edge (recommended)
- Firefox
- Safari

**Note:** Most mobile devices can only access one microphone at a time. For the best experience, use a desktop or laptop computer.

## Getting Started

### Prerequisites

- Two microphones connected to your computer
- A modern web browser

### Installation

1. Clone this repository:
```bash
git clone https://github.com/IrumiDesu7/mic-comparison.git
cd mic-comparison
```

2. Open `index.html` in your browser:
```bash
# On macOS
open index.html

# On Linux
xdg-open index.html

# On Windows
start index.html
```

Or use a local server:
```bash
# Python 3
python -m http.server 8000

# Then open http://localhost:8000 in your browser
```

### Usage

1. **Select your microphones** - Choose two different microphones from the dropdown menus
2. **Start recording** - Click "Start Recording" or press Space
3. **Speak or perform** - Record your audio sample
4. **Stop recording** - Click "Stop Recording" or press Space again
5. **Compare** - Play back both recordings side-by-side
6. **Download** - Save either or both recordings for future reference

## Use Cases

- **Content creators** - Compare USB microphones vs. XLR setups
- **Podcasters** - Test different mics for your voice
- **Musicians** - Evaluate microphone placement and characteristics
- **Remote workers** - Find the best mic for video calls
- **Streamers** - Optimize your audio setup
- **Audio enthusiasts** - A/B test your gear collection

## Technical Details

Built with:
- Vanilla JavaScript (no frameworks)
- Web Audio API for visualization
- MediaRecorder API for audio capture
- WebRTC getUserMedia for microphone access

Audio settings:
- Echo cancellation: disabled
- Noise suppression: disabled
- Auto gain control: disabled
- Format: WebM/MP4/OGG (browser-dependent)

## Contributing

Contributions are welcome! Feel free to:
- Report bugs
- Suggest new features
- Submit pull requests

## License

MIT License - feel free to use this tool for any purpose.

## Privacy

This tool:
- ✅ Runs entirely in your browser
- ✅ Never uploads your audio
- ✅ Doesn't require accounts or sign-ups
- ✅ Doesn't collect analytics
- ✅ Stores nothing on servers

Your audio is yours alone.

---

**Built with the belief that better audio starts with better choices.**
