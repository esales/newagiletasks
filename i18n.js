import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import * as RNLocalize from 'react-native-localize';

// 🔹 Importa os arquivos de tradução
import en from './locales/en.json';
import es from './locales/es.json';
import ptbr from './locales/ptbr.json';

// 🔹 Inicializa o i18next
i18n
  .use(initReactI18next)
  .init({
    compatibilityJSON: 'v3', // evita warning de compatibilidade
    resources: {
      en: { translation: en },
      es: { translation: es },
      ptbr: { translation: ptbr },
    },
    lng: 'en',          // idioma padrão
    fallbackLng: 'en',  // caso não encontre tradução
    interpolation: { escapeValue: false },
  });

// 🔹 Detecta o idioma do dispositivo e altera automaticamente
try {
  const locales = RNLocalize.getLocales();

  if (Array.isArray(locales) && locales.length > 0) {
    const tag = locales[0].languageTag.toLowerCase();

    let lang = 'en'; // padrão

    if (tag.startsWith('pt')) lang = 'ptbr';
    else if (tag.startsWith('es')) lang = 'es';
    else if (tag.startsWith('en')) lang = 'en';

    i18n.changeLanguage(lang);
  }
} catch (error) {
  console.warn('Erro ao detectar idioma:', error);
}

export default i18n;