'use client';

import { useState, useRef, useCallback } from 'react';

export default function Home() {
  const [preview, setPreview] = useState<string | null>(null);
  const [resultUrl, setResultUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [loadingText, setLoadingText] = useState('Processing\u2026');
  const fileRef = useRef<HTMLInputElement>(null);
  let origBlob: string | null = null;

  const reset = useCallback(() => {
    if (origBlob) { URL.revokeObjectURL(origBlob); origBlob = null; }
    if (resultUrl) { URL.revokeObjectURL(resultUrl); }
    setPreview(null); setResultUrl(null); setLoading(false);
    setLoadingText('Processing\u2026');
    if (fileRef.current) fileRef.current.value = '';
  }, [resultUrl]);

  const processFile = useCallback(async (file: File) => {
    const u = URL.createObjectURL(file); origBlob = u;
    setPreview(u); setResultUrl(null); setLoading(true);
    setLoadingText('Connecting to server\u2026');

    if (typeof window !== 'undefined' && window.location.protocol === 'file:') {
      setLoadingText('Cannot process locally. Run npm run dev or deploy to Cloudflare Pages.');
      setTimeout(() => setLoading(false), 3000);
      return;
    }

    const fd = new FormData(); fd.append('image', file);
    const ctrl = new AbortController();
    const tid = setTimeout(() => ctrl.abort(), 15000);
    try {
      const r = await fetch('/api/remove-bg', { method: 'POST', body: fd, signal: ctrl.signal });
      clearTimeout(tid);
      if (!r.ok) throw new Error('API error (' + r.status + ')');
      const blob = await r.blob(); const resUrl = URL.createObjectURL(blob);
      setResultUrl(resUrl); setLoading(false);
    } catch (err) {
      clearTimeout(tid);
      setLoadingText('Error: ' + (err instanceof Error ? err.message : 'Unknown error'));
    }
  }, []);

  const onDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    const f = e.dataTransfer.files[0];
    if (f && f.type.startsWith('image/')) processFile(f);
  }, []);
  const onChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (f && f.type.startsWith('image/')) processFile(f);
  }, []);

  return (
    <div className='min-h-screen flex items-center justify-center p-6 relative'>
      <div className='fixed inset-0 pointer-events-none z-0'
        style={{ backgroundImage: 'radial-gradient(circle, rgba(255,255,255,0.04) 1px, transparent 1px)', backgroundSize: '28px 28px' }} />

      <div className='relative z-10 w-full max-w-[540px] flex flex-col items-center gap-7'>
        <div className='text-center'>
          <h1 className='text-[26px] font-bold tracking-tight text-[#f0f2f5]'>Background Remover</h1>
          <p className='text-[13px] text-white/30 mt-1'>Upload an image to remove its background</p>
        </div>

        <div className='
          w-full aspect-square max-h-[480px] border-2 border-dashed border-white/12 rounded-2xl
          flex flex-col items-center justify-center gap-3 cursor-pointer transition-all duration-250
          bg-white/[0.02] hover:border-white/28 hover:bg-white/[0.04] relative overflow-hidden select-none
        '
          onClick={() => !preview && fileRef.current?.click()}
          onDragOver={e => { e.preventDefault(); e.currentTarget.style.borderColor = '#6c63ff'; }}
          onDragLeave={e => { e.currentTarget.style.borderColor = ''; }}
          onDrop={onDrop}
        >
          {!preview && !loading && (
            <>
              <div className='w-[46px] h-[46px] rounded-full bg-white/[0.05] flex items-center justify-center'>
                <svg className='w-5 h-5 text-white/40' viewBox='0 0 24 24' fill='none' stroke='currentColor' strokeWidth='1.5'>
                  <path d='M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4' />
                  <polyline points='17 8 12 3 7 8' />
                  <line x1='12' y1='3' x2='12' y2='15' />
                </svg>
              </div>
              <span className='text-[14px] font-medium text-white/60'>Drop or upload your image</span>
              <span className='text-[12px] text-white/25'>PNG &middot; JPG &middot; WEBP</span>
            </>
          )}

          {preview && <img src={preview} alt='preview' className='absolute inset-0 w-full h-full object-contain p-2.5' />}

          {loading && (
            <div className='absolute inset-0 flex flex-col items-center justify-center gap-3.5 bg-[#0a0b0e]/80 rounded-2xl z-10'>
              <div className='w-10 h-10 border-2 border-white/[0.06] border-t-[#6c63ff] rounded-full animate-spin' />
              <span className='text-[13px] text-white/50 text-center px-4'>{loadingText}</span>
            </div>
          )}
        </div>

        {resultUrl && (
          <div className='w-full flex gap-3'>
            <div className='flex-1 flex flex-col gap-1.5'>
              <span className='text-[11px] text-white/30 uppercase tracking-wider text-center'>Original</span>
              <div className='aspect-square rounded-xl overflow-hidden bg-white/[0.03] border border-white/[0.06] flex items-center justify-center'>
                <img src={preview!} alt='original' className='w-full h-full object-contain' />
              </div>
            </div>
            <div className='flex-1 flex flex-col gap-1.5'>
              <span className='text-[11px] text-white/30 uppercase tracking-wider text-center'>Result</span>
              <div className='aspect-square rounded-xl overflow-hidden bg-white/[0.03] border border-white/[0.06] flex items-center justify-center'>
                <img src={resultUrl} alt='result' className='w-full h-full object-contain' />
              </div>
            </div>
          </div>
        )}

        {preview && (
          <div className='flex gap-2.5 flex-wrap justify-center w-full'>
            {resultUrl && (
              <button onClick={() => { if (!resultUrl) return; const a = document.createElement('a'); a.href = resultUrl; a.download = 'bg-removed.png'; a.click(); }}
                className='inline-flex items-center gap-1.5 px-[22px] py-[10px] rounded-xl text-[13px] font-medium cursor-pointer transition-all active:scale-[0.97] bg-[#6c63ff] text-white hover:bg-[#5b52e0]'>
                <svg className='w-4 h-4' viewBox='0 0 24 24' fill='none' stroke='currentColor' strokeWidth='2'>
                  <path d='M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4' />
                  <polyline points='7 10 12 15 17 10' />
                  <line x1='12' y1='15' x2='12' y2='3' />
                </svg>
                Download
              </button>
            )}
            <button onClick={reset}
              className='inline-flex items-center gap-1.5 px-[22px] py-[10px] rounded-xl text-[13px] font-medium cursor-pointer transition-all active:scale-[0.97] bg-white/[0.06] text-white/60 hover:bg-white/[0.11]'>
              <svg className='w-4 h-4' viewBox='0 0 24 24' fill='none' stroke='currentColor' strokeWidth='2'>
                <line x1='18' y1='6' x2='6' y2='18' /><line x1='6' y1='6' x2='18' y2='18' />
              </svg>
              Reset
            </button>
          </div>
        )}

        <div className='text-[11px] text-white/[0.15] text-center'>Powered by remove.bg API &middot; Image not stored</div>
      </div>

      <input ref={fileRef} type='file' accept='image/png,image/jpeg,image/webp' className='hidden' onChange={onChange} />
    </div>
  );
}