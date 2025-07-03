
// Simple translation service for common Nepal license terms
export interface TranslationResult {
  originalText: string;
  translatedText: string;
  language: 'nepali' | 'english';
  confidence: number;
}

class TranslationService {
  private nepaliToEnglish: Record<string, string> = {
    // Common Nepal license terms
    'चालक अनुमतिपत्र': 'Driving License',
    'नाम': 'Name',
    'पूरा नाम': 'Full Name',
    'ठेगाना': 'Address',
    'जन्म मिति': 'Date of Birth',
    'फोन नम्बर': 'Phone Number',
    'नागरिकता नम्बर': 'Citizenship Number',
    'जारी मिति': 'Issue Date',
    'सकिने मिति': 'Expiry Date',
    'जारी गर्ने निकाय': 'Issuing Authority',
    'यातायात व्यवस्थापन कार्यालय': 'Transport Management Office',
    'काठमाडौं': 'Kathmandu',
    'पोखरा': 'Pokhara',
    'चितवन': 'Chitwan',
    'बुटवल': 'Butwal',
    'नेपालगञ्ज': 'Nepalgunj',
    'धनगढी': 'Dhangadhi',
    'विराटनगर': 'Biratnagar',
    'मोटरसाइकल': 'Motorcycle',
    'कार': 'Car',
    'बस': 'Bus',
    'ट्रक': 'Truck'
  };

  private englishToNepali: Record<string, string> = {};

  constructor() {
    // Create reverse mapping
    Object.entries(this.nepaliToEnglish).forEach(([nepali, english]) => {
      this.englishToNepali[english.toLowerCase()] = nepali;
    });
  }

  translateText(text: string): TranslationResult {
    const cleanText = text.trim();
    
    // Check if text contains Nepali characters
    const hasNepali = /[\u0900-\u097F]/.test(cleanText);
    
    if (hasNepali) {
      // Translate from Nepali to English
      let translatedText = cleanText;
      let confidence = 0.5;
      
      Object.entries(this.nepaliToEnglish).forEach(([nepali, english]) => {
        if (cleanText.includes(nepali)) {
          translatedText = translatedText.replace(nepali, english);
          confidence = Math.min(confidence + 0.2, 0.9);
        }
      });
      
      return {
        originalText: cleanText,
        translatedText,
        language: 'nepali',
        confidence
      };
    } else {
      // Check if it's English that could be translated to Nepali
      const lowerText = cleanText.toLowerCase();
      let translatedText = cleanText;
      let confidence = 0.3;
      
      Object.entries(this.englishToNepali).forEach(([english, nepali]) => {
        if (lowerText.includes(english)) {
          translatedText = translatedText.replace(new RegExp(english, 'gi'), nepali);
          confidence = Math.min(confidence + 0.2, 0.8);
        }
      });
      
      return {
        originalText: cleanText,
        translatedText,
        language: 'english',
        confidence
      };
    }
  }

  detectLanguage(text: string): 'nepali' | 'english' | 'mixed' {
    const hasNepali = /[\u0900-\u097F]/.test(text);
    const hasEnglish = /[a-zA-Z]/.test(text);
    
    if (hasNepali && hasEnglish) return 'mixed';
    if (hasNepali) return 'nepali';
    return 'english';
  }
}

export const translationService = new TranslationService();
