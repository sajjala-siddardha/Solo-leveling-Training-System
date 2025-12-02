
// Synthesized Audio System for "The System"
// No external files required. Uses Web Audio API.

class SoundService {
  private context: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private enabled: boolean = true;

  constructor() {
    // Context is initialized lazily to comply with browser autoplay policies
  }

  private init() {
    if (!this.context) {
      this.context = new (window.AudioContext || (window as any).webkitAudioContext)();
      this.masterGain = this.context.createGain();
      this.masterGain.gain.value = 0.3; // Default volume
      this.masterGain.connect(this.context.destination);
    }
    if (this.context.state === 'suspended') {
      this.context.resume();
    }
  }

  public setEnabled(enabled: boolean) {
    this.enabled = enabled;
  }

  public playClick() {
    if (!this.enabled) return;
    this.init();
    if (!this.context || !this.masterGain) return;

    const osc = this.context.createOscillator();
    const gain = this.context.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(800, this.context.currentTime);
    osc.frequency.exponentialRampToValueAtTime(1200, this.context.currentTime + 0.05);

    gain.gain.setValueAtTime(0.5, this.context.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, this.context.currentTime + 0.05);

    osc.connect(gain);
    gain.connect(this.masterGain);

    osc.start();
    osc.stop(this.context.currentTime + 0.05);
  }

  public playConfirm() {
    if (!this.enabled) return;
    this.init();
    if (!this.context || !this.masterGain) return;

    const osc = this.context.createOscillator();
    const gain = this.context.createGain();

    osc.type = 'square';
    osc.frequency.setValueAtTime(440, this.context.currentTime);
    osc.frequency.setValueAtTime(880, this.context.currentTime + 0.1);

    gain.gain.setValueAtTime(0.1, this.context.currentTime);
    gain.gain.linearRampToValueAtTime(0.1, this.context.currentTime + 0.1);
    gain.gain.exponentialRampToValueAtTime(0.001, this.context.currentTime + 0.3);

    osc.connect(gain);
    gain.connect(this.masterGain);

    osc.start();
    osc.stop(this.context.currentTime + 0.3);
  }

  public playError() {
    if (!this.enabled) return;
    this.init();
    if (!this.context || !this.masterGain) return;

    const osc = this.context.createOscillator();
    const gain = this.context.createGain();

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(150, this.context.currentTime);
    osc.frequency.linearRampToValueAtTime(100, this.context.currentTime + 0.2);

    gain.gain.setValueAtTime(0.2, this.context.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, this.context.currentTime + 0.3);

    osc.connect(gain);
    gain.connect(this.masterGain);

    osc.start();
    osc.stop(this.context.currentTime + 0.3);
  }

  public playLevelUp() {
    if (!this.enabled) return;
    this.init();
    if (!this.context || !this.masterGain) return;

    const now = this.context.currentTime;

    // Bass thrum
    const oscBass = this.context.createOscillator();
    const gainBass = this.context.createGain();
    oscBass.type = 'triangle';
    oscBass.frequency.setValueAtTime(50, now);
    oscBass.frequency.linearRampToValueAtTime(100, now + 1);
    gainBass.gain.setValueAtTime(0.5, now);
    gainBass.gain.linearRampToValueAtTime(0, now + 1.5);
    oscBass.connect(gainBass);
    gainBass.connect(this.masterGain);
    oscBass.start();
    oscBass.stop(now + 1.5);

    // High shimmer arpeggio
    [440, 554, 659, 880, 1108].forEach((freq, i) => {
        const osc = this.context!.createOscillator();
        const gain = this.context!.createGain();
        osc.type = 'sine';
        osc.frequency.value = freq;
        
        const startTime = now + (i * 0.1);
        gain.gain.setValueAtTime(0, startTime);
        gain.gain.linearRampToValueAtTime(0.1, startTime + 0.05);
        gain.gain.exponentialRampToValueAtTime(0.001, startTime + 0.5);

        osc.connect(gain);
        gain.connect(this.masterGain!);
        osc.start(startTime);
        osc.stop(startTime + 0.5);
    });
  }

  public playNotification() {
    if (!this.enabled) return;
    this.init();
    if (!this.context || !this.masterGain) return;

    // "Ping-ping"
    const now = this.context.currentTime;
    
    const playPing = (time: number, freq: number) => {
        const osc = this.context!.createOscillator();
        const gain = this.context!.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, time);
        gain.gain.setValueAtTime(0, time);
        gain.gain.linearRampToValueAtTime(0.2, time + 0.01);
        gain.gain.exponentialRampToValueAtTime(0.001, time + 0.5);
        osc.connect(gain);
        gain.connect(this.masterGain!);
        osc.start(time);
        osc.stop(time + 0.5);
    }

    playPing(now, 1200);
    playPing(now + 0.15, 1800);
  }

  public playAlarm() {
    if (!this.enabled) return;
    this.init();
    if (!this.context || !this.masterGain) return;
    
    const now = this.context.currentTime;
    const osc = this.context.createOscillator();
    const gain = this.context.createGain();

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(400, now);
    osc.frequency.linearRampToValueAtTime(200, now + 0.5); // Siren drop

    gain.gain.setValueAtTime(0.5, now);
    gain.gain.linearRampToValueAtTime(0, now + 0.8);

    osc.connect(gain);
    gain.connect(this.masterGain);
    
    osc.start(now);
    osc.stop(now + 0.8);
  }
}

export const soundService = new SoundService();
