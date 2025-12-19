let currentAudio: HTMLAudioElement | null = null;
let isPlaying = false;

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
    isPlaying = true;

    const response = await fetch('/api/tts', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text })
    });

    if (!response.ok) {
      const errorData = await response.json();
      if (errorData.fallback) {
        console.warn('ElevenLabs unavailable, falling back to browser voice');
        speakWithBrowserVoice(text, options);
        return;
      }
      throw new Error(errorData.error || 'TTS request failed');
    }

    const data = await response.json();
    
    const audioBlob = base64ToBlob(data.audioBase64, 'audio/mpeg');
    const audioUrl = URL.createObjectURL(audioBlob);
    
    currentAudio = new Audio(audioUrl);
    
    currentAudio.onended = () => {
      isPlaying = false;
      URL.revokeObjectURL(audioUrl);
      currentAudio = null;
      options?.onEnd?.();
    };

    currentAudio.onerror = () => {
      isPlaying = false;
      URL.revokeObjectURL(audioUrl);
      currentAudio = null;
      console.warn('Audio playback failed, falling back to browser voice');
      speakWithBrowserVoice(text, options);
    };

    await currentAudio.play();

  } catch (error) {
    console.error('AI TTS error:', error);
    isPlaying = false;
    speakWithBrowserVoice(text, options);
  }
}

function base64ToBlob(base64: string, mimeType: string): Blob {
  const byteCharacters = atob(base64);
  const byteNumbers = new Array(byteCharacters.length);
  for (let i = 0; i < byteCharacters.length; i++) {
    byteNumbers[i] = byteCharacters.charCodeAt(i);
  }
  const byteArray = new Uint8Array(byteNumbers);
  return new Blob([byteArray], { type: mimeType });
}

export function stopSpeaking(): void {
  if (currentAudio) {
    currentAudio.pause();
    currentAudio.currentTime = 0;
    currentAudio = null;
  }
  window.speechSynthesis?.cancel();
  isPlaying = false;
}

export function isSpeaking(): boolean {
  return isPlaying || (currentAudio !== null && !currentAudio.paused);
}

function speakWithBrowserVoice(text: string, options?: SpeakOptions): void {
  if (!window.speechSynthesis) {
    options?.onError?.(new Error('Speech synthesis not supported'));
    options?.onEnd?.();
    return;
  }

  window.speechSynthesis.cancel();
  
  const utterance = new SpeechSynthesisUtterance(text);
  const voices = window.speechSynthesis.getVoices();
  const voice = getBestFemaleVoice(voices);
  
  if (voice) {
    utterance.voice = voice;
  }
  
  utterance.pitch = 1.05;
  utterance.rate = 0.92;
  utterance.volume = 1.0;

  utterance.onstart = () => {
    isPlaying = true;
    options?.onStart?.();
  };
  
  utterance.onend = () => {
    isPlaying = false;
    options?.onEnd?.();
  };

  utterance.onerror = () => {
    isPlaying = false;
    options?.onError?.(new Error('Speech synthesis error'));
    options?.onEnd?.();
  };

  window.speechSynthesis.speak(utterance);
}

export function getBestFemaleVoice(voices: SpeechSynthesisVoice[]): SpeechSynthesisVoice | null {
  const preferredVoices = [
    'Samantha',
    'Karen', 
    'Moira',
    'Tessa',
    'Zira',
    'Jenny',
    'Aria',
    'Sara',
    'Google US English Female',
    'Microsoft Zira',
    'Microsoft Jenny',
  ];
  
  for (const name of preferredVoices) {
    const voice = voices.find(v => v.name.includes(name));
    if (voice) return voice;
  }
  
  const femaleVoice = voices.find(v => 
    v.name.toLowerCase().includes('female') || 
    v.name.includes('Samantha') ||
    v.name.includes('Karen')
  );
  if (femaleVoice) return femaleVoice;
  
  return voices.find(v => v.lang.startsWith('en')) || voices[0];
}

export function makeTextNatural(text: string): string {
  return text
    .replace(/\. /g, '... ')
    .replace(/! /g, '!... ')
    .replace(/\? /g, '?... ')
    .replace(/, /g, ',, ')
    .replace(/:/g, '...')
    .trim();
}

export function speakNaturally(
  text: string, 
  voices: SpeechSynthesisVoice[],
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
    getVoices: () => window.speechSynthesis?.getVoices() || []
  };
}
