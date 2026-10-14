'use client';

import { useRova } from '@/hooks/useRova';
import { useWallet } from '@/hooks/useWallet';
import { useEffect, useState, useRef } from 'react';
import { Send, Clock, Check, Loader, Sparkles, TrendingUp } from 'lucide-react';
import AssetRow from '@/components/viz/AssetRow';

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
  const {
    syncAgentStatus,
    plan,
    status,
    executionResult,
    executable,
    isProcessing,
    planIntent,
    requestExecutionApproval,
    executePlan,
    reset,
  } = rova;

  const { isConnected, usdcBalance, eurcBalance } = useWallet();
  const [hasMounted, setHasMounted] = useState(false);
  const [intentText, setIntentText] = useState('');
  const [approvalRequested, setApprovalRequested] = useState(false);
  const [approvalCode, setApprovalCode] = useState('');
  const [approvalError, setApprovalError] = useState<string | null>(null);

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
    setApprovalRequested(false);
    setApprovalCode('');
    setApprovalError(null);

    await planIntent(textToSend);
  };

  const handleRequestApproval = async () => {
    setApprovalError(null);
    try {
      const approval = await requestExecutionApproval();
      setApprovalRequested(true);
      if (approval.developmentCode) setApprovalCode(approval.developmentCode);
    } catch (error) {
      setApprovalError(error instanceof Error ? error.message : 'Unable to request approval code');
    }
  };

  const handleConfirmExecution = async () => {
    setApprovalError(null);
    try {
      await executePlan(approvalCode);
      setApprovalRequested(false);
      setApprovalCode('');
    } catch (error) {
      setApprovalError(error instanceof Error ? error.message : 'Execution failed');
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

                {!isConversationalPlan(plan) && (
                  <>
                  <div className="flex flex-wrap gap-2.5 mt-1">
                    {executable && !approvalRequested ? (
                      <button
                        onClick={() => void handleRequestApproval()}
                        className="px-4 py-2.5 rounded-full bg-[#BFFF00] text-black font-semibold text-xs border-0 cursor-pointer flex items-center gap-1.5 hover:brightness-110 transition-all"
                      >
                        <Sparkles size={14} /> Request approval code
                      </button>
                    ) : executable ? (
                      <div className="flex flex-wrap gap-2 items-center">
                        <input
                          value={approvalCode}
                          onChange={event => setApprovalCode(event.target.value.replace(/\D/g, '').slice(0, 6))}
                          inputMode="numeric"
                          autoComplete="one-time-code"
                          placeholder="6-digit code"
                          className="px-3 py-2.5 rounded-full bg-surface border border-border text-text-primary text-xs outline-none"
                        />
                        <button
                          onClick={() => void handleConfirmExecution()}
                          disabled={!/^\d{6}$/.test(approvalCode) || isProcessing}
                          className="px-4 py-2.5 rounded-full bg-[#BFFF00] disabled:opacity-40 text-black font-semibold text-xs border-0 cursor-pointer"
                        >
                          Approve & Execute
                        </button>
                      </div>
                    ) : (
                      <span className="px-4 py-2.5 rounded-full bg-amber-500/10 border border-amber-500/25 text-amber-300 font-semibold text-xs">
                        Informational plan — execution unavailable
                      </span>
                    )}

                    <button
                      disabled
                      title="Automation remains disabled pending shared policy acceptance tests"
                      className="px-4 py-2.5 rounded-full bg-surface border border-border text-text-tertiary font-bold text-xs cursor-not-allowed flex items-center gap-1.5 opacity-70"
                    >
                      <Clock size={14} /> Automation paused
                    </button>

                    <button
                      onClick={() => reset()}
                      className="px-4 py-2.5 rounded-full bg-transparent border-0 text-text-secondary font-semibold text-xs cursor-pointer hover:text-text-primary transition-all"
                    >
                      Cancel
                    </button>
                  </div>
                  {approvalError && <p className="text-xs text-red-400 mt-1">{approvalError}</p>}
                  </>
                )}
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
