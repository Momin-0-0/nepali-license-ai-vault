// Nepal-specific license patterns and validation
export const NEPAL_LICENSE_PATTERNS = {
  // Standard Nepal license format: XX-XX-XXXXXXXXX
  STANDARD: /^(\d{2})-(\d{2})-(\d{9})$/,
  
  // Alternative formats
  ALTERNATIVE_1: /^(\d{2})-(\d{2})-(\d{8})$/,
  ALTERNATIVE_2: /^(\d{2})-(\d{2})-(\d{7})$/,
  
  // Numeric only
  NUMERIC_ONLY: /^(\d{11,13})$/,
};

export const NEPAL_DATE_PATTERNS = {
  // Nepal uses DD-MM-YYYY format
  STANDARD: /^(\d{1,2})-(\d{1,2})-(\d{4})$/,
  SLASH_FORMAT: /^(\d{1,2})\/(\d{1,2})\/(\d{4})$/,
  SHORT_YEAR: /^(\d{1,2})-(\d{1,2})-(\d{2})$/,
};

export const NEPAL_PROVINCES = [
  'Province No. 1',
  'Madhesh Province', 
  'Bagmati Province',
  'Gandaki Province',
  'Lumbini Province',
  'Karnali Province',
  'Sudurpashchim Province'
];

export const NEPAL_DISTRICTS = [
  'Kathmandu', 'Lalitpur', 'Bhaktapur', 'Chitwan', 'Pokhara',
  'Butwal', 'Nepalgunj', 'Dhangadhi', 'Biratnagar', 'Janakpur',
  'Hetauda', 'Gorkha', 'Lamjung', 'Tanahun', 'Syangja',
  'Parbat', 'Baglung', 'Myagdi', 'Mustang', 'Manang'
];

export const COMMON_NEPAL_NAMES = [
  // Common first names
  'Ram', 'Shyam', 'Hari', 'Krishna', 'Gopal', 'Bishnu', 'Shiva',
  'Ganesh', 'Lakshmi', 'Saraswati', 'Durga', 'Parvati', 'Sita',
  'Gita', 'Rita', 'Sunita', 'Anita', 'Binita', 'Sangita',
  
  // Common surnames
  'Sharma', 'Shrestha', 'Tamang', 'Gurung', 'Magar', 'Rai',
  'Limbu', 'Sherpa', 'Thapa', 'Poudel', 'Adhikari', 'Khadka',
  'Bhattarai', 'Acharya', 'Pandey', 'Joshi', 'Regmi', 'Koirala'
];

export const validateNepalLicenseNumber = (licenseNumber: string): boolean => {
  const cleaned = licenseNumber.replace(/[-\s]/g, '');
  
  // Check if it matches Nepal patterns
  for (const pattern of Object.values(NEPAL_LICENSE_PATTERNS)) {
    if (pattern.test(licenseNumber) || pattern.test(cleaned)) {
      return true;
    }
  }
  
  return false;
};

export const formatNepalLicenseNumber = (licenseNumber: string): string => {
  const cleaned = licenseNumber.replace(/[-\s]/g, '');
  
  if (cleaned.length >= 11) {
    return `${cleaned.substring(0, 2)}-${cleaned.substring(2, 4)}-${cleaned.substring(4)}`;
  }
  
  return licenseNumber;
};

export const parseNepalDate = (dateString: string): Date | null => {
  // Try different Nepal date formats
  for (const pattern of Object.values(NEPAL_DATE_PATTERNS)) {
    const match = dateString.match(pattern);
    if (match) {
      let [, day, month, year] = match;
      
      // Handle 2-digit years
      if (year.length === 2) {
        const yearNum = parseInt(year);
        year = yearNum > 50 ? '19' + year : '20' + year;
      }
      
      // Nepal format is DD-MM-YYYY, convert to ISO format
      const isoDate = `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
      const date = new Date(isoDate);
      
      if (!isNaN(date.getTime())) {
        return date;
      }
    }
  }
  
  return null;
};

export const isValidNepalName = (name: string): boolean => {
  // Check if name contains common Nepal name patterns
  const words = name.split(' ');
  
  // Should have at least first and last name
  if (words.length < 2) return false;
  
  // Check against common Nepal names
  const hasCommonName = words.some(word => 
    COMMON_NEPAL_NAMES.some(commonName => 
      commonName.toLowerCase() === word.toLowerCase()
    )
  );
  
  // Basic validation
  const isValidFormat = /^[A-Za-z\s\.]+$/.test(name) && 
                       name.length >= 3 && 
                       name.length <= 50;
  
  return isValidFormat && (hasCommonName || words.length >= 2);
};

export const extractNepalAddress = (text: string): string | null => {
  const addressKeywords = ['Address', 'ठेगाना'];
  const lines = text.split('\n');
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    
    // Check if line contains address keyword
    if (addressKeywords.some(keyword => line.includes(keyword))) {
      // Get the address part after the keyword
      let address = line.split(/Address|ठेगाना/)[1]?.trim();
      
      // If address continues on next lines, include them
      if (address && i + 1 < lines.length) {
        const nextLine = lines[i + 1].trim();
        if (nextLine && !nextLine.includes('Phone') && !nextLine.includes('Category')) {
          address += ', ' + nextLine;
        }
      }
      
      if (address && address.length > 5) {
        return address.replace(/[:\s]+/, ' ').trim();
      }
    }
  }
  
  return null;
};