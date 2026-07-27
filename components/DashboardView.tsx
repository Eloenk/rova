'use client';

import { useRova } from '@/hooks/useRova';
import { useWallet } from '@/hooks/useWallet';
import { useEffect, useState, useRef } from 'react';
import { Sparkles, Send, Clock, Bell } from 'lucide-react';
import FlowPlanCard from '@/components/dashboard/FlowPlanCard';

type TriggerChoice = 'now' | 'recurring' | 'on_receive';

interface ChatMessage {
  id: string;
  sender: 'user' | 'agent';
  text: string;
}

export default function Dashboard() {
  const rova = useRova();
  const { syncAgentStatus, plan, status, executionResult, processingMs, planIntent, executePlan, reset } = rova;
  const { isConnected, address } = useWallet();
  const [hasMounted, setHasMounted] = useState(false);
  const [intentText, setIntentText] = useState('');
  const [showTriggerPicker, setShowTriggerPicker] = useState(false);
  const [triggerChoice, setTriggerChoice] = useState<TriggerChoice>('recurring');
  const [interval, setInterval_] = useState<'daily' | 'weekly' | 'monthly'>('monthly');
  const [minAmount, setMinAmount] = useState('50');
  const [automating, setAutomating] = useState(false);
  const [automateMsg, setAutomateMsg] = useState<string | null>(null);

  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setHasMounted(true);
    syncAgentStatus();
  }, [syncAgentStatus]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, plan]);

  if (!hasMounted) return null;

  const handleSendChat = async () => {
    if (!intentText.trim() || status === 'planning') return;
    const userMsg: ChatMessage = {
      id: Date.now().toString(),
      sender: 'user',
      text: intentText,
    };
    setMessages(prev => [...prev, userMsg]);
    const prompt = intentText;
    setIntentText('');
    setAutomateMsg(null);
    setShowTriggerPicker(false);
    await planIntent(prompt);
  };

  const handleMakeAutomatic = async () => {
    if (!plan) return;
    setAutomating(true);
    setAutomateMsg(null);
    try {
      const custodyMode = isConnected ? 'self_custody' : 'managed';
      const trigger = triggerChoice === 'recurring'
        ? { type: 'recurring' as const, interval }
        : { type: 'on_receive' as const, minAmountUsdc: parseFloat(minAmount) || 50 };

      const res = await fetch('/api/agent/intents', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          intentText,
          plan,
          trigger,
          custodyMode,
          sourceWallet: isConnected ? address : undefined,
        }),
      });
      const data = await res.json();
      if (!data.ok) { setAutomateMsg(`Couldn't automate: ${data.error}`); return; }
      setAutomateMsg('Saved. Rova will run this on its own from now on — check the Agent tab.');
      reset();
      setShowTriggerPicker(false);
    } catch (e) {
      setAutomateMsg(e instanceof Error ? e.message : 'Something went wrong');
    } finally {
      setAutomating(false);
    }
  };

  return (
    <div style={{
      width: '100%',
      minHeight: 'calc(100vh - 80px)',
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'space-between',
      position: 'relative',
      padding: '24px 16px',
      fontFamily: 'Inter, -apple-system, sans-serif',
      boxSizing: 'border-box',
    }}>
      {/* Gemini Web Canvas Content Area */}
      <div style={{
        flex: 1,
        maxWidth: '840px',
        width: '100%',
        margin: '0 auto',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: messages.length === 0 && !plan ? 'center' : 'flex-start',
        paddingBottom: '100px',
      }}>
        {/* Centered Welcome Title when no conversation history */}
        {messages.length === 0 && !plan && (
          <div style={{ textAlign: 'center', margin: 'auto 0' }}>
            <h1 style={{
              fontSize: '42px',
              fontWeight: 700,
              color: '#ffffff',
              letterSpacing: '-0.02em',
              marginBottom: '12px',
            }}>
              Ready when you are
            </h1>
            <p style={{ fontSize: '15px', color: '#8b9ba8', maxWidth: '480px', margin: '0 auto' }}>
              Ask Rova to send USDC, execute cross-border swaps, or configure autonomous triggers on Arc.
            </p>
          </div>
        )}

        {/* Gemini Web Streamlined Message Feed (No Box Containers, No Avatars) */}
        {messages.length > 0 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', width: '100%' }}>
            {messages.map(m => (
              <div key={m.id} style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                <div style={{ fontSize: '12px', fontWeight: 700, color: m.sender === 'user' ? '#8b9ba8' : '#BFFF00' }}>
                  {m.sender === 'user' ? 'You' : 'Rova'}
                </div>
                <div style={{
                  fontSize: '16px',
                  lineHeight: 1.6,
                  color: '#ffffff',
                  fontWeight: 500,
                  whiteSpace: 'pre-wrap',
                }}>
                  {m.text}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Active Flow Plan Card inside Gemini Canvas */}
        {plan && (
          <div style={{ marginTop: '24px', width: '100%' }}>
            <FlowPlanCard
              plan={plan}
              status={status}
              executionResult={executionResult}
              onExecute={() => executePlan(isConnected ? address : undefined)}
              isWalletConnected={isConnected}
              processingMs={processingMs}
            />

            {status === 'planned' && (
              <div style={{ marginTop: '12px' }}>
                {!showTriggerPicker ? (
                  <button
                    onClick={() => setShowTriggerPicker(true)}
                    style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '9px 14px', borderRadius: '10px', background: 'rgba(191,255,0,0.08)', border: '1px solid rgba(191,255,0,0.25)', color: '#BFFF00', fontWeight: 700, fontSize: '12px', cursor: 'pointer' }}
                  >
                    <Clock size={14} /> Make this automatic instead
                  </button>
                ) : (
                  <div style={{ padding: '14px', borderRadius: '14px', background: '#0d1520', border: '1px solid rgba(180, 244, 215, 0.15)' }}>
                    <p style={{ fontSize: '11px', fontWeight: 700, color: '#8b9ba8', textTransform: 'uppercase', marginBottom: '8px' }}>Run this automatically</p>
                    <div style={{ display: 'flex', gap: '8px', marginBottom: '12px' }}>
                      <TriggerTab active={triggerChoice === 'recurring'} onClick={() => setTriggerChoice('recurring')} icon={<Clock size={14} />} label="On a schedule" />
                      <TriggerTab active={triggerChoice === 'on_receive'} onClick={() => setTriggerChoice('on_receive')} icon={<Bell size={14} />} label="On payment receive" />
                    </div>

                    {triggerChoice === 'recurring' ? (
                      <select value={interval} onChange={e => setInterval_(e.target.value as any)} style={pickerInputStyle}>
                        <option value="daily">Every day</option>
                        <option value="weekly">Every week</option>
                        <option value="monthly">Every month</option>
                      </select>
                    ) : (
                      <label style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                        <span style={{ fontSize: '11px', color: '#8b9ba8' }}>Min payment trigger threshold</span>
                        <input value={minAmount} onChange={e => setMinAmount(e.target.value)} type="number" step="1" style={pickerInputStyle} />
                      </label>
                    )}

                    <button
                      onClick={handleMakeAutomatic}
                      disabled={automating}
                      style={{ marginTop: '12px', width: '100%', padding: '10px', borderRadius: '8px', background: '#BFFF00', color: '#000000', fontWeight: 800, border: 'none', cursor: 'pointer', fontSize: '12px' }}
                    >
                      {automating ? 'Saving...' : 'Confirm automation'}
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {automateMsg && (
          <div style={{ marginTop: '14px', fontSize: '13px', color: automateMsg.startsWith("Couldn't") ? '#ef4444' : '#22c55e' }}>
            {automateMsg}
          </div>
        )}

        <div ref={chatEndRef} />
      </div>

      {/* Floating Bottom Pill Prompt Bar (Gemini Web Style) */}
      <div style={{
        position: 'fixed',
        bottom: '24px',
        left: '50%',
        transform: 'translateX(-50%)',
        maxWidth: '720px',
        width: 'calc(100% - 32px)',
        zIndex: 30,
      }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          padding: '8px 12px 8px 20px',
          borderRadius: '32px',
          background: '#131d2a',
          border: '1px solid rgba(180, 244, 215, 0.2)',
          boxShadow: '0 16px 40px rgba(0, 0, 0, 0.6)',
        }}>
          <input
            value={intentText}
            onChange={e => setIntentText(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleSendChat()}
            placeholder="Ask Rova..."
            style={{
              flex: 1,
              background: 'transparent',
              border: 'none',
              color: '#ffffff',
              fontSize: '15px',
              outline: 'none',
              fontFamily: 'Inter, sans-serif',
            }}
          />

          <button
            onClick={handleSendChat}
            disabled={status === 'planning' || !intentText.trim()}
            style={{
              width: '40px',
              height: '40px',
              borderRadius: '50%',
              background: intentText.trim() ? '#BFFF00' : 'rgba(255,255,255,0.05)',
              border: 'none',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: intentText.trim() ? 'pointer' : 'default',
              transition: 'all 0.2s ease',
            }}
          >
            <Send size={16} color={intentText.trim() ? '#0d1520' : '#8b9ba8'} />
          </button>
        </div>
      </div>
    </div>
  );
}

function TriggerTab({ active, onClick, icon, label }: { active: boolean; onClick: () => void; icon: React.ReactNode; label: string }) {
  return (
    <button
      onClick={onClick}
      style={{
        display: 'flex', alignItems: 'center', gap: '6px', padding: '7px 12px', borderRadius: '8px',
        background: active ? 'rgba(191,255,0,0.1)' : 'rgba(255,255,255,0.02)',
        border: `1px solid ${active ? 'rgba(191,255,0,0.35)' : 'rgba(180,244,215,0.15)'}`,
        color: active ? '#BFFF00' : '#8b9ba8', fontWeight: 700, fontSize: '11px', cursor: 'pointer',
      }}
    >
      {icon} {label}
    </button>
  );
}

const pickerInputStyle: React.CSSProperties = {
  width: '100%', padding: '9px 12px', borderRadius: '8px', background: '#131d2a',
  border: '1px solid rgba(180,244,215,0.15)', color: '#ffffff', fontSize: '12px', outline: 'none',
};
