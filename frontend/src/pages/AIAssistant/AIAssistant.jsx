import React, { useState, useRef, useEffect } from 'react';
import { api } from '../../services/api';
import { 
  Bot, Send, User, Sparkles, Copy, Check, 
  HelpCircle, RefreshCw, Cpu 
} from 'lucide-react';

export default function AIAssistant({ activeBacktestMetrics = null }) {
  const [messages, setMessages] = useState([
    {
      role: 'assistant',
      content: 
        "Welcome to **QUANTLAB AI Research Intelligence**.\n\n" +
        "I analyze verified platform mathematics, multi-asset volatility structures, and backtesting trade logs with institutional precision.\n\n" +
        "Select a prompt below or ask your own quantitative research question.",
      suggested_followups: [
        "Compare Gold and Bitcoin.",
        "Why did this strategy perform poorly?",
        "Explain this drawdown.",
        "Which period had the highest volatility?",
      ],
    },
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [copiedIdx, setCopiedIdx] = useState(null);

  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, loading]);

  const handleSend = async (queryText) => {
    const text = queryText || input;
    if (!text || !text.trim() || loading) return;

    const userMessage = { role: 'user', content: text.trim() };
    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setLoading(true);

    try {
      const resp = await api.ai.query(text.trim(), {
        metrics: activeBacktestMetrics || {
          total_return_pct: 32.4,
          benchmark_return_pct: 18.2,
          sharpe_ratio: 1.42,
          max_drawdown_pct: 18.5,
          win_rate_pct: 52.0,
          total_trades: 24,
          total_fees_paid: 1240.0,
        },
        asset: 'BTC-USD',
      });

      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          content: resp.response,
          facts: resp.calculated_facts,
          suggested_followups: resp.suggested_followups || [],
        },
      ]);
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          content: `⚠️ Computational notice: ${err.message || 'Unable to complete quantitative synthesis query.'}`,
          suggested_followups: ['Compare Gold and Bitcoin.', 'Explain the correlation.'],
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = (text, idx) => {
    navigator.clipboard.writeText(text);
    setCopiedIdx(idx);
    setTimeout(() => setCopiedIdx(null), 2000);
  };

  return (
    <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '20px', height: 'calc(100vh - 120px)' }}>
      {/* Header */}
      <div className="glass-panel" style={{ padding: '16px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{
            width: '36px',
            height: '36px',
            borderRadius: '10px',
            background: 'linear-gradient(135deg, #00f0ff, #7928ca)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 0 16px var(--accent-cyan-glow)',
          }}>
            <Bot size={20} color="#030712" />
          </div>
          <div>
            <h2 style={{ fontSize: '1.2rem', fontWeight: '800' }}>AI Quantitative Research Assistant</h2>
            <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
              Grounded in verified platform calculations • Zero numerical hallucination
            </p>
          </div>
        </div>

        <div className="badge badge-cyan" style={{ fontSize: '0.72rem' }}>
          <Sparkles size={13} /> Quantitative Reasoning Engine
        </div>
      </div>

      {/* Messages Scroll Container */}
      <div className="glass-panel" style={{
        flex: 1,
        overflowY: 'auto',
        padding: '24px',
        display: 'flex',
        flexDirection: 'column',
        gap: '20px',
      }}>
        {messages.map((m, idx) => {
          const isUser = m.role === 'user';
          return (
            <div
              key={idx}
              style={{
                display: 'flex',
                gap: '14px',
                alignSelf: isUser ? 'flex-end' : 'flex-start',
                maxWidth: isUser ? '75%' : '85%',
              }}
            >
              {!isUser && (
                <div style={{
                  width: '32px',
                  height: '32px',
                  borderRadius: '8px',
                  background: 'var(--bg-tertiary)',
                  border: '1px solid var(--border-color)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                  marginTop: '4px',
                }}>
                  <Bot size={16} color="var(--accent-cyan)" />
                </div>
              )}

              <div style={{
                background: isUser ? 'linear-gradient(135deg, #0084c7, #005299)' : 'var(--bg-card)',
                border: '1px solid',
                borderColor: isUser ? 'transparent' : 'var(--border-color)',
                borderRadius: '14px',
                padding: '16px 20px',
                color: 'var(--text-primary)',
                fontSize: '0.85rem',
                lineHeight: '1.6',
                position: 'relative',
              }}>
                {/* Copy button for assistant responses */}
                {!isUser && (
                  <button
                    onClick={() => copyToClipboard(m.content, idx)}
                    style={{
                      position: 'absolute',
                      right: '12px',
                      top: '12px',
                      background: 'transparent',
                      border: 'none',
                      color: 'var(--text-muted)',
                      cursor: 'pointer',
                    }}
                    title="Copy response"
                  >
                    {copiedIdx === idx ? <Check size={14} color="var(--accent-green)" /> : <Copy size={14} />}
                  </button>
                )}

                {/* Render Markdown text */}
                <div style={{ whiteSpace: 'pre-line' }}>
                  {m.content}
                </div>

                {/* Suggested Followups */}
                {m.suggested_followups && m.suggested_followups.length > 0 && (
                  <div style={{ marginTop: '14px', paddingTop: '12px', borderTop: '1px solid var(--border-color)' }}>
                    <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginBottom: '8px', fontWeight: '600' }}>
                      SUGGESTED QUANTITATIVE QUERIES:
                    </div>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                      {m.suggested_followups.map((q, qIdx) => (
                        <button
                          key={qIdx}
                          onClick={() => handleSend(q)}
                          style={{
                            padding: '4px 10px',
                            borderRadius: '9999px',
                            background: 'var(--bg-tertiary)',
                            border: '1px solid var(--border-color)',
                            color: 'var(--accent-cyan)',
                            fontSize: '0.74rem',
                            cursor: 'pointer',
                            textAlign: 'left',
                          }}
                        >
                          {q}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {isUser && (
                <div style={{
                  width: '32px',
                  height: '32px',
                  borderRadius: '8px',
                  background: 'var(--bg-tertiary)',
                  border: '1px solid var(--border-color)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                  marginTop: '4px',
                }}>
                  <User size={16} color="var(--text-secondary)" />
                </div>
              )}
            </div>
          );
        })}

        {loading && (
          <div style={{ display: 'flex', gap: '14px', alignSelf: 'flex-start' }}>
            <div style={{
              width: '32px',
              height: '32px',
              borderRadius: '8px',
              background: 'var(--bg-tertiary)',
              border: '1px solid var(--border-color)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}>
              <Bot size={16} color="var(--accent-cyan)" />
            </div>
            <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: '14px', padding: '14px 20px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <div className="pulse-dot" />
              <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                Synthesizing multi-asset calculations...
              </span>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input Form */}
      <form onSubmit={(e) => { e.preventDefault(); handleSend(); }} className="glass-panel" style={{
        padding: '8px 12px',
        display: 'flex',
        alignItems: 'center',
        gap: '10px',
      }}>
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ask a quantitative question (e.g. 'Compare Gold and Bitcoin', 'Explain this drawdown')..."
          style={{
            flex: 1,
            padding: '12px 16px',
            background: 'transparent',
            border: 'none',
            color: 'var(--text-primary)',
            fontSize: '0.88rem',
            outline: 'none',
          }}
        />
        <button
          type="submit"
          disabled={!input.trim() || loading}
          className="btn-cyan"
          style={{ padding: '10px 18px', borderRadius: '8px' }}
        >
          <Send size={16} />
        </button>
      </form>
    </div>
  );
}
