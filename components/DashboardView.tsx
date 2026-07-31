'use client';

import { useRova } from '@/hooks/useRova';
import { useWallet } from '@/hooks/useWallet';
import { useEffect, useState, useRef } from 'react';
import { Send, Clock, Bell, Check, Loader, Sparkles, TrendingUp } from 'lucide-react';
import AssetRow from '@/components/viz/AssetRow';

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

  const { isConnected, address, usdcBalance, eurcBalance } = useWallet();
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

  const currentUsdc = isConnected ? (usdcBalance ?? '0.00') : '0.00';
  const currentEurc = isConnected ? (eurcBalance ?? '0.00') : '0.00';
  const usdcVal = parseFloat(currentUsdc) || 0;
  const eurcVal = (parseFloat(currentEurc) || 0) * 1.08;
  const totalUsd = (usdcVal + eurcVal).toFixed(2);

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
    <div className="w-full min-h-[calc(100vh-56px)] flex flex-col justify-between relative p-4 md:p-6 font-sans box-border">
      {/* Canvas Content Area */}
      <div className={`
        flex-1 max-w-[840px] w-full mx-auto flex flex-col pb-6 box-border
        ${!hasChatStarted ? 'justify-center items-center' : 'justify-start items-stretch'}
      `}>

        {/* CENTERED HERO INPUT STATE */}
        {!hasChatStarted && (
          <div className="max-w-[720px] w-full my-auto px-3 flex flex-col items-center text-center box-border">
            <h1 className="text-3xl sm:text-4xl md:text-5xl font-light text-text-primary tracking-tight mb-7 leading-tight">
              Ready when you are
            </h1>

            {/* Centered Prompt Input Pill */}
            <div className="w-full flex items-center gap-3 p-2 pl-5 rounded-full bg-surface border border-border-strong shadow-2xl mb-5 box-border focus-within:border-accent-mint transition-all">
              <input
                value={intentText}
                onChange={e => setIntentText(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleSendChat()}
                placeholder="Ask Rova to send, swap, or bridge..."
                className="flex-1 bg-transparent border-0 text-text-primary text-sm sm:text-base outline-none min-w-0 font-sans"
              />

              <button
                onClick={() => handleSendChat()}
                disabled={isProcessing || !intentText.trim()}
                className={`
                  w-10 h-10 rounded-full border-0 flex items-center justify-center shrink-0 transition-all cursor-pointer
                  ${intentText.trim() ? 'bg-accent-primary text-primary-foreground hover:brightness-110' : 'bg-surface-raised text-text-secondary cursor-default'}
                `}
              >
                <Send size={16} />
              </button>
            </div>

            {/* Quick Action Suggestion Links */}
            <div className="flex flex-wrap gap-4 justify-center mt-1">
              {[
                'Send 50 USDC to Alex',
                'Swap 100 USDC for EURC on Arc',
                'Set monthly recurring payment',
              ].map((suggestion, idx) => (
                <button
                  key={idx}
                  onClick={() => handleSendChat(suggestion)}
                  className="bg-transparent border-0 p-0 text-text-secondary text-xs hover:text-text-primary transition-colors cursor-pointer"
                >
                  {suggestion}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* ACTIVE CONVERSATIONAL CHAT FEED */}
        {hasChatStarted && (
          <div className="flex flex-col gap-5 w-full">
            {messages.map(m => (
              <div
                key={m.id}
                className={`
                  flex flex-col max-w-[85%]
                  ${m.sender === 'user' ? 'items-end self-end' : 'items-start self-start'}
                `}
              >
                <div className={`
                  text-[11px] font-bold mb-1 px-1
                  ${m.sender === 'user' ? 'text-text-secondary' : 'text-accent-primary'}
                `}>
                  {m.sender === 'user' ? 'You' : 'Rova'}
                </div>
                <div className={`
                  text-sm sm:text-base leading-relaxed font-medium whitespace-pre-wrap break-words p-3.5 px-4 shadow-md
                  ${m.sender === 'user'
                    ? 'bg-surface-raised border border-border-strong text-text-primary rounded-2xl rounded-tr-sm'
                    : 'bg-surface border border-border text-text-primary rounded-2xl rounded-tl-sm'}
                `}>
                  {m.text}
                </div>
              </div>
            ))}

            {/* Planning Loading State */}
            {status === 'planning' && (
              <div className="flex flex-col items-start self-start max-w-[85%]">
                <div className="text-[11px] font-bold text-accent-primary mb-1 pl-1">Rova</div>
                <div className="flex items-center gap-2.5 bg-surface border border-border rounded-2xl rounded-tl-sm p-3.5 px-4 text-text-secondary text-sm">
                  <Loader size={16} className="animate-spin text-accent-primary" />
                  <span>Thinking...</span>
                </div>
              </div>
            )}

            {/* AI Plan Response & Controls */}
            {plan && status === 'planned' && (
              <div className="flex flex-col items-start self-start max-w-[85%] gap-2 mt-1">
                <div className="text-[11px] font-bold text-accent-primary pl-1">Rova</div>
                <div className="text-sm sm:text-base leading-relaxed font-medium bg-surface border border-border text-text-primary rounded-2xl rounded-tl-sm p-3.5 px-4 shadow-md">
                  {plan.reasoning || plan.strategy || 'I have parsed your transaction request and prepared the execution path on Arc.'}
                </div>

                {!isConversationalPlan(plan) && (!showTriggerPicker ? (
                  <div className="flex flex-wrap gap-2.5 mt-1">
                    <button
                      onClick={() => executePlan(isConnected && address ? address : undefined)}
                      className="px-4 py-2.5 rounded-full bg-accent-primary text-primary-foreground font-extrabold text-xs border-0 cursor-pointer flex items-center gap-1.5 hover:brightness-110 transition-all"
                    >
                      <Sparkles size={14} /> Confirm & Execute
                    </button>

                    <button
                      onClick={() => setShowTriggerPicker(true)}
                      className="px-4 py-2.5 rounded-full bg-accent-mint/10 border border-accent-mint/25 text-accent-mint font-bold text-xs cursor-pointer flex items-center gap-1.5 hover:bg-accent-mint/20 transition-all"
                    >
                      <Clock size={14} /> Make Automatic
                    </button>

                    <button
                      onClick={() => reset()}
                      className="px-4 py-2.5 rounded-full bg-transparent border-0 text-text-secondary font-semibold text-xs cursor-pointer hover:text-text-primary transition-all"
                    >
                      Cancel
                    </button>
                  </div>
                ) : (
                  <div className="p-4 rounded-xl bg-surface border border-border-strong max-w-md flex flex-col gap-3">
                    <span className="text-xs font-bold text-accent-primary">Automation Trigger</span>
                    <div className="flex gap-2">
                      <TriggerTab active={triggerChoice === 'recurring'} onClick={() => setTriggerChoice('recurring')} icon={<Clock size={14} />} label="On schedule" />
                      <TriggerTab active={triggerChoice === 'on_receive'} onClick={() => setTriggerChoice('on_receive')} icon={<Bell size={14} />} label="On payment receive" />
                    </div>

                    {triggerChoice === 'recurring' ? (
                      <select value={interval} onChange={e => setInterval_(e.target.value as any)} className="w-full p-2.5 rounded-lg bg-surface-raised border border-border text-text-primary text-xs outline-none">
                        <option value="daily">Every day</option>
                        <option value="weekly">Every week</option>
                        <option value="monthly">Every month</option>
                      </select>
                    ) : (
                      <label className="flex flex-col gap-1">
                        <span className="text-[11px] text-text-secondary">Min payment trigger threshold</span>
                        <input value={minAmount} onChange={e => setMinAmount(e.target.value)} type="number" step="1" className="w-full p-2.5 rounded-lg bg-surface-raised border border-border text-text-primary text-xs outline-none" />
                      </label>
                    )}

                    <div className="flex gap-2 mt-1">
                      <button
                        onClick={handleMakeAutomatic}
                        disabled={automating}
                        className="flex-1 p-2.5 rounded-lg bg-accent-primary text-primary-foreground font-extrabold text-xs border-0 cursor-pointer hover:brightness-110"
                      >
                        {automating ? 'Saving...' : 'Save Autonomous Trigger'}
                      </button>
                      <button
                        onClick={() => setShowTriggerPicker(false)}
                        className="px-3.5 p-2.5 rounded-lg bg-transparent border border-border text-text-secondary text-xs cursor-pointer hover:text-text-primary"
                      >
                        Back
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Executing State */}
            {(status === 'executing' || status === 'recording') && (
              <div className="flex flex-col gap-1">
                <div className="text-xs font-bold text-accent-primary">Rova</div>
                <div className="flex items-center gap-2 text-text-primary text-sm">
                  <Loader size={16} className="animate-spin text-accent-primary" />
                  <span>Submitting transaction to Arc blockchain via Circle Wallets...</span>
                </div>
              </div>
            )}

            {/* Confirmed State */}
            {(status === 'confirmed' || !!executionResult) && (
              <div className="flex flex-col gap-2">
                <div className="text-xs font-bold text-accent-primary">Rova</div>
                <div className="text-sm text-text-primary flex items-center gap-2 font-medium">
                  <Check size={16} className="text-accent-success" />
                  <span>Transaction executed successfully on Arc!</span>
                </div>
                {executionResult?.txHashes?.[0] && (
                  <span className="text-xs text-text-secondary font-mono">
                    TxHash: {executionResult.txHashes[0]}
                  </span>
                )}
              </div>
            )}

            {automateMsg && (
              <div className={`mt-2 text-xs font-semibold ${automateMsg.startsWith("Couldn't") ? 'text-accent-error' : 'text-accent-success'}`}>
                {automateMsg}
              </div>
            )}
          </div>
        )}

        <div ref={chatEndRef} />
      </div>

      {/* STICKY BOTTOM INPUT BAR */}
      {hasChatStarted && (
        <div className="sticky bottom-4 max-w-[720px] w-full mx-auto z-30 box-border">
          <div className="flex items-center gap-3 p-2 pl-5 rounded-full bg-surface border border-border-strong shadow-2xl w-full box-border focus-within:border-accent-mint transition-all">
            <input
              value={intentText}
              onChange={e => setIntentText(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleSendChat()}
              placeholder="Ask Rova..."
              className="flex-1 bg-transparent border-0 text-text-primary text-sm sm:text-base outline-none font-sans min-w-0"
            />

            <button
              onClick={() => handleSendChat()}
              disabled={isProcessing || !intentText.trim()}
              className={`
                w-10 h-10 rounded-full border-0 flex items-center justify-center shrink-0 transition-all cursor-pointer
                ${intentText.trim() ? 'bg-accent-primary text-primary-foreground hover:brightness-110' : 'bg-surface-raised text-text-secondary cursor-default'}
              `}
            >
              <Send size={16} />
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
      className={`
        flex items-center gap-1.5 px-3 py-2 rounded-lg font-bold text-xs border cursor-pointer transition-all
        ${active
          ? 'bg-accent-primary/10 border-accent-primary/35 text-accent-primary'
          : 'bg-surface-raised border-border text-text-secondary hover:text-text-primary'}
      `}
    >
      {icon} {label}
    </button>
  );
}
