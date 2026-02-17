let currentAudio: HTMLAudioElement | null = null;
let isPlayingState = false;

interface SpeakOptions {
  onStart?: () => void;
  onEnd?: () => void;
  onError?: (error: Error) => void;
}

export async function speakWithAI(
  text: string,
  options?: SpeakOptions
): Promise<void> {
  if (!text || text.trim().length === 0) return;

  try {
    stopSpeaking();
    options?.onStart?.();
    isPlayingState = true;

    const response = await fetch('/api/tts', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text: text.trim() })
    });

    if (!response.ok) {
      throw new Error('Voice request failed');
    }

    const data = await response.json();

    if (data.audioBase64) {
      const format = data.format || 'mp3';
      const audioBlob = new Blob(
        [Uint8Array.from(atob(data.audioBase64), c => c.charCodeAt(0))],
        { type: `audio/${format}` }
      );
      const audioUrl = URL.createObjectURL(audioBlob);
      currentAudio = new Audio(audioUrl);

      currentAudio.onended = () => {
        isPlayingState = false;
        URL.revokeObjectURL(audioUrl);
        currentAudio = null;
        options?.onEnd?.();
      };

      currentAudio.onerror = () => {
        isPlayingState = false;
        URL.revokeObjectURL(audioUrl);
        currentAudio = null;
        options?.onError?.(new Error('Audio playback failed'));
        options?.onEnd?.();
      };

      await currentAudio.play();
    } else {
      isPlayingState = false;
      options?.onEnd?.();
    }
  } catch (error) {
    console.error('Rachel voice error:', error);
    isPlayingState = false;
    options?.onError?.(error as Error);
    options?.onEnd?.();
  }
}

export function stopSpeaking(): void {
  if (currentAudio) {
    currentAudio.pause();
    currentAudio.currentTime = 0;
    currentAudio = null;
  }
  isPlayingState = false;
}

export function isSpeaking(): boolean {
  return isPlayingState || (currentAudio !== null && !currentAudio.paused);
}

export function speakNaturally(
  text: string,
  _voices?: any,
  options?: {
    onStart?: () => void;
    onEnd?: () => void;
    pitch?: number;
    rate?: number;
  }
): void {
  speakWithAI(text, {
    onStart: options?.onStart,
    onEnd: options?.onEnd
  });
}

export function getBestFemaleVoice(_voices: any[]): any {
  return null;
}

export function makeTextNatural(text: string): string {
  return text.trim();
}

export function createVoiceHook() {
  let isActive = false;

  return {
    speak: (text: string, callbacks?: { onStart?: () => void; onEnd?: () => void }) => {
      speakWithAI(text, {
        onStart: () => {
          isActive = true;
          callbacks?.onStart?.();
        },
        onEnd: () => {
          isActive = false;
          callbacks?.onEnd?.();
        }
      });
    },
    stop: () => {
      stopSpeaking();
      isActive = false;
    },
    isActive: () => isActive || isSpeaking(),
    getVoices: () => []
  };
}
