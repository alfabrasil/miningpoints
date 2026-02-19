// --- AUDIO ENGINE (WEB AUDIO API) ---
export const SoundManager = {
    ctx: null,
    musicOscillators: [],
    isPlayingMusic: false,

    init: () => {
        if (!SoundManager.ctx) {
            SoundManager.ctx = new (window.AudioContext || window.webkitAudioContext)();
        }
        if (SoundManager.ctx.state === 'suspended') {
            SoundManager.ctx.resume();
        }
    },

    playTone: (freq, type, duration, vol = 0.1) => {
        try {
            SoundManager.init();
            if (!SoundManager.ctx) return;
            const osc = SoundManager.ctx.createOscillator();
            const gain = SoundManager.ctx.createGain();
            osc.type = type;
            osc.frequency.setValueAtTime(freq, SoundManager.ctx.currentTime);
            gain.gain.setValueAtTime(vol, SoundManager.ctx.currentTime);
            gain.gain.exponentialRampToValueAtTime(0.01, SoundManager.ctx.currentTime + duration);
            osc.connect(gain);
            gain.connect(SoundManager.ctx.destination);
            osc.start();
            osc.stop(SoundManager.ctx.currentTime + duration);
        } catch (e) { console.error("Audio error", e); }
    },

    playJump: () => {
        SoundManager.playTone(150, 'square', 0.1, 0.05);
        setTimeout(() => SoundManager.playTone(300, 'square', 0.1, 0.05), 50);
    },

    playCoin: () => {
        SoundManager.playTone(1200, 'sine', 0.1, 0.05);
        setTimeout(() => SoundManager.playTone(1800, 'sine', 0.1, 0.05), 50);
    },

    playGameOver: () => {
        SoundManager.playTone(300, 'sawtooth', 0.5, 0.2);
        setTimeout(() => SoundManager.playTone(200, 'sawtooth', 0.5, 0.2), 200);
        setTimeout(() => SoundManager.playTone(100, 'sawtooth', 1.0, 0.2), 400);
    },

    startMusic: () => {
        if (SoundManager.isPlayingMusic) return;
        SoundManager.init();
        SoundManager.isPlayingMusic = true;
        
        // Simple 8-bit Bassline Loop
        const bassFreqs = [110, 110, 130, 110, 164, 146, 110, 98]; // A2 scaleish
        let noteIndex = 0;

        const playNote = () => {
            if (!SoundManager.isPlayingMusic) return;
            const osc = SoundManager.ctx.createOscillator();
            const gain = SoundManager.ctx.createGain();
            osc.type = 'square'; // 8-bit feel
            osc.frequency.setValueAtTime(bassFreqs[noteIndex], SoundManager.ctx.currentTime);
            
            gain.gain.setValueAtTime(0.03, SoundManager.ctx.currentTime);
            gain.gain.exponentialRampToValueAtTime(0.001, SoundManager.ctx.currentTime + 0.2);
            
            osc.connect(gain);
            gain.connect(SoundManager.ctx.destination);
            osc.start();
            osc.stop(SoundManager.ctx.currentTime + 0.2);

            noteIndex = (noteIndex + 1) % bassFreqs.length;
            SoundManager.musicTimeout = setTimeout(playNote, 250); // 120 BPM ish
        };
        playNote();
    },

    stopMusic: () => {
        SoundManager.isPlayingMusic = false;
        if (SoundManager.musicTimeout) clearTimeout(SoundManager.musicTimeout);
    }
};
