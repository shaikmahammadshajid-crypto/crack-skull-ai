export type AssistantLanguageCode =
  | 'auto'
  | 'en-US'
  | 'hi-IN'
  | 'te-IN'
  | 'ta-IN'
  | 'kn-IN'
  | 'ml-IN'
  | 'bn-IN'
  | 'mr-IN'
  | 'gu-IN'
  | 'ur-IN'
  | 'es-ES'
  | 'fr-FR'
  | 'ar-SA';

export interface AssistantLanguage {
  code: AssistantLanguageCode;
  label: string;
  nativeLabel: string;
  speechLang: string;
  promptName: string;
}

export const assistantLanguages: AssistantLanguage[] = [
  { code: 'auto', label: 'Auto Detect', nativeLabel: 'Auto', speechLang: 'en-US', promptName: 'the same language as the student, auto-detected from their message' },
  { code: 'en-US', label: 'English', nativeLabel: 'English', speechLang: 'en-US', promptName: 'English' },
  { code: 'hi-IN', label: 'Hindi', nativeLabel: 'हिन्दी', speechLang: 'hi-IN', promptName: 'Hindi' },
  { code: 'te-IN', label: 'Telugu', nativeLabel: 'తెలుగు', speechLang: 'te-IN', promptName: 'Telugu' },
  { code: 'ta-IN', label: 'Tamil', nativeLabel: 'தமிழ்', speechLang: 'ta-IN', promptName: 'Tamil' },
  { code: 'kn-IN', label: 'Kannada', nativeLabel: 'ಕನ್ನಡ', speechLang: 'kn-IN', promptName: 'Kannada' },
  { code: 'ml-IN', label: 'Malayalam', nativeLabel: 'മലയാളം', speechLang: 'ml-IN', promptName: 'Malayalam' },
  { code: 'bn-IN', label: 'Bengali', nativeLabel: 'বাংলা', speechLang: 'bn-IN', promptName: 'Bengali' },
  { code: 'mr-IN', label: 'Marathi', nativeLabel: 'मराठी', speechLang: 'mr-IN', promptName: 'Marathi' },
  { code: 'gu-IN', label: 'Gujarati', nativeLabel: 'ગુજરાતી', speechLang: 'gu-IN', promptName: 'Gujarati' },
  { code: 'ur-IN', label: 'Urdu', nativeLabel: 'اردو', speechLang: 'ur-IN', promptName: 'Urdu' },
  { code: 'es-ES', label: 'Spanish', nativeLabel: 'Español', speechLang: 'es-ES', promptName: 'Spanish' },
  { code: 'fr-FR', label: 'French', nativeLabel: 'Français', speechLang: 'fr-FR', promptName: 'French' },
  { code: 'ar-SA', label: 'Arabic', nativeLabel: 'العربية', speechLang: 'ar-SA', promptName: 'Arabic' },
];

export function getAssistantLanguage(code?: string): AssistantLanguage {
  return assistantLanguages.find(language => language.code === code) || assistantLanguages[0];
}

export function getPreferredSpeechLang(code?: string): string {
  return getAssistantLanguage(code).speechLang;
}
