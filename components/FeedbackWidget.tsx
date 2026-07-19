'use client';
import { useState, useRef, useEffect } from 'react';
import { MessageSquare, X, Send, CheckCircle, ChevronDown, Star } from 'lucide-react';
import { useWallet } from '@/hooks/useWallet';

type Category = 'bug' | 'feature' | 'ux' | 'praise' | 'other';
type Status = 'idle' | 'sending' | 'success' | 'error';

const CATEGORIES: { value: Category; label: string; emoji: string }[] = [
  { value: 'bug',     label: 'Bug Report',      emoji: '🐛' },
  { value: 'feature', label: 'Feature Request',  emoji: '💡' },
  { value: 'ux',      label: 'UI / UX Feedback', emoji: '🎨' },
  { value: 'praise',  label: 'Praise',           emoji: '🌟' },
  { value: 'other',   label: 'Other',            emoji: '💬' },
];

export default function FeedbackWidget() {
  const [open, setOpen] = useState(false);
  const [category, setCategory] = useState<Category>('feature');
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [message, setMessage] = useState('');
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState<Status>('idle');
  const [errorMsg, setErrorMsg] = useState('');
  const { address, shortAddress } = useWallet();
  const modalRef = useRef<HTMLDivElement>(null);

  // Close on outside click
  useEffect(() => {
    if (!open) return;
    function handle(e: MouseEvent) {
      if (modalRef.current && !modalRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener('mousedown', handle);
    return () => document.removeEventListener('mousedown', handle);
  }, [open]);

  // Reset after close
  function handleClose() {
    setOpen(false);
    if (status === 'success') {
      setTimeout(() => {
        setMessage(''); setRating(0); setEmail('');
        setCategory('feature'); setStatus('idle');
      }, 300);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!message.trim()) return;
    setStatus('sending');
    setErrorMsg('');

    try {
      const res = await fetch('/api/feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          category,
          rating,
          message: message.trim(),
          email: email.trim() || null,
          walletAddress: address || null,
          page: window.location.pathname,
          timestamp: new Date().toISOString(),
        }),
      });
      const data = await res.json();
      if (!data.ok) throw new Error(data.error || 'Failed to send');
      setStatus('success');
    } catch (err) {
      setStatus('error');
      setErrorMsg(err instanceof Error ? err.message : 'Something went wrong');
    }
  }

  const displayRating = hoverRating || rating;

  return (
    <>
      {/* Floating trigger button */}
      <button
        onClick={() => setOpen(true)}
        title="Send Feedback"
        style={{
          position: 'fixed',
          bottom: '28px',
          right: '28px',
          zIndex: 9998,
          width: '52px',
          height: '52px',
          borderRadius: '50%',
          background: 'linear-gradient(135deg, #14f195, #0ea472)',
          border: 'none',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          boxShadow: '0 4px 24px rgba(20,241,149,0.35)',
          transition: 'transform 0.2s, box-shadow 0.2s',
        }}
        onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.transform = 'scale(1.1)'; }}
        onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.transform = 'scale(1)'; }}
      >
        <MessageSquare size={22} color="#000" strokeWidth={2.5} />
      </button>

      {/* Backdrop */}
      {open && (
        <div style={{
          position: 'fixed', inset: 0, zIndex: 9999,
          background: 'rgba(0,0,0,0.6)',
          backdropFilter: 'blur(6px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          animation: 'fadeIn 0.15s ease',
        }}>
          <div ref={modalRef} style={{
            width: '100%', maxWidth: '480px',
            background: 'var(--surface, #0d1424)',
            border: '1px solid rgba(180,244,215,0.15)',
            borderRadius: '28px',
            padding: '32px',
            boxShadow: '0 24px 80px rgba(0,0,0,0.6), 0 0 0 1px rgba(180,244,215,0.08)',
            animation: 'slideUp 0.2s ease',
            position: 'relative',
          }}>

            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '28px' }}>
              <div>
                <p style={{ fontSize: '11px', fontWeight: 700, color: 'var(--mint, #14f195)', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: '6px' }}>
                  Share Your Thoughts
                </p>
                <h2 style={{ fontSize: '24px', fontWeight: 800, letterSpacing: '-0.02em', color: '#fff' }}>
                  Send Feedback
                </h2>
              </div>
              <button
                onClick={handleClose}
                style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--muted)', padding: '4px', borderRadius: '8px' }}
              >
                <X size={20} />
              </button>
            </div>

            {status === 'success' ? (
              // Success state
              <div style={{ textAlign: 'center', padding: '40px 20px' }}>
                <CheckCircle size={56} color="var(--mint, #14f195)" style={{ margin: '0 auto 20px', display: 'block' }} />
                <h3 style={{ fontSize: '22px', fontWeight: 800, marginBottom: '10px' }}>Thank you!</h3>
                <p style={{ color: 'var(--muted)', fontSize: '14px', lineHeight: 1.6 }}>
                  Your feedback helps us build a better product.<br />
                  We read every submission.
                </p>
                <button
                  onClick={handleClose}
                  style={{
                    marginTop: '28px', padding: '12px 28px', borderRadius: '12px',
                    background: 'rgba(180,244,215,0.1)', border: '1px solid rgba(180,244,215,0.2)',
                    color: 'var(--mint, #14f195)', fontWeight: 700, cursor: 'pointer', fontSize: '14px',
                  }}
                >
                  Close
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>

                {/* Category */}
                <div>
                  <label style={{ fontSize: '12px', fontWeight: 700, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.08em', display: 'block', marginBottom: '10px' }}>
                    Category
                  </label>
                  <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                    {CATEGORIES.map(cat => (
                      <button
                        key={cat.value}
                        type="button"
                        onClick={() => setCategory(cat.value)}
                        style={{
                          padding: '8px 14px', borderRadius: '10px', fontSize: '13px', fontWeight: 600,
                          cursor: 'pointer', border: '1px solid',
                          background: category === cat.value ? 'rgba(180,244,215,0.1)' : 'rgba(255,255,255,0.03)',
                          borderColor: category === cat.value ? 'rgba(180,244,215,0.35)' : 'rgba(255,255,255,0.08)',
                          color: category === cat.value ? 'var(--mint, #14f195)' : 'var(--muted)',
                          transition: 'all 0.15s',
                        }}
                      >
                        {cat.emoji} {cat.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Star rating */}
                <div>
                  <label style={{ fontSize: '12px', fontWeight: 700, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.08em', display: 'block', marginBottom: '10px' }}>
                    Overall Experience
                  </label>
                  <div style={{ display: 'flex', gap: '6px' }}>
                    {[1, 2, 3, 4, 5].map(n => (
                      <button
                        key={n}
                        type="button"
                        onClick={() => setRating(n)}
                        onMouseEnter={() => setHoverRating(n)}
                        onMouseLeave={() => setHoverRating(0)}
                        style={{
                          background: 'none', border: 'none', cursor: 'pointer', padding: '2px',
                          transition: 'transform 0.1s',
                          transform: hoverRating >= n ? 'scale(1.2)' : 'scale(1)',
                        }}
                      >
                        <Star
                          size={28}
                          fill={displayRating >= n ? '#f59e0b' : 'transparent'}
                          color={displayRating >= n ? '#f59e0b' : 'rgba(255,255,255,0.2)'}
                          strokeWidth={1.5}
                        />
                      </button>
                    ))}
                    {rating > 0 && (
                      <span style={{ marginLeft: '8px', fontSize: '12px', color: 'var(--muted)', alignSelf: 'center' }}>
                        {['', 'Poor', 'Fair', 'Good', 'Great', 'Excellent'][rating]}
                      </span>
                    )}
                  </div>
                </div>

                {/* Message */}
                <div>
                  <label style={{ fontSize: '12px', fontWeight: 700, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.08em', display: 'block', marginBottom: '10px' }}>
                    Your Message <span style={{ color: '#ef4444' }}>*</span>
                  </label>
                  <textarea
                    required
                    value={message}
                    onChange={e => setMessage(e.target.value)}
                    placeholder="Tell us what you think, what broke, or what you wish existed..."
                    maxLength={1000}
                    rows={4}
                    style={{
                      width: '100%', boxSizing: 'border-box',
                      background: 'rgba(255,255,255,0.03)',
                      border: '1px solid rgba(255,255,255,0.1)',
                      borderRadius: '14px', padding: '14px 16px',
                      color: '#fff', fontSize: '14px', lineHeight: 1.6,
                      resize: 'vertical', outline: 'none', fontFamily: 'inherit',
                      transition: 'border-color 0.15s',
                    }}
                    onFocus={e => { e.currentTarget.style.borderColor = 'rgba(180,244,215,0.35)'; }}
                    onBlur={e => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)'; }}
                  />
                  <p style={{ fontSize: '11px', color: 'var(--subtle)', marginTop: '6px', textAlign: 'right' }}>
                    {message.length}/1000
                  </p>
                </div>

                {/* Optional email */}
                <div>
                  <label style={{ fontSize: '12px', fontWeight: 700, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.08em', display: 'block', marginBottom: '10px' }}>
                    Email <span style={{ color: 'var(--subtle)', fontWeight: 500, textTransform: 'none', letterSpacing: 0 }}>(optional — for follow-up)</span>
                  </label>
                  <input
                    type="email"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    placeholder="you@example.com"
                    style={{
                      width: '100%', boxSizing: 'border-box',
                      background: 'rgba(255,255,255,0.03)',
                      border: '1px solid rgba(255,255,255,0.1)',
                      borderRadius: '12px', padding: '12px 16px',
                      color: '#fff', fontSize: '14px', outline: 'none',
                      fontFamily: 'inherit', transition: 'border-color 0.15s',
                    }}
                    onFocus={e => { e.currentTarget.style.borderColor = 'rgba(180,244,215,0.35)'; }}
                    onBlur={e => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)'; }}
                  />
                </div>

                {/* Wallet info (read-only) */}
                {address && (
                  <p style={{ fontSize: '11px', color: 'var(--subtle)', padding: '8px 12px', background: 'rgba(255,255,255,0.02)', borderRadius: '8px' }}>
                    🔗 Submitting as {shortAddress}
                  </p>
                )}

                {/* Error */}
                {status === 'error' && (
                  <p style={{ fontSize: '13px', color: '#f87171', background: 'rgba(248,113,113,0.08)', padding: '10px 14px', borderRadius: '10px', border: '1px solid rgba(248,113,113,0.2)' }}>
                    ⚠ {errorMsg || 'Failed to send. Please try again.'}
                  </p>
                )}

                {/* Submit */}
                <button
                  type="submit"
                  disabled={status === 'sending' || !message.trim()}
                  style={{
                    width: '100%', padding: '14px', borderRadius: '14px',
                    background: (status === 'sending' || !message.trim())
                      ? 'rgba(255,255,255,0.05)'
                      : 'linear-gradient(135deg, #14f195, #0ea472)',
                    border: 'none',
                    color: (status === 'sending' || !message.trim()) ? 'var(--muted)' : '#000',
                    fontSize: '15px', fontWeight: 800, cursor: (status === 'sending' || !message.trim()) ? 'not-allowed' : 'pointer',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px',
                    transition: 'all 0.2s',
                  }}
                >
                  {status === 'sending' ? (
                    <>
                      <span style={{ width: 18, height: 18, border: '2px solid rgba(0,0,0,0.3)', borderTopColor: '#000', borderRadius: '50%', display: 'inline-block', animation: 'spin 0.7s linear infinite' }} />
                      Sending...
                    </>
                  ) : (
                    <><Send size={18} strokeWidth={2.5} /> Send Feedback</>
                  )}
                </button>
              </form>
            )}
          </div>
        </div>
      )}

      <style>{`
        @keyframes fadeIn  { from { opacity: 0 } to { opacity: 1 } }
        @keyframes slideUp { from { opacity: 0; transform: translateY(16px) } to { opacity: 1; transform: translateY(0) } }
        @keyframes spin    { to { transform: rotate(360deg) } }
      `}</style>
    </>
  );
}
