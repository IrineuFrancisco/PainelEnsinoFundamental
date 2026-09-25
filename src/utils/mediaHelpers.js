/**
 * Resilience & Media Helpers (NovoPainelSesi Architecture)
 * Handles offline-first JSON loading, anti-cache timestamps, audio playback with fade-in,
 * Web Audio API synthesize chime generator (when mp3 file is restricted or unavailable),
 * and local storage backups.
 */

const LOCAL_STORAGE_KEY = 'painel_fundamental_data_v1';

export async function loadPanelData() {
  const timestamp = Date.now();
  try {
    const response = await fetch(`/avisos.json?_t=${timestamp}`, { cache: 'no-store' });
    if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
    const data = await response.json();
    // Cache data in localStorage for 100% offline fallback
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(data));
    return { data, source: 'network' };
  } catch (err) {
    console.warn('[OfflineFirst] Erro ao carregar do servidor/JSON local. Recorrendo ao localStorage:', err);
    const cached = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (cached) {
      try {
        return { data: JSON.parse(cached), source: 'cache' };
      } catch (e) {
        console.error('Erro ao analisar cache local:', e);
      }
    }
    return { data: null, source: 'error' };
  }
}

export function savePanelDataToLocal(data) {
  try {
    data.ultimaAtualizacao = new Date().toISOString();
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(data));
    return true;
  } catch (err) {
    console.error('Erro ao salvar no localStorage:', err);
    return false;
  }
}

/**
 * Toca sinal sonoro com Fade-In suave (Web Audio API ou Audio element)
 * Inicia com volume 0.0 e eleva suavemente até maxVolume em durationSecs
 */
export function playChimeWithFadeIn({ durationSecs = 4, maxVolume = 0.8, type = 'chime' } = {}) {
  try {
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    if (!AudioContext) return;

    const ctx = new AudioContext();
    if (ctx.state === 'suspended') {
      ctx.resume();
    }

    const now = ctx.currentTime;
    const masterGain = ctx.createGain();
    
    // Inicia em 0.0 e faz fade-in até maxVolume em 0.8 segundos
    masterGain.gain.setValueAtTime(0.001, now);
    masterGain.gain.exponentialRampToValueAtTime(maxVolume, now + 0.8);
    // Suaviza o fade-out ao final
    masterGain.gain.exponentialRampToValueAtTime(0.001, now + durationSecs);
    masterGain.connect(ctx.destination);

    // Frequências harmoniosas (Notas Dós, Mi, Sol - C5, E5, G5, C6) para sinal escolar suave
    const freqs = [523.25, 659.25, 783.99, 1046.50];
    
    freqs.forEach((freq, idx) => {
      const osc = ctx.createOscillator();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, now + idx * 0.15);
      
      const noteGain = ctx.createGain();
      noteGain.gain.setValueAtTime(0.001, now + idx * 0.15);
      noteGain.gain.exponentialRampToValueAtTime(0.6, now + idx * 0.15 + 0.1);
      noteGain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.15 + 1.2);
      
      osc.connect(noteGain);
      noteGain.connect(masterGain);
      
      osc.start(now + idx * 0.15);
      osc.stop(now + idx * 0.15 + 1.3);
    });

    setTimeout(() => {
      ctx.close();
    }, (durationSecs + 1) * 1000);
  } catch (err) {
    console.warn('Não foi possível sintetizar áudio via Web Audio API:', err);
  }
}

let activeAudioInstance = null;

/**
 * Toca arquivo de áudio MP3 (ex: bom dia.mp3, comer comer.mp3) com efeito Fade-In suave
 * Suporta callback onEnded para fechar telas de alerta automaticamente no final do som
 */
export function playAlertAudio(audioPath, { fadeDurationSecs = 1.2, maxVolume = 0.95, onEnded = null } = {}) {
  try {
    stopAlertAudio();

    if (!audioPath) {
      playChimeWithFadeIn({ durationSecs: 5 });
      if (onEnded) setTimeout(onEnded, 6000);
      return;
    }

    const audio = new Audio(encodeURI(audioPath));
    audio.volume = 0;
    activeAudioInstance = audio;

    if (onEnded) {
      audio.onended = () => {
        onEnded();
      };
    }

    const playPromise = audio.play();
    if (playPromise !== undefined) {
      playPromise.then(() => {
        const intervalMs = 50;
        const steps = (fadeDurationSecs * 1000) / intervalMs;
        const volStep = maxVolume / steps;
        let count = 0;

        const timer = setInterval(() => {
          count++;
          if (activeAudioInstance === audio && !audio.paused && audio.volume + volStep <= maxVolume) {
            audio.volume = Math.min(maxVolume, audio.volume + volStep);
          }
          if (count >= steps) {
            clearInterval(timer);
          }
        }, intervalMs);
      }).catch(err => {
        console.warn('Autoplay com MP3 travado pelo navegador. Usando sintetizador Web Audio API:', err);
        playChimeWithFadeIn({ durationSecs: 5 });
        if (onEnded) setTimeout(onEnded, 6000);
      });
    }
  } catch (err) {
    console.error('Erro ao reproduzir áudio do alerta:', err);
    playChimeWithFadeIn({ durationSecs: 5 });
    if (onEnded) setTimeout(onEnded, 6000);
  }
}

/**
 * Para qualquer áudio ativo
 */
export function stopAlertAudio() {
  if (activeAudioInstance) {
    try {
      activeAudioInstance.pause();
      activeAudioInstance.currentTime = 0;
    } catch (e) {}
    activeAudioInstance = null;
  }
}

