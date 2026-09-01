import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import AsyncStorage from '@react-native-async-storage/async-storage';
import en from './en.json';
import gu from './gu.json';

const LANGUAGE_KEY = 'user_selected_language';

const resources = {
  en: { translation: en },
  gu: { translation: gu },
};

i18n
  .use(initReactI18next)
  .init({
    compatibilityJSON: 'v3',
    resources,
    lng: 'en', // default language
    fallbackLng: 'en',
    interpolation: {
      escapeValue: false,
    },
  });

// Load saved language preference
export const loadSavedLanguage = async (): Promise<void> => {
  try {
    const saved = await AsyncStorage.getItem(LANGUAGE_KEY);
    if (saved && (saved === 'en' || saved === 'gu')) {
      await i18n.changeLanguage(saved);
    }
  } catch (error) {
    console.warn('Failed to load language from storage', error);
  }
};

// Set and persist language
export const changeAppLanguage = async (lng: 'en' | 'gu'): Promise<void> => {
  try {
    await i18n.changeLanguage(lng);
    await AsyncStorage.setItem(LANGUAGE_KEY, lng);
  } catch (error) {
    console.warn('Failed to change app language', error);
  }
};

export default i18n;
