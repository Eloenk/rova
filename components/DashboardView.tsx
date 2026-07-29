'use client';

import { useRova } from '@/hooks/useRova';
import { useWallet } from '@/hooks/useWallet';
import { useEffect, useState, useRef } from 'react';
import { Send, Clock, Bell, Check, Loader, Sparkles } from 'lucide-react';

type TriggerChoice = 'recurring' | 'on_receive';

interface ChatMessage {
  id: string;
  sender: 'user' | 'agent';
  text: string;
}

export function isConversationalPlan(plan: any | null): boolean {
  if (!plan) return true;
  if (!plan.totalAmount || plan.totalAmount <= 0) return true;
  if (plan.splits && plan.splits.every((s: any) => !s.amount || s.amount <= 0)) return true;
  if (plan.splits && plan.splits.some((s: any) => s.recipient === 'Rova Assistant')) return true;
  const str = ((plan.strategy || '') + ' ' + (plan.reasoning || '')).toLowerCase();
  if (str.includes('hello') || str.includes('i am rova') || str.includes('how can i assist') || str.includes('exclusively to financial operations')) return true;
  return false;
}

export default function Dashboard() {
  const rova = useRova();
  const { syncAgentStatus, plan, status, executionResult, isProcessing, planIntent, executePlan, reset } = rova;

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
  }, [messages, plan, status, executionResult]);

  if (!hasMounted) return null;

  const hasChatStarted = messages.length > 0 || status !== 'idle';

  const handleSendChat = async (overridePrompt?: string) => {
    const textToSend = overridePrompt || intentText;
    if (!textToSend.trim() || status === 'planning') return;

    const userMsg: ChatMessage = {
      id: Date.now().toString(),
      sender: 'user',
      text: textToSend,
    };
    setMessages(prev => [...prev, userMsg]);
    setIntentText('');
    setAutomateMsg(null);
    setShowTriggerPicker(false);

    await planIntent(textToSend);
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
      setAutomateMsg('Automated rule active. Rova will execute this autonomously on Arc.');
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
      minHeight: 'calc(100vh - 56px)',
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'space-between',
      position: 'relative',
      padding: '24px 16px 16px',
      fontFamily: 'Inter, -apple-system, sans-serif',
      boxSizing: 'border-box',
    }}>
      {/* Canvas Content Area */}
      <div style={{
        flex: 1,
        maxWidth: '840px',
        width: '100%',
        margin: '0 auto',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: !hasChatStarted ? 'center' : 'flex-start',
        alignItems: !hasChatStarted ? 'center' : 'stretch',
        paddingBottom: '24px',
        boxSizing: 'border-box',
      }}>
        {/* CENTERED HERO INPUT STATE (Before any chat message is sent) */}
        {!hasChatStarted && (
          <div style={{
            maxWidth: '720px',
            width: '100%',
            margin: 'auto 0',
            padding: '0 12px',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            textAlign: 'center',
            boxSizing: 'border-box',
          }}>
            <h1 style={{
              fontSize: 'clamp(30px, 4vw, 42px)',
              fontWeight: 300,
              color: '#ffffff',
              letterSpacing: '-0.02em',
              marginBottom: '28px',
              lineHeight: 1.15,
            }}>
              Ready when you are
            </h1>

            {/* Centered Prompt Input Pill */}
            <div style={{
              width: '100%',
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              padding: '8px 12px 8px 20px',
              borderRadius: '32px',
              background: '#131d2a',
              border: '1px solid rgba(180, 244, 215, 0.25)',
              boxShadow: '0 16px 40px rgba(0, 0, 0, 0.6)',
              boxSizing: 'border-box',
              marginBottom: '20px',
            }}>
              <input
                value={intentText}
                onChange={e => setIntentText(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleSendChat()}
                placeholder="Ask Rova to send, swap, or bridge..."
                style={{
                  flex: 1,
                  background: 'transparent',
                  border: 'none',
                  color: '#ffffff',
                  fontSize: '15px',
                  outline: 'none',
                  fontFamily: 'Inter, sans-serif',
                  minWidth: 0,
                }}
              />

              <button
                onClick={() => handleSendChat()}
                disabled={isProcessing || !intentText.trim()}
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
                  flexShrink: 0,
                }}
              >
                <Send size={16} color={intentText.trim() ? '#0d1520' : '#8b9ba8'} />
              </button>
            </div>

            {/* Quick Action Suggestion Text Links (No Boxes) */}
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '16px', justifyContent: 'center', marginTop: '4px' }}>
              {[
                'Send 50 USDC to Alex',
                'Swap 100 USDC for EURC on Arc',
                'Set monthly recurring payment',
              ].map((suggestion, idx) => (
                <button
                  key={idx}
                  onClick={() => handleSendChat(suggestion)}
                  className="hover:text-white transition-colors"
                  style={{
                    background: 'none',
                    border: 'none',
                    padding: 0,
                    color: '#8b9ba8',
                    fontSize: '12.5px',
                    fontWeight: 400,
                    cursor: 'pointer',
                  }}
                >
                  {suggestion}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* ACTIVE CONVERSATIONAL CHAT FEED */}
        {hasChatStarted && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', width: '100%' }}>
            {messages.map(m => (
              <div
                key={m.id}
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: m.sender === 'user' ? 'flex-end' : 'flex-start',
                  alignSelf: m.sender === 'user' ? 'flex-end' : 'flex-start',
                  maxWidth: '82%',
                }}
              >
                <div style={{
                  fontSize: '11px',
                  fontWeight: 700,
                  color: m.sender === 'user' ? '#8b9ba8' : '#BFFF00',
                  marginBottom: '4px',
                  paddingLeft: m.sender === 'user' ? 0 : '4px',
                  paddingRight: m.sender === 'user' ? '4px' : 0,
                }}>
                  {m.sender === 'user' ? 'You' : 'Rova'}
                </div>
                <div style={{
                  fontSize: '15px',
                  lineHeight: 1.55,
                  color: '#ffffff',
                  fontWeight: 500,
                  whiteSpace: 'pre-wrap',
                  wordBreak: 'break-word',
                  background: m.sender === 'user' ? '#1e2c3d' : '#131d2a',
                  border: m.sender === 'user' ? '1px solid rgba(180, 244, 215, 0.2)' : '1px solid rgba(255, 255, 255, 0.08)',
                  borderRadius: m.sender === 'user' ? '18px 18px 4px 18px' : '18px 18px 18px 4px',
                  padding: '12px 18px',
                  boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
                }}>
                  {m.text}
                </div>
              </div>
            ))}

            {/* Planning Loading Message */}
            {status === 'planning' && (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', alignSelf: 'flex-start', maxWidth: '85%' }}>
                <div style={{ fontSize: '11px', fontWeight: 700, color: '#BFFF00', marginBottom: '4px', paddingLeft: '4px' }}>Rova</div>
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                  background: '#131d2a',
                  border: '1px solid rgba(255, 255, 255, 0.08)',
                  borderRadius: '18px 18px 18px 4px',
                  padding: '12px 18px',
                  color: '#8b9ba8',
                  fontSize: '14.5px',
                }}>
                  <Loader size={16} className="animate-spin" color="#BFFF00" />
                  <span>Thinking...</span>
                </div>
              </div>
            )}


            {/* Conversational AI Response + Inline Action Pills */}
            {plan && status === 'planned' && (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', alignSelf: 'flex-start', maxWidth: '85%', gap: '8px', marginTop: '4px' }}>
                <div style={{ fontSize: '11px', fontWeight: 700, color: '#BFFF00', paddingLeft: '4px' }}>Rova</div>
                <div style={{
                  fontSize: '15px',
                  lineHeight: 1.55,
                  color: '#ffffff',
                  fontWeight: 500,
                  background: '#131d2a',
                  border: '1px solid rgba(255, 255, 255, 0.08)',
                  borderRadius: '18px 18px 18px 4px',
                  padding: '12px 18px',
                  boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
                }}>
                  {plan.reasoning || plan.strategy || 'I have parsed your transaction request and prepared the execution path on Arc.'}
                </div>


                {/* Inline Action Pills (Only shown when there is an actual financial transaction to execute) */}
                {!isConversationalPlan(plan) && (!showTriggerPicker ? (
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px', marginTop: '4px' }}>
                    <button
                      onClick={() => executePlan(isConnected && address ? address : undefined)}
                      style={{
                        padding: '10px 18px',
                        borderRadius: '20px',
                        background: '#BFFF00',
                        color: '#0d1520',
                        fontWeight: 800,
                        fontSize: '13px',
                        border: 'none',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px',
                        transition: 'transform 0.15s ease',
                      }}
                    >
                      <Sparkles size={14} color="#0d1520" /> Confirm & Execute
                    </button>

                    <button
                      onClick={() => setShowTriggerPicker(true)}
                      style={{
                        padding: '10px 18px',
                        borderRadius: '20px',
                        background: 'rgba(180, 244, 215, 0.1)',
                        border: '1px solid rgba(180, 244, 215, 0.25)',
                        color: '#B4F4D7',
                        fontWeight: 700,
                        fontSize: '13px',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px',
                      }}
                    >
                      <Clock size={14} /> Make Automatic
                    </button>

                    <button
                      onClick={() => reset()}
                      style={{
                        padding: '10px 16px',
                        borderRadius: '20px',
                        background: 'transparent',
                        border: 'none',
                        color: '#8b9ba8',
                        fontWeight: 600,
                        fontSize: '13px',
                        cursor: 'pointer',
                      }}
                    >
                      Cancel
                    </button>
                  </div>
                ) : (
                  <div style={{
                    padding: '16px',
                    borderRadius: '16px',
                    background: '#131d2a',
                    border: '1px solid rgba(180, 244, 215, 0.2)',
                    maxWidth: '440px',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '12px',
                  }}>
                    <span style={{ fontSize: '12px', fontWeight: 700, color: '#BFFF00' }}>Automation Trigger</span>
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <TriggerTab active={triggerChoice === 'recurring'} onClick={() => setTriggerChoice('recurring')} icon={<Clock size={14} />} label="On schedule" />
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

                    <div style={{ display: 'flex', gap: '8px', marginTop: '4px' }}>
                      <button
                        onClick={handleMakeAutomatic}
                        disabled={automating}
                        style={{ flex: 1, padding: '10px', borderRadius: '10px', background: '#BFFF00', color: '#0d1520', fontWeight: 800, border: 'none', cursor: 'pointer', fontSize: '13px' }}
                      >
                        {automating ? 'Saving...' : 'Save Autonomous Trigger'}
                      </button>
                      <button
                        onClick={() => setShowTriggerPicker(false)}
                        style={{ padding: '10px 14px', borderRadius: '10px', background: 'transparent', border: '1px solid rgba(255,255,255,0.1)', color: '#8b9ba8', fontSize: '13px', cursor: 'pointer' }}
                      >
                        Back
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Executing / Recording State */}
            {(status === 'executing' || status === 'recording') && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                <div style={{ fontSize: '12px', fontWeight: 700, color: '#BFFF00' }}>Rova</div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#ffffff', fontSize: '15px' }}>
                  <Loader size={16} className="animate-spin" color="#BFFF00" />
                  <span>Submitting transaction to Arc blockchain via Circle Wallets...</span>
                </div>
              </div>
            )}

            {/* Executed / Confirmed Success Message */}
            {(status === 'confirmed' || !!executionResult) && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <div style={{ fontSize: '12px', fontWeight: 700, color: '#BFFF00' }}>Rova</div>
                <div style={{ fontSize: '15px', color: '#ffffff', lineHeight: 1.5, display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Check size={16} color="#22c55e" />
                  <span>Transaction executed successfully on Arc!</span>
                </div>
                {executionResult?.txHashes?.[0] && (
                  <span style={{ fontSize: '12px', color: '#8b9ba8', fontFamily: 'monospace' }}>
                    TxHash: {executionResult.txHashes[0]}
                  </span>
                )}

              </div>
            )}


            {automateMsg && (
              <div style={{ marginTop: '8px', fontSize: '13.5px', color: automateMsg.startsWith("Couldn't") ? '#ef4444' : '#22c55e' }}>
                {automateMsg}
              </div>
            )}
          </div>
        )}

        <div ref={chatEndRef} />
      </div>

      {/* STICKY BOTTOM INPUT BAR (Only visible once a chat has been sent) */}
      {hasChatStarted && (
        <div style={{
          position: 'sticky',
          bottom: '16px',
          maxWidth: '720px',
          width: '100%',
          margin: '0 auto',
          zIndex: 30,
          boxSizing: 'border-box',
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
            width: '100%',
            boxSizing: 'border-box',
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
                minWidth: 0,
              }}
            />

            <button
              onClick={() => handleSendChat()}
              disabled={isProcessing || !intentText.trim()}
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
                flexShrink: 0,
              }}
            >
              <Send size={16} color={intentText.trim() ? '#0d1520' : '#8b9ba8'} />
            </button>
          </div>
        </div>
      )}
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
