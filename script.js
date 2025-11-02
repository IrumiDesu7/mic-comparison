const SUPPORTED_MIME_TYPES = ['audio/webm', 'audio/mp4', 'audio/ogg'];
const DEFAULT_FILE_EXTENSION = 'webm';
const MIME_TO_EXTENSION = {
    'audio/webm': 'webm',
    'audio/mp4': 'm4a',
    'audio/ogg': 'ogg'
};

const RecordingState = {
    IDLE: 'idle',
    RECORDING: 'recording'
};

class MicComparisonApp {
    constructor() {
        this.mediaRecorder1 = null;
        this.mediaRecorder2 = null;
        this.recordedChunks1 = [];
        this.recordedChunks2 = [];
        this.audioBlob1 = null;
        this.audioBlob2 = null;
        this.audioUrl1 = null;
        this.audioUrl2 = null;
        this.state = RecordingState.IDLE;
        this.supportedMimeType = null;
        this.audioContext = null;
        this.analyser1 = null;
        this.analyser2 = null;
        this.dataArray1 = null;
        this.dataArray2 = null;
        this.animationId = null;

        this.initializeElements();
        this.checkBrowserSupport();
    }

    initializeElements() {
        this.elements = {
            mic1Select: document.getElementById('mic1'),
            mic2Select: document.getElementById('mic2'),
            recordBtn: document.getElementById('recordBtn'),
            stopBtn: document.getElementById('stopBtn'),
            statusDiv: document.getElementById('status'),
            playbackSection: document.getElementById('playbackSection'),
            audio1: document.getElementById('audio1'),
            audio2: document.getElementById('audio2'),
            mic1Label: document.getElementById('mic1Label'),
            mic2Label: document.getElementById('mic2Label'),
            unsupportedBrowser: document.getElementById('unsupportedBrowser'),
            visualizerContainer: document.getElementById('visualizerContainer'),
            canvas: document.getElementById('waveformCanvas')
        };
    }

    checkBrowserSupport() {
        const hasMediaDevices = navigator.mediaDevices && navigator.mediaDevices.getUserMedia;
        const hasMediaRecorder = typeof MediaRecorder !== 'undefined';

        if (!hasMediaDevices || !hasMediaRecorder) {
            this.showUnsupportedBrowserMessage();
            return;
        }

        this.detectSupportedMimeType();
        this.attachEventListeners();
        this.enumerateAudioDevices();
    }

    detectSupportedMimeType() {
        for (const mimeType of SUPPORTED_MIME_TYPES) {
            if (MediaRecorder.isTypeSupported(mimeType)) {
                this.supportedMimeType = mimeType;
                return;
            }
        }
        this.supportedMimeType = SUPPORTED_MIME_TYPES[0];
    }

    showUnsupportedBrowserMessage() {
        this.elements.unsupportedBrowser.classList.remove('hidden');
        this.elements.statusDiv.classList.add('hidden');
        this.elements.recordBtn.disabled = true;
    }

    attachEventListeners() {
        this.elements.recordBtn.addEventListener('click', () => this.startRecording());
        this.elements.stopBtn.addEventListener('click', () => this.stopRecording());

        const downloadButtons = document.querySelectorAll('[data-mic]');
        downloadButtons.forEach(button => {
            button.addEventListener('click', (e) => {
                const micNumber = parseInt(e.currentTarget.dataset.mic, 10);
                this.downloadRecording(micNumber);
            });
        });

        document.addEventListener('keydown', (e) => this.handleKeyboardShortcuts(e));
    }

    handleKeyboardShortcuts(event) {
        if (event.target.tagName === 'SELECT' || event.target.tagName === 'BUTTON') {
            return;
        }

        if (event.code === 'Space' && this.state === RecordingState.IDLE) {
            event.preventDefault();
            this.startRecording();
        } else if (event.code === 'Space' && this.state === RecordingState.RECORDING) {
            event.preventDefault();
            this.stopRecording();
        }
    }

    async enumerateAudioDevices() {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            stream.getTracks().forEach(track => track.stop());
            const devices = await navigator.mediaDevices.enumerateDevices();

            const audioInputs = devices.filter(device => device.kind === 'audioinput');

            const uniqueAudioInputs = audioInputs.filter(device =>
                device.deviceId !== 'default' &&
                device.deviceId !== 'communications'
            );

            if (uniqueAudioInputs.length === 0) {
                this.updateStatus('No microphones found. Please connect a microphone.', 'error');
                return;
            }

            this.populateMicrophoneSelects(uniqueAudioInputs);
            this.updateStatus(`${uniqueAudioInputs.length} microphone(s) loaded. Ready to record.`, 'success');
        } catch (error) {
            this.updateStatus('Error accessing microphones. Please grant permission.', 'error');
        }
    }

    populateMicrophoneSelects(audioInputs) {
        const seenGroupIds = new Set();
        const uniqueDevices = audioInputs.filter(device => {
            if (!device.groupId) {
                return true;
            }
            if (seenGroupIds.has(device.groupId)) {
                return false;
            }
            seenGroupIds.add(device.groupId);
            return true;
        });

        while (this.elements.mic1Select.options.length > 1) {
            this.elements.mic1Select.remove(1);
        }
        while (this.elements.mic2Select.options.length > 1) {
            this.elements.mic2Select.remove(1);
        }

        const fragment1 = document.createDocumentFragment();
        const fragment2 = document.createDocumentFragment();

        uniqueDevices.forEach(device => {
            const deviceLabel = device.label || `Microphone ${device.deviceId.slice(0, 8)}`;

            const option1 = document.createElement('option');
            option1.value = device.deviceId;
            option1.textContent = deviceLabel;
            fragment1.appendChild(option1);

            const option2 = document.createElement('option');
            option2.value = device.deviceId;
            option2.textContent = deviceLabel;
            fragment2.appendChild(option2);
        });

        this.elements.mic1Select.appendChild(fragment1);
        this.elements.mic2Select.appendChild(fragment2);
    }

    async startRecording() {
        const mic1Id = this.elements.mic1Select.value;
        const mic2Id = this.elements.mic2Select.value;

        if (!this.validateMicrophoneSelection(mic1Id, mic2Id)) {
            return;
        }

        try {
            this.cleanupPreviousRecordings();
            this.recordedChunks1 = [];
            this.recordedChunks2 = [];

            const stream1 = await this.getAudioStream(mic1Id);
            const stream2 = await this.getAudioStream(mic2Id);

            this.setupAudioVisualization(stream1, stream2);
            await this.initializeMediaRecorders(stream1, stream2);
            this.startMediaRecorders();
            this.updateUIForRecordingState();
            this.startVisualization();
            this.state = RecordingState.RECORDING;
        } catch (error) {
            this.updateStatus('Error starting recording. Check microphone selection.', 'error');
            this.state = RecordingState.IDLE;
        }
    }

    validateMicrophoneSelection(mic1Id, mic2Id) {
        if (!mic1Id || !mic2Id) {
            this.updateStatus('Please select both microphones', 'error');
            this.elements.mic1Select.focus();
            return false;
        }

        if (mic1Id === mic2Id) {
            this.updateStatus('Please select different microphones', 'error');
            this.elements.mic2Select.focus();
            return false;
        }

        return true;
    }

    cleanupPreviousRecordings() {
        if (this.audioUrl1) {
            URL.revokeObjectURL(this.audioUrl1);
            this.audioUrl1 = null;
        }
        if (this.audioUrl2) {
            URL.revokeObjectURL(this.audioUrl2);
            this.audioUrl2 = null;
        }
    }

    async getAudioStream(deviceId) {
        return await navigator.mediaDevices.getUserMedia({
            audio: {
                deviceId: { exact: deviceId },
                echoCancellation: false,
                noiseSuppression: false,
                autoGainControl: false
            }
        });
    }

    setupAudioVisualization(stream1, stream2) {
        this.audioContext = new (window.AudioContext || window.webkitAudioContext)();

        const source1 = this.audioContext.createMediaStreamSource(stream1);
        const source2 = this.audioContext.createMediaStreamSource(stream2);

        this.analyser1 = this.audioContext.createAnalyser();
        this.analyser2 = this.audioContext.createAnalyser();

        this.analyser1.fftSize = 2048;
        this.analyser2.fftSize = 2048;

        const bufferLength = this.analyser1.frequencyBinCount;
        this.dataArray1 = new Uint8Array(bufferLength);
        this.dataArray2 = new Uint8Array(bufferLength);

        source1.connect(this.analyser1);
        source2.connect(this.analyser2);
    }

    startVisualization() {
        const canvas = this.elements.canvas;
        const canvasContext = canvas.getContext('2d');

        canvas.width = canvas.offsetWidth * window.devicePixelRatio;
        canvas.height = canvas.offsetHeight * window.devicePixelRatio;
        canvasContext.scale(window.devicePixelRatio, window.devicePixelRatio);

        const drawWaveform = () => {
            this.animationId = requestAnimationFrame(drawWaveform);

            this.analyser1.getByteTimeDomainData(this.dataArray1);
            this.analyser2.getByteTimeDomainData(this.dataArray2);

            const width = canvas.offsetWidth;
            const height = canvas.offsetHeight;

            canvasContext.fillStyle = getComputedStyle(canvas).backgroundColor;
            canvasContext.fillRect(0, 0, width, height);

            canvasContext.lineWidth = 2;

            canvasContext.beginPath();
            canvasContext.strokeStyle = '#06b6d4';
            const sliceWidth1 = width / this.dataArray1.length;
            let x1 = 0;

            for (let i = 0; i < this.dataArray1.length; i++) {
                const v = this.dataArray1[i] / 128.0;
                const y = (v * height) / 2;

                if (i === 0) {
                    canvasContext.moveTo(x1, y);
                } else {
                    canvasContext.lineTo(x1, y);
                }

                x1 += sliceWidth1;
            }
            canvasContext.stroke();

            canvasContext.beginPath();
            canvasContext.strokeStyle = '#ec4899';
            const sliceWidth2 = width / this.dataArray2.length;
            let x2 = 0;

            for (let i = 0; i < this.dataArray2.length; i++) {
                const v = this.dataArray2[i] / 128.0;
                const y = (v * height) / 2;

                if (i === 0) {
                    canvasContext.moveTo(x2, y);
                } else {
                    canvasContext.lineTo(x2, y);
                }

                x2 += sliceWidth2;
            }
            canvasContext.stroke();
        };

        drawWaveform();
    }

    stopVisualization() {
        if (this.animationId) {
            cancelAnimationFrame(this.animationId);
            this.animationId = null;
        }

        if (this.audioContext) {
            this.audioContext.close();
            this.audioContext = null;
        }

        this.analyser1 = null;
        this.analyser2 = null;
        this.dataArray1 = null;
        this.dataArray2 = null;
    }

    async initializeMediaRecorders(stream1, stream2) {
        this.mediaRecorder1 = new MediaRecorder(stream1, {
            mimeType: this.supportedMimeType
        });
        this.mediaRecorder2 = new MediaRecorder(stream2, {
            mimeType: this.supportedMimeType
        });

        this.mediaRecorder1.ondataavailable = (event) => {
            if (event.data.size > 0) {
                this.recordedChunks1.push(event.data);
            }
        };

        this.mediaRecorder2.ondataavailable = (event) => {
            if (event.data.size > 0) {
                this.recordedChunks2.push(event.data);
            }
        };

        this.mediaRecorder1.onstop = () => {
            this.audioBlob1 = new Blob(this.recordedChunks1, { type: this.supportedMimeType });
            this.audioUrl1 = URL.createObjectURL(this.audioBlob1);
            this.elements.audio1.src = this.audioUrl1;
        };

        this.mediaRecorder2.onstop = () => {
            this.audioBlob2 = new Blob(this.recordedChunks2, { type: this.supportedMimeType });
            this.audioUrl2 = URL.createObjectURL(this.audioBlob2);
            this.elements.audio2.src = this.audioUrl2;
        };
    }

    startMediaRecorders() {
        this.mediaRecorder1.start();
        this.mediaRecorder2.start();
    }

    updateUIForRecordingState() {
        document.getElementById('micForm').classList.add('hidden');
        this.elements.recordBtn.classList.add('hidden');
        this.elements.stopBtn.classList.remove('hidden');
        this.elements.visualizerContainer.classList.remove('hidden');
        this.updateStatus('Recording from both microphones...', 'info');
    }

    stopRecording() {
        this.stopMediaRecorderIfActive(this.mediaRecorder1);
        this.stopMediaRecorderIfActive(this.mediaRecorder2);
        this.stopVisualization();
        this.updateUIForIdleState();
        this.showPlaybackSection();
        this.state = RecordingState.IDLE;
    }

    stopMediaRecorderIfActive(mediaRecorder) {
        if (mediaRecorder && mediaRecorder.state !== 'inactive') {
            mediaRecorder.stop();
            mediaRecorder.stream.getTracks().forEach(track => track.stop());
        }
    }

    updateUIForIdleState() {
        document.getElementById('micForm').classList.remove('hidden');
        this.elements.recordBtn.classList.remove('hidden');
        this.elements.recordBtn.disabled = false;
        this.elements.stopBtn.classList.add('hidden');
        this.elements.visualizerContainer.classList.add('hidden');
    }

    showPlaybackSection() {
        const mic1Name = this.getSelectedMicrophoneName(this.elements.mic1Select);
        const mic2Name = this.getSelectedMicrophoneName(this.elements.mic2Select);

        this.elements.mic1Label.textContent = mic1Name;
        this.elements.mic2Label.textContent = mic2Name;
        this.elements.playbackSection.classList.remove('hidden');
        this.updateStatus('Recording complete. Compare the audio below.', 'success');

        if (typeof lucide !== 'undefined') {
            lucide.createIcons();
        }

        setTimeout(() => {
            this.elements.audio1.focus();
        }, 100);
    }

    getSelectedMicrophoneName(selectElement) {
        return selectElement.options[selectElement.selectedIndex].text;
    }

    downloadRecording(micNumber) {
        const blob = micNumber === 1 ? this.audioBlob1 : this.audioBlob2;
        const micName = micNumber === 1
            ? this.getSelectedMicrophoneName(this.elements.mic1Select)
            : this.getSelectedMicrophoneName(this.elements.mic2Select);

        if (!blob) {
            this.updateStatus('No recording available to download', 'error');
            return;
        }

        const sanitizedMicName = micName.replace(/[^a-z0-9]/gi, '_');
        const fileExtension = MIME_TO_EXTENSION[this.supportedMimeType] || DEFAULT_FILE_EXTENSION;
        const fileName = `${sanitizedMicName}_recording.${fileExtension}`;

        const url = URL.createObjectURL(blob);
        const downloadLink = document.createElement('a');
        downloadLink.href = url;
        downloadLink.download = fileName;
        downloadLink.click();
        URL.revokeObjectURL(url);
    }

    updateStatus(message, type) {
        this.elements.statusDiv.textContent = message;
        this.elements.statusDiv.className = `status status-${type}`;
    }
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => new MicComparisonApp());
} else {
    new MicComparisonApp();
}
