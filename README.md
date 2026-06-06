# Privatebin

Privatebin is a zero-knowledge, privacy-focused paste sharing platform built with Next.js. It ensures that the server never sees your plaintext content by performing all encryption and decryption locally in the browser.

## Features

- **Zero-Knowledge Architecture:** Encryption happens in the browser via Web Crypto API (AES-GCM).
- **Password Protection:** Optional PBKDF2-based key derivation for extra security.
- **Markdown Support:** Render your pastes with rich formatting.
- **Burn-after-Reading:** One-time readable pastes that are automatically destroyed.
- **Expiring Pastes:** Set expiration for 10 minutes, 1 hour, or 1 day.
- **QR Code Sharing:** Quickly share links with mobile devices.
- **Rate Limiting:** IP-based protection against spam.

## Tech Stack

- **Frontend:** Next.js (App Router), Tailwind CSS, TypeScript.
- **Backend:** Next.js API Routes, MongoDB.
- **Security:** Web Crypto API (AES-GCM), PBKDF2, Rate Limiting.


## Security Model

The decryption key is never sent to the server. For link-based pastes, the key is stored in the URL fragment (`#`), which the browser does not include in HTTP requests. For password-protected pastes, the key is derived from the user-provided password using PBKDF2 with 100,000 iterations.