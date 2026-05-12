// polyfills.ts - Fichier pour gérer les polyfills nécessaires
import { randomBytes } from 'crypto';

// Si la fonction crypto.randomUUID n'existe pas, on la crée à partir de randomBytes
if (typeof global.crypto === 'undefined') {
  global.crypto = {} as Crypto;
}

if (typeof global.crypto.randomUUID === 'undefined') {
  global.crypto.randomUUID = (): string => {
    const bytes = randomBytes(16);
    // Format UUIDv4 basé sur les spécifications RFC 4122
    return [
      bytes.toString('hex', 0, 4),
      bytes.toString('hex', 4, 6),
      `4${bytes.toString('hex', 6, 9).substring(1)}`,
      `${(bytes[9] & 0x3f) | 0x80}${bytes.toString('hex', 10, 16).substring(1)}`
    ].join('-');
  };
}