'use client';

import { useState } from 'react';
import { encryptText } from '@/lib/crypto';
import { QRCodeSVG } from 'qrcode.react';

const MAX_SIZE = 1 * 1024 * 1024;

export default function Home() {
  const [content, setContent] = useState('');
  const [password, setPassword] = useState('');
  const [expiresIn, setExpiresIn] = useState('1h');
  const [burnAfterReading, setBurnAfterReading] = useState(false);
  const [isMarkdown, setIsMarkdown] = useState(false);
  const [loading, setLoading] = useState(false);
  const [resultLink, setResultLink] = useState('');
  const [error, setError] = useState('');

  const handleCreatePaste = async () => {
    if (!content.trim()) return;

    if (new Blob([content]).size > MAX_SIZE) {
      setError('Content exceeds 1MB limit.');
      return;
    }

    setLoading(true);
    setError('');
    setResultLink('');

    try {
      const { encryptedContent, iv, salt, key } = await encryptText(content, password || undefined);

      const response = await fetch('/api/paste', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          encryptedContent,
          iv,
          salt,
          expiresIn,
          burnAfterReading,
          isMarkdown,
        }),
      });

      const data = await response.json();

      if (!response.ok) throw new Error(data.error || 'Failed to create paste');

      const baseUrl = window.location.origin;
      const shareLink = password 
        ? `${baseUrl}/paste/${data.pasteId}` 
        : `${baseUrl}/paste/${data.pasteId}#${key}`;
      
      setResultLink(shareLink);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(resultLink);
  };

  return (
    <main className="max-w-2xl mx-auto px-6 py-12 md:py-24">
      <div className="mb-16">
        <h1 className="text-3xl font-bold tracking-tighter mb-3 text-white">Privatebin</h1>
        <p className="text-sm text-gray-500 max-w-md leading-relaxed">
          Zero-knowledge paste sharing with PBKDF2 password protection and Markdown support.
        </p>
      </div>

      {!resultLink ? (
        <div className="bg-[#111] border border-border p-8 rounded-xl shadow-2xl space-y-8">
          <div className="flex flex-col gap-2">
            <label className="text-[10px] uppercase tracking-[0.2em] text-gray-600 font-bold">Content</label>
            <textarea
              className="w-full min-h-[400px] font-mono text-sm resize-none bg-black/50 p-4 border-border focus:border-white/20 transition-all"
              placeholder="Paste your text here..."
              value={content}
              onChange={(e) => setContent(e.target.value)}
              disabled={loading}
            />
            <div className="text-[10px] text-gray-700 text-right font-mono">
              {Math.round(new Blob([content]).size / 1024)} / 1024 KB
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="flex flex-col gap-2">
              <label className="text-[10px] uppercase tracking-[0.2em] text-gray-600 font-bold">Password (Optional)</label>
              <input
                type="password"
                className="w-full bg-black/50"
                placeholder="Key derived locally"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={loading}
              />
            </div>

            <div className="flex flex-col gap-2">
              <label className="text-[10px] uppercase tracking-[0.2em] text-gray-600 font-bold">Expiration</label>
              <select
                className="w-full appearance-none cursor-pointer bg-black/50"
                value={expiresIn}
                onChange={(e) => setExpiresIn(e.target.value)}
                disabled={loading}
              >
                <option value="10m">10 Minutes</option>
                <option value="1h">1 Hour</option>
                <option value="1d">1 Day</option>
              </select>
            </div>
          </div>

          <div className="flex flex-wrap gap-8 border-t border-white/5 pt-6">
            <div className="flex items-center gap-3">
              <input
                id="burn"
                type="checkbox"
                className="w-4 h-4 cursor-pointer accent-white"
                checked={burnAfterReading}
                onChange={(e) => setBurnAfterReading(e.target.checked)}
                disabled={loading}
              />
              <label htmlFor="burn" className="text-xs text-gray-500 cursor-pointer select-none uppercase tracking-wider">
                Burn after reading
              </label>
            </div>

            <div className="flex items-center gap-3">
              <input
                id="markdown"
                type="checkbox"
                className="w-4 h-4 cursor-pointer accent-white"
                checked={isMarkdown}
                onChange={(e) => setIsMarkdown(e.target.checked)}
                disabled={loading}
              />
              <label htmlFor="markdown" className="text-xs text-gray-500 cursor-pointer select-none uppercase tracking-wider">
                Markdown
              </label>
            </div>
          </div>

          <button
            className="w-full py-4 font-bold text-xs tracking-[0.2em] bg-white text-black hover:bg-gray-200 uppercase transition-all shadow-lg active:scale-[0.98]"
            onClick={handleCreatePaste}
            disabled={loading || !content.trim()}
          >
            {loading ? 'ENCRYPTING...' : 'CREATE PASTE'}
          </button>

          {error && <p className="text-red-500 text-[10px] text-center uppercase tracking-widest">{error}</p>}
        </div>
      ) : (
        <div className="bg-[#111] border border-border p-12 rounded-xl text-center animate-in fade-in zoom-in duration-500 shadow-2xl">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-green-900/10 border border-green-900/30 text-green-500 mb-8">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-6 h-6">
              <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold mb-3 text-white tracking-tight">Paste Ready</h2>
          <p className="text-sm text-gray-500 mb-10 max-w-xs mx-auto leading-relaxed">
            {password 
              ? 'Protected by password. Share link and password separately.'
              : 'Decryption key is in the URL fragment.'}
          </p>
          
          <div className="flex flex-col items-center gap-10">
            <div className="flex flex-col md:flex-row items-stretch gap-3 w-full">
              <input
                type="text"
                className="flex-1 font-mono text-[10px] bg-black border-border px-4 truncate text-gray-400"
                value={resultLink}
                readOnly
              />
              <button
                className="px-8 py-3 bg-white text-black font-bold text-[10px] tracking-widest hover:bg-gray-200 whitespace-nowrap transition-all"
                onClick={copyToClipboard}
              >
                COPY LINK
              </button>
            </div>

            <div className="bg-white p-4 rounded-xl shadow-inner">
              <QRCodeSVG value={resultLink} size={180} />
            </div>
          </div>

          <button
            className="mt-12 text-[10px] text-gray-600 hover:text-gray-400 underline underline-offset-4 tracking-[0.2em] transition-all"
            onClick={() => {
              setResultLink('');
              setContent('');
              setPassword('');
            }}
          >
            NEW PASTE
          </button>
        </div>
      )}

      <footer className="mt-24 text-center opacity-10">
        <p className="text-[10px] uppercase tracking-[0.3em]">Privatebin &copy; 2026</p>
      </footer>
    </main>

  );
}
