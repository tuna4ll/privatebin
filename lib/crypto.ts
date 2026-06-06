const ALGORITHM = 'AES-GCM';
const PBKDF2_ITERATIONS = 100000;

export async function encryptText(text: string, password?: string) {
  let key: CryptoKey;
  let salt: Uint8Array | undefined;

  if (password) {
    salt = window.crypto.getRandomValues(new Uint8Array(16));
    const baseKey = await window.crypto.subtle.importKey(
      'raw',
      new TextEncoder().encode(password),
      'PBKDF2',
      false,
      ['deriveKey']
    );

    key = await window.crypto.subtle.deriveKey(
      {
        name: 'PBKDF2',
        salt,
        iterations: PBKDF2_ITERATIONS,
        hash: 'SHA-256',
      },
      baseKey,
      { name: ALGORITHM, length: 256 },
      true,
      ['encrypt', 'decrypt']
    );
  } else {
    key = await window.crypto.subtle.generateKey(
      { name: ALGORITHM, length: 256 },
      true,
      ['encrypt', 'decrypt']
    );
  }

  const iv = window.crypto.getRandomValues(new Uint8Array(12));
  const encodedText = new TextEncoder().encode(text);

  const encryptedBuffer = await window.crypto.subtle.encrypt(
    { name: ALGORITHM, iv },
    key,
    encodedText
  );

  const exportedKey = !password ? await window.crypto.subtle.exportKey('raw', key) : null;
  
  return {
    encryptedContent: bufferToBase64(encryptedBuffer),
    iv: bufferToBase64(iv),
    salt: salt ? bufferToBase64(salt) : undefined,
    key: exportedKey ? bufferToBase64(exportedKey) : undefined,
  };
}

export async function decryptText(
  encryptedContent: string, 
  ivBase64: string, 
  keyOrPassword: string, 
  saltBase64?: string
) {
  let key: CryptoKey;

  if (saltBase64) {
    const salt = base64ToBuffer(saltBase64);
    const baseKey = await window.crypto.subtle.importKey(
      'raw',
      new TextEncoder().encode(keyOrPassword),
      'PBKDF2',
      false,
      ['deriveKey']
    );

    key = await window.crypto.subtle.deriveKey(
      {
        name: 'PBKDF2',
        salt,
        iterations: PBKDF2_ITERATIONS,
        hash: 'SHA-256',
      },
      baseKey,
      { name: ALGORITHM, length: 256 },
      true,
      ['decrypt']
    );
  } else {
    const keyBuffer = base64ToBuffer(keyOrPassword);
    key = await window.crypto.subtle.importKey(
      'raw',
      keyBuffer,
      ALGORITHM,
      true,
      ['decrypt']
    );
  }

  const iv = base64ToBuffer(ivBase64);
  const encryptedBuffer = base64ToBuffer(encryptedContent);

  const decryptedBuffer = await window.crypto.subtle.decrypt(
    { name: ALGORITHM, iv },
    key,
    encryptedBuffer
  );

  return new TextDecoder().decode(decryptedBuffer);
}

function bufferToBase64(buffer: ArrayBuffer | Uint8Array): string {
  const bytes = buffer instanceof Uint8Array ? buffer : new Uint8Array(buffer);
  let binary = '';
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary)
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');
}

function base64ToBuffer(base64: string): Uint8Array {
  const padding = '='.repeat((4 - (base64.length % 4)) % 4);
  const base64Standard = (base64 + padding)
    .replace(/-/g, '+')
    .replace(/_/g, '/');
  const binary = atob(base64Standard);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}
