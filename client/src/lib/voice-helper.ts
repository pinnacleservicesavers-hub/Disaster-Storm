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
  if (voices.length === 0) return;
  
  window.speechSynthesis.cancel();
  
  const naturalText = makeTextNatural(text);
  const utterance = new SpeechSynthesisUtterance(naturalText);
  
  const voice = getBestFemaleVoice(voices);
  if (voice) {
    utterance.voice = voice;
  }
  
  utterance.pitch = options?.pitch ?? 1.05;
  utterance.rate = options?.rate ?? 0.92;
  utterance.volume = 1.0;
  
  if (options?.onStart) {
    utterance.onstart = options.onStart;
  }
  if (options?.onEnd) {
    utterance.onend = options.onEnd;
  }
  
  window.speechSynthesis.speak(utterance);
}

export function createVoiceHook() {
  let voices: SpeechSynthesisVoice[] = [];
  let isActive = false;
  
  const loadVoices = () => {
    voices = window.speechSynthesis.getVoices();
  };
  
  if (typeof window !== 'undefined') {
    loadVoices();
    window.speechSynthesis.onvoiceschanged = loadVoices;
  }
  
  return {
    speak: (text: string, callbacks?: { onStart?: () => void; onEnd?: () => void }) => {
      speakNaturally(text, voices, {
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
      window.speechSynthesis.cancel();
      isActive = false;
    },
    isActive: () => isActive,
    getVoices: () => voices
  };
}
