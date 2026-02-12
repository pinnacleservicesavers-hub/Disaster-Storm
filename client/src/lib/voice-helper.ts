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

    const response = await fetch('/api/closebot/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        message: `Say the following naturally in 1-2 short sentences as Rachel, keeping it warm and conversational: ${text}`,
        history: [],
        context: { leadName: "user", companyName: "the company", trade: "general" },
        enableVoice: true,
      })
    });

    if (!response.ok) {
      throw new Error('Voice request failed');
    }

    const data = await response.json();

    if (data.audioUrl) {
      currentAudio = new Audio(data.audioUrl);

      currentAudio.onended = () => {
        isPlayingState = false;
        currentAudio = null;
        options?.onEnd?.();
      };

      currentAudio.onerror = () => {
        isPlayingState = false;
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
  window.speechSynthesis?.cancel();
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
