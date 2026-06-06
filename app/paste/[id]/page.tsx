'use client';

import { useEffect, useState, use } from 'react';
import { decryptText } from '@/lib/crypto';
import Link from 'next/link';
import ReactMarkdown from 'react-markdown';

export default function PasteView({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [encryptedData, setEncryptedData] = useState<{
    encryptedContent: string;
    iv: string;
    salt?: string;
    burnAfterReading: boolean;
    isMarkdown: boolean;
  } | null>(null);
  
  const [content, setContent] = useState<string | null>(null);
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(true);
  const [decrypting, setDecrypting] = useState(false);
  const [error, setError] = useState('');
  const [burnWarning, setBurnWarning] = useState(false);

  useEffect(() => {
    const fetchPaste = async () => {
      try {
        const response = await fetch(`/api/paste/${id}`);
        const data = await response.json();

        if (!response.ok) throw new Error(data.error || 'Failed to fetch');

        setEncryptedData(data);
        if (data.burnAfterReading) setBurnWarning(true);

        if (!data.salt) {
          const hash = window.location.hash;
          if (hash && hash.length > 1) {
            const key = hash.substring(1);
            const decrypted = await decryptText(data.encryptedContent, data.iv, key);
            setContent(decrypted);
          } else {
            setError('Missing key in URL.');
          }
        }
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : 'Error occurred');
      } finally {
        setLoading(false);
      }
    };

    fetchPaste();
  }, [id]);

  const handleDecrypt = async () => {
    if (!encryptedData || !password) return;
    setDecrypting(true);
    setError('');

    try {
      const decrypted = await decryptText(
        encryptedData.encryptedContent,
        encryptedData.iv,
        password,
        encryptedData.salt
      );
      setContent(decrypted);
    } catch {
      setError('Wrong password.');
    } finally {
      setDecrypting(false);
    }
  };

  return (
    <main className="max-w-2xl mx-auto px-6 py-12 md:py-24">
      <div className="mb-12 flex justify-between items-center border-b border-white/5 pb-6">
        <div>
          <Link href="/" className="text-2xl font-bold tracking-tighter hover:text-gray-400 transition-all">Privatebin</Link>
          <p className="text-[10px] uppercase tracking-[0.3em] text-gray-700 mt-1">Zero Knowledge</p>
        </div>
        <Link href="/" className="text-[10px] font-bold uppercase tracking-widest bg-white text-black px-4 py-2 hover:bg-gray-200 transition-all">
          NEW
        </Link>
      </div>

      <div className="bg-[#111] border border-border rounded-xl shadow-2xl overflow-hidden min-h-[500px] flex flex-col">
        {loading ? (
          <div className="flex-1 flex flex-col items-center justify-center space-y-6">
            <div className="w-10 h-10 border-2 border-gray-900 border-t-white rounded-full animate-spin"></div>
            <p className="text-[10px] uppercase tracking-[0.4em] text-gray-600 animate-pulse">Fetching</p>
          </div>
        ) : content ? (
          <>
            {burnWarning && (
              <div className="bg-orange-950/10 border-b border-orange-900/20 px-8 py-4 flex items-center gap-4">
                <div className="w-2 h-2 rounded-full bg-orange-500 animate-pulse"></div>
                <p className="text-[10px] uppercase tracking-[0.2em] text-orange-500 font-bold">
                  Burned: Content deleted from server
                </p>
              </div>
            )}
            <div className="flex-1 p-8 md:p-12">
              {encryptedData?.isMarkdown ? (
                <div className="prose prose-invert prose-sm max-w-none prose-pre:bg-black/50 prose-pre:border prose-pre:border-white/5">
                  <ReactMarkdown>{content}</ReactMarkdown>
                </div>
              ) : (
                <pre className="whitespace-pre-wrap break-words font-mono text-sm leading-relaxed text-gray-400">
                  {content}
                </pre>
              )}
            </div>
          </>
        ) : encryptedData?.salt ? (
          <div className="flex-1 flex flex-col items-center justify-center p-12 w-full text-center">
            <div className="w-16 h-16 rounded-full bg-white/5 border border-white/10 flex items-center justify-center mb-8 text-white/20">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1} stroke="currentColor" className="w-8 h-8">
                <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 1 0-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 0 0 2.25-2.25v-6.75a2.25 2.25 0 0 0-2.25-2.25H6.75a2.25 2.25 0 0 0-2.25 2.25v6.75a2.25 2.25 0 0 0 2.25 2.25Z" />
              </svg>
            </div>
            <h3 className="text-xl font-bold mb-3 text-white">Protected</h3>
            <p className="text-[10px] text-gray-600 mb-10 uppercase tracking-[0.3em]">Enter password to decrypt</p>
            <div className="flex flex-col gap-4 w-full max-w-xs mx-auto">
              <input
                type="password"
                className="w-full text-center bg-black/50 py-3"
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleDecrypt()}
                disabled={decrypting}
              />
              <button
                className="w-full py-4 bg-white text-black font-bold text-xs uppercase tracking-widest hover:bg-gray-200 transition-all active:scale-[0.98]"
                onClick={handleDecrypt}
                disabled={decrypting || !password}
              >
                {decrypting ? 'DECRYPTING...' : 'DECRYPT'}
              </button>
              {error && <p className="text-red-500 text-[10px] mt-4 uppercase tracking-widest">{error}</p>}
            </div>
          </div>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center p-12 md:p-20 text-center">
            <div className="w-20 h-20 rounded-full bg-red-950/10 border border-red-900/20 text-red-500/40 flex items-center justify-center mb-10 shadow-inner">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1} stroke="currentColor" className="w-10 h-10">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9 3.75h.008v.008H12v-.008Z" />
              </svg>
            </div>
            <h2 className="text-xl font-bold text-white mb-4 tracking-tight uppercase">Access Denied</h2>
            <p className="text-sm text-gray-500 mb-12 max-w-sm leading-relaxed uppercase tracking-[0.15em]">
              {error || 'The paste you are looking for does not exist or has been burned.'}
            </p>
            <Link href="/" className="group flex items-center gap-3 text-[10px] uppercase tracking-[0.3em] text-gray-600 hover:text-white transition-all">
              <span className="w-8 h-[1px] bg-gray-800 group-hover:bg-white transition-all"></span>
              Back to Home
              <span className="w-8 h-[1px] bg-gray-800 group-hover:bg-white transition-all"></span>
            </Link>
          </div>
        )}
      </div>

      <footer className="mt-24 text-center opacity-10">
        <p className="text-[10px] uppercase tracking-[0.3em] text-gray-500">Privatebin &copy; 2026</p>
      </footer>
    </main>
  );
}
