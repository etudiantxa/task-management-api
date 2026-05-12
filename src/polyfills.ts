// polyfills.ts - Fichier pour gérer les polyfills nécessaires
import { randomBytes } from 'crypto';

// Si la fonction crypto.randomUUID n'existe pas, on la crée à partir de randomBytes
if (typeof global.crypto === 'undefined') {
  (global as any).crypto = {};
}

if (typeof (global as any).crypto.randomUUID === 'undefined') {
  (global as any).crypto.randomUUID = (): string => {
    const bytes = randomBytes(16);
    // Format UUIDv4 basé sur les spécifications RFC 4122
    const hex = bytes.toString('hex');
    return [
      hex.slice(0, 8),
      hex.slice(8, 12),
      '4' + hex.slice(13, 16), // Version 4
      (0x80 + (bytes[8] % 64)).toString(16) + hex.slice(17, 20), // Variante 10xx
      hex.slice(20, 32)
    ].join('-');
  };
}