class AudioManager {
    constructor() {
        this.ctx = new (window.AudioContext || window.webkitAudioContext)();
    }

    playShutter() {
        if (this.ctx.state === 'suspended') {
            this.ctx.resume();
        }

        const t = this.ctx.currentTime;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        const noise = this.ctx.createBufferSource();

        // Mechanical "Clunk"
        osc.frequency.setValueAtTime(100, t);
        osc.frequency.exponentialRampToValueAtTime(0.01, t + 0.1);
        osc.type = 'square';

        gain.gain.setValueAtTime(0.3, t);
        gain.gain.exponentialRampToValueAtTime(0.01, t + 0.1);

        osc.connect(gain);
        gain.connect(this.ctx.destination);

        osc.start(t);
        osc.stop(t + 0.1);

        // High pitch "Flash" capacitor discharge sound
        const osc2 = this.ctx.createOscillator();
        const gain2 = this.ctx.createGain();
        osc2.frequency.setValueAtTime(8000, t);
        osc2.frequency.exponentialRampToValueAtTime(1000, t + 0.05);
        osc2.type = 'sine';
        gain2.gain.setValueAtTime(0.1, t);
        gain2.gain.exponentialRampToValueAtTime(0.01, t + 0.05);

        osc2.connect(gain2);
        gain2.connect(this.ctx.destination);

        osc2.start(t);
        osc2.stop(t + 0.05);
    }
}
