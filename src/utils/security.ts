export const generateSecureToken = (): string => {
  const array = new Uint8Array(32);
  crypto.getRandomValues(array);
  return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
};

export const hashData = async (data: string): Promise<string> => {
  const encoder = new TextEncoder();
  const dataBuffer = encoder.encode(data);
  const hashBuffer = await crypto.subtle.digest('SHA-256', dataBuffer);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
};

export const encryptSensitiveData = (data: any): string => {
  // Simple base64 encoding for demo - in production use proper encryption
  try {
    return btoa(JSON.stringify(data));
  } catch (error) {
    console.error('Encryption failed:', error);
    return JSON.stringify(data);
  }
};

export const decryptSensitiveData = (encryptedData: string): any => {
  // First try to decode as base64 (encrypted data)
  try {
    const decoded = atob(encryptedData);
    return JSON.parse(decoded);
  } catch (base64Error) {
    // If base64 decoding fails, try parsing as plain JSON (unencrypted data)
    try {
      return JSON.parse(encryptedData);
    } catch (jsonError) {
      // If both fail, return null
      console.error('Failed to decrypt/parse data:', jsonError);
      return null;
    }
  }
};

export const sanitizeForStorage = (data: any): any => {
  if (typeof data === 'string') {
    return data.replace(/[<>\"'&]/g, '');
  }
  
  if (Array.isArray(data)) {
    return data.map(sanitizeForStorage);
  }
  
  if (typeof data === 'object' && data !== null) {
    const sanitized: any = {};
    for (const [key, value] of Object.entries(data)) {
      sanitized[key] = sanitizeForStorage(value);
    }
    return sanitized;
  }
  
  return data;
};

export const validateShareToken = (token: string): boolean => {
  // Token should be 64 characters hex string
  return /^[a-f0-9]{64}$/i.test(token);
};