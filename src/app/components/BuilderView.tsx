import { useState, useEffect } from 'react';
import { useRova } from '../hooks/useRova';
import { useWallet } from '../hooks/useWallet';
import { useExecuteFlow } from '../hooks/useExecuteFlow';
import { useFlowHistory } from '../hooks/flowHistory';
import { arcScan } from '../lib/config';

const DIAGNOSTICS = [
  "Initializing Arc Network Secure Channel...",
  "Querying Reputation Registry (ERC-8004)...",
  "Analyzing liquidity across StableFX and CCTP...",
  "Calibrating capital flow routes...",
  "Validating institutional compliance proofs...",
  "Establishing sub-second finality signatures...",
  "Drafting final execution blueprint..."
];

export default function FlowBuilder() {
  const {
    intent, intentHash, status, plan, reset, error, planIntent
  } = useRova();

  const { isConnected, connectInjected } = useWallet();
  const { updateEntry } = useFlowHistory();

  const {
    execute: executeFlow,
    status:  execStatus,
    results: execResults,
    error:   execError,
    currentIndex,
    reset:   resetExec,
  } = useExecuteFlow();

  const [input,           setInput]           = useState('');
  const [hasMounted,      setHasMounted]      = useState(false);
  const [diagnosticIndex, setDiagnosticIndex] = useState(0);

  useEffect(() => { setHasMounted(true); }, []);

  // Progress through diagnostic messages while planning
  useEffect(() => {
    if (status === 'planning') {
      const interval = setInterval(() => {
        setDiagnosticIndex(prev => (prev + 1) % DIAGNOSTICS.length);
      }, 1500);
      return () => clearInterval(interval);
    } else {
      setDiagnosticIndex(0);
    }
  }, [status]);

  // When a real execution completes, update history with real tx hashes
  useEffect(() => {
    if (execStatus === 'confirmed' && intentHash && execResults.length > 0) {
      const realHashes = execResults
        .filter(r => r.txHash.startsWith('0x'))
        .map(r => r.txHash);

      updateEntry(intentHash, {
        status:          'executed',
        executionResult: {
          txHashes:     realHashes,
          arcScanLinks: realHashes.map(h => arcScan.tx(h)),
          gasUsed:      plan?.gasEstimate?.totalGasUsdc ?? 0,
          confirmedAt:  new Date().toISOString(),
        },
        executedAt: new Date().toISOString(),
      });
    }
  }, [execStatus, intentHash, execResults, updateEntry, plan]);

  const handlePlan = () => {
    const text = input.trim();
    if (!text) return;
    resetExec();
    planIntent(text);
  };

  const handleReset = () => {
    reset();
    resetExec();
    setInput('');
  };

  if (!hasMounted) return null;

  const isExecuting = execStatus === 'awaiting_signature' || execStatus === 'confirming';
  const isDone      = execStatus === 'confirmed';

  return (
    <div style={{ padding: '40px', maxWidth: '1000px', margin: '0 auto' }} className="animate-fade-up">

      {/* Header */}
      <div style={{ textAlign: 'center', marginBottom: '48px' }}>
        <h1 style={{ fontSize: '48px', fontWeight: 800, fontFamily: 'var(--font-display)', marginBottom: '12px' }} className="text-gradient">
          Architect Flow
        </h1>
        <p style={{ color: 'var(--muted)', fontSize: '16px', maxWidth: '600px', margin: '0 auto' }}>
          Input your intent. Our agent utilizes Arc Native, StableFX, and CCTP to execute optimal capital flow sequences.
        </p>
      </div>

      {/* Input Area */}
      {(status === 'idle' || status === 'error' || status === 'planning') && (
        <div className="glass-panel" style={{ padding: '32px', borderRadius: '32px', border: '1px solid var(--border2)', background: 'rgba(255,255,255,0.01)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '24px' }}>
            <div style={{ width: 10, height: 10, borderRadius: '50%', background: status === 'error' ? '#ff4d4d' : 'var(--mint)', boxShadow: status === 'error' ? '0 0 10px #ff4d4d' : '0 0 10px var(--mint)' }} />
            <span className="mono-tag" style={{ color: status === 'error' ? '#ff4d4d' : 'var(--muted)', fontSize: '11px' }}>
              {status === 'error' ? 'SYSTEM ERROR' : 'Intent Processor v2.0'}
            </span>
          </div>

          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handlePlan(); } }}
            disabled={status === 'planning'}
            placeholder="e.g. Send 10 USDC to 0xff3a... via Arc Native"
            style={{
              width: '100%', height: '140px', background: 'transparent', border: 'none',
              color: '#fff', fontSize: '18px', fontFamily: 'var(--font-main)', fontWeight: 500,
              resize: 'none', outline: 'none', marginBottom: '24px',
              opacity: status === 'planning' ? 0.6 : 1
            }}
          />

          {status === 'error' && (
            <div style={{ marginBottom: '24px', padding: '16px', borderRadius: '12px', background: 'rgba(255, 77, 77, 0.1)', border: '1px solid rgba(255, 77, 77, 0.2)', color: '#ff4d4d', fontSize: '14px', fontWeight: 600 }}>
              {error || 'An unexpected error occurred during architecting.'}
            </div>
          )}

          <div style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: '20px' }}>
            {status === 'planning' && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }}>
                  <span style={{ fontSize: '10px', color: 'var(--mint)', fontWeight: 800, fontFamily: 'var(--font-mono)' }}>AGENT ORCHESTRATOR</span>
                  <span style={{ fontSize: '12px', color: '#fff', fontWeight: 600 }}>{DIAGNOSTICS[diagnosticIndex]}</span>
                </div>
                <span className="animate-spin" style={{ width: 18, height: 18, border: '2px solid transparent', borderTopColor: 'var(--mint)', borderRadius: '50%', display: 'inline-block' }} />
              </div>
            )}
            <button
              onClick={() => handlePlan()}
              disabled={!input.trim() || status === 'planning'}
              className="cyber-button"
              style={{
                padding: '14px 32px', borderRadius: '16px',
                background: status === 'error' ? '#ff4d4d' : 'linear-gradient(90deg, var(--lime), var(--mint))',
                border: 'none', color: '#000', fontWeight: 800, cursor: 'pointer',
                opacity: (input.trim() && status !== 'planning') ? 1 : 0.5
              }}
            >
              {status === 'planning' ? 'ARCHITECTING...' : status === 'error' ? 'RETRY ARCHITECTING' : 'INITIATE PLAN'}
            </button>
          </div>
        </div>
      )}

      {/* Execution Blueprint */}
      {(status === 'planned' || status === 'executing' || status === 'recording' || status === 'confirmed') && plan && (
        <div className="animate-fade-up">
          <div className="glass-panel" style={{ padding: '40px', borderRadius: '40px', border: '2px solid var(--mint)', boxShadow: '0 0 50px rgba(180, 244, 215, 0.1)' }}>

            {/* Blueprint Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '40px' }}>
              <div>
                <h3 style={{ fontSize: '28px', fontWeight: 800, fontFamily: 'var(--font-display)', marginBottom: '4px' }}>Execution Blueprint</h3>
                <p className="mono-tag" style={{ color: 'var(--subtle)' }}>HASH: {intentHash?.slice(0, 32)}</p>
              </div>
              <div style={{ padding: '8px 20px', borderRadius: '12px', background: 'rgba(180,244,215,0.1)', border: '1px solid var(--mint)', color: 'var(--mint)' }}>
                <span className="mono-tag">{plan.risk?.toUpperCase()} RISK PROFILE</span>
              </div>
            </div>

            {/* Splits + Strategy */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '40px', marginBottom: '40px' }}>
              {/* Splits */}
              <div>
                <h4 className="mono-tag" style={{ color: 'var(--muted)', marginBottom: '20px' }}>Protocol Sequence</h4>
                {plan.splits.map((s, i) => {
                  const result = execResults.find(r => r.splitIndex === i);
                  const isInstitutional = result?.txHash === 'INSTITUTIONAL_ROUTE';
                  return (
                    <div key={i} style={{ padding: '20px', borderRadius: '20px', background: 'rgba(255,255,255,0.03)', border: `1px solid ${result ? 'var(--mint)' : 'var(--border)'}`, marginBottom: '12px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                        <span style={{ fontWeight: 800, color: '#fff' }}>{s.recipient}</span>
                        <span style={{ fontWeight: 800, color: 'var(--mint)' }}>${s.amount} {s.currency}</span>
                      </div>
                      <div className="mono-tag" style={{ fontSize: '10px', color: 'var(--subtle)', marginBottom: '8px', wordBreak: 'break-all' }}>
                        {s.address}
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <div style={{ width: 6, height: 6, borderRadius: '50%', background: result ? 'var(--mint)' : 'var(--blue)' }} />
                          <span className="mono-tag" style={{ fontSize: '10px', color: 'var(--muted)' }}>VIA {s.arcProtocol}</span>
                        </div>
                        {/* Real tx hash link */}
                        {result && !isInstitutional && (
                          <a href={result.arcScanUrl} target="_blank" rel="noreferrer"
                            className="mono-tag"
                            style={{ fontSize: '9px', color: 'var(--mint)', textDecoration: 'none', borderBottom: '1px solid rgba(180, 244, 215, 0.4)' }}>
                            {result.txHash.slice(0, 8)}...{result.txHash.slice(-6)} ↗
                          </a>
                        )}
                        {isInstitutional && (
                          <span className="mono-tag" style={{ fontSize: '9px', color: '#ff9900' }}>Requires Circle credentials</span>
                        )}
                        {currentIndex === i && isExecuting && (
                          <span className="mono-tag" style={{ fontSize: '9px', color: 'var(--mint)' }}>
                            {execStatus === 'awaiting_signature' ? 'Waiting for signature...' : 'Confirming on Arc...'}
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Agent Logic */}
              <div className="glass-panel" style={{ padding: '24px', borderRadius: '24px', background: 'rgba(255,255,255,0.02)' }}>
                <h4 className="mono-tag" style={{ color: 'var(--muted)', marginBottom: '16px' }}>Agent Logic</h4>
                <p style={{ fontSize: '15px', lineHeight: 1.6, color: 'rgba(255,255,255,0.8)', fontStyle: 'italic', marginBottom: '24px' }}>
                  "{plan.reasoning}"
                </p>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                  <div style={{ padding: '12px', borderRadius: '12px', background: 'rgba(0,0,0,0.3)' }}>
                    <p className="mono-tag" style={{ fontSize: '9px', color: 'var(--muted)' }}>Estimated Gas</p>
                    <p style={{ fontWeight: 800, color: 'var(--mint)' }}>{plan.gasEstimate?.totalGasUsdc} USDC</p>
                  </div>
                  <div style={{ padding: '12px', borderRadius: '12px', background: 'rgba(0,0,0,0.3)' }}>
                    <p className="mono-tag" style={{ fontSize: '9px', color: 'var(--muted)' }}>Settlement Time</p>
                    <p style={{ fontWeight: 800, color: 'var(--mint)' }}>&lt; 1s</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Execution error */}
            {execStatus === 'error' && execError && (
              <div style={{ marginBottom: '24px', padding: '16px', borderRadius: '12px', background: 'rgba(255,77,77,0.1)', border: '1px solid rgba(255,77,77,0.3)', color: '#ff4d4d', fontSize: '14px' }}>
                {execError}
              </div>
            )}

            {/* Confirmed Summary */}
            {isDone && execResults.filter(r => r.txHash.startsWith('0x')).length > 0 && (
              <div style={{ marginBottom: '24px', padding: '20px', borderRadius: '16px', background: 'rgba(180,244,215,0.05)', border: '1px solid rgba(180,244,215,0.2)' }}>
                <p className="mono-tag" style={{ color: 'var(--mint)', marginBottom: '12px', fontSize: '11px' }}>SETTLEMENT CONFIRMED</p>
                {execResults.filter(r => r.txHash.startsWith('0x')).map((r, i) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                    <span style={{ fontSize: '13px', color: 'rgba(255,255,255,0.8)' }}>{r.amount} {r.currency} → {r.recipient}</span>
                    <a href={r.arcScanUrl} target="_blank" rel="noreferrer"
                      style={{ fontSize: '12px', color: 'var(--mint)', fontFamily: 'var(--font-mono)', textDecoration: 'none' }}>
                      View on ArcScan ↗
                    </a>
                  </div>
                ))}
              </div>
            )}

            {/* Actions */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid var(--border)', paddingTop: '32px' }}>
              <button onClick={() => handleReset()} style={{ background: 'transparent', border: 'none', color: 'var(--subtle)', fontWeight: 700, cursor: 'pointer', textTransform: 'uppercase', fontSize: '11px' }}>
                {isDone ? 'New Flow' : 'Cancel'}
              </button>

              {!isConnected ? (
                <div style={{ display: 'flex', gap: '12px' }}>
                  <button onClick={() => connectInjected()} className="cyber-button"
                    style={{ padding: '14px 32px', borderRadius: '16px', background: 'var(--lime)', color: '#000', fontWeight: 800, border: 'none', cursor: 'pointer' }}>
                    CONNECT WALLET
                  </button>
                </div>
              ) : isDone ? (
                <button onClick={() => handleReset()} className="cyber-button"
                  style={{ padding: '16px 48px', borderRadius: '20px', background: 'var(--surface2)', color: 'var(--mint)', fontWeight: 900, fontSize: '16px', border: '1px solid var(--mint)', cursor: 'pointer' }}>
                  ARCHITECT ANOTHER FLOW
                </button>
              ) : (
                <button
                  onClick={() => executeFlow(plan)}
                  disabled={isExecuting}
                  className="cyber-button"
                  style={{
                    padding: '16px 48px', borderRadius: '20px',
                    background: isExecuting ? 'rgba(180,244,215,0.1)' : 'linear-gradient(90deg, var(--lime), var(--mint))',
                    color: isExecuting ? 'var(--mint)' : '#000', fontWeight: 900, fontSize: '16px',
                    border: isExecuting ? '1px solid var(--mint)' : 'none', cursor: isExecuting ? 'wait' : 'pointer'
                  }}>
                  {execStatus === 'awaiting_signature'
                    ? `SIGN TX ${currentIndex + 1}/${plan.splits.length} IN WALLET...`
                    : execStatus === 'confirming'
                    ? 'CONFIRMING ON ARC...'
                    : 'CONFIRM & BROADCAST'}
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
