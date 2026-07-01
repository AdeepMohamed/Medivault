import { useState, useEffect, useRef } from 'react';
import api from '../services/api';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import toast from 'react-hot-toast';
import './AIAssistant.css';

const SUGGESTED_QUESTIONS = [
  'What should I know about my blood pressure readings?',
  'Can you explain what HbA1c levels mean?',
  'What are common side effects of antibiotics?',
  'How do I read a CBC (Complete Blood Count) report?',
  'What is the difference between HDL and LDL cholesterol?',
];

const AIAssistant = () => {
  const [messages, setMessages] = useState([
    {
      role: 'assistant',
      content: `👋 Hello! I'm your **MediVault Health Assistant**, powered by AI.

I can help you:
- 📄 Understand your medical reports and prescriptions
- 💡 Answer general health questions
- 🔍 Explain medical terms and lab values
- 🌿 Provide wellness recommendations

**Important**: I'm an AI assistant and cannot replace professional medical advice. Always consult a qualified healthcare provider for medical decisions.

How can I help you today?`,
    },
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [records, setRecords] = useState([]);
  const [selectedRecord, setSelectedRecord] = useState('');
  const messagesEndRef = useRef(null);

  useEffect(() => {
    api.get('/records?limit=20').then(res => setRecords(res.data.records || [])).catch(() => {});
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const sendMessage = async (text) => {
    const msg = text || input.trim();
    if (!msg || loading) return;
    setInput('');

    const userMessage = { role: 'user', content: msg };
    setMessages(prev => [...prev, userMessage]);
    setLoading(true);

    try {
      const history = messages.slice(-10).map(m => ({
        role: m.role,
        content: m.content,
      }));

      const { data } = await api.post('/ai/chat', {
        message: msg,
        history,
        recordId: selectedRecord || undefined,
      });

      if (data.isEmergency) {
        setMessages(prev => [...prev, {
          role: 'assistant',
          content: data.response,
          isEmergency: true,
        }]);
      } else {
        setMessages(prev => [...prev, {
          role: 'assistant',
          content: data.response,
        }]);
      }
    } catch (err) {
      toast.error('AI service unavailable. Please check your API key.');
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: '⚠️ I\'m temporarily unavailable. Please try again or consult a healthcare professional.',
      }]);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  return (
    <div className="page-content animate-in" style={{ height: 'calc(100vh - 32px)', display: 'flex', flexDirection: 'column', padding: '24px' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
        <div>
          <h1 className="page-title" style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <span>🤖</span> AI Health Assistant
            <span className="badge badge-purple">Groq AI</span>
          </h1>
          <p className="page-subtitle">Ask health questions or get your reports explained</p>
        </div>

        {/* Record Context Selector */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>Context:</span>
          <select
            className="form-select"
            style={{ width: 200 }}
            value={selectedRecord}
            onChange={e => setSelectedRecord(e.target.value)}
            id="ai-record-context"
          >
            <option value="">No record context</option>
            {records.map(r => (
              <option key={r.id} value={r.id}>{r.title}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Messages */}
      <div className="ai-messages">
        {messages.map((msg, i) => (
          <div key={i} className={`ai-message ${msg.role} ${msg.isEmergency ? 'emergency' : ''}`}>
            <div className="ai-avatar">
              {msg.role === 'assistant' ? '🤖' : '👤'}
            </div>
            <div className="ai-bubble">
              {msg.isEmergency && (
                <div className="emergency-banner" style={{ marginBottom: 12 }}>
                  <span style={{ fontSize: 24 }}>🚨</span>
                  <span style={{ fontWeight: 700, color: '#ef4444' }}>EMERGENCY — Call 112 / 911 immediately</span>
                </div>
              )}
              <div className="ai-markdown">
                <ReactMarkdown remarkPlugins={[remarkGfm]}>
                  {msg.content}
                </ReactMarkdown>
              </div>
            </div>
          </div>
        ))}

        {loading && (
          <div className="ai-message assistant">
            <div className="ai-avatar">🤖</div>
            <div className="ai-bubble">
              <div className="ai-typing">
                <span /><span /><span />
              </div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Suggested Questions */}
      {messages.length <= 1 && (
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 12 }}>
          {SUGGESTED_QUESTIONS.map((q, i) => (
            <button
              key={i}
              className="btn btn-ghost btn-sm"
              style={{ fontSize: 12, padding: '5px 12px', textAlign: 'left' }}
              onClick={() => sendMessage(q)}
            >
              {q}
            </button>
          ))}
        </div>
      )}

      {/* Disclaimer */}
      <div style={{ fontSize: 11, color: 'var(--text-muted)', textAlign: 'center', marginBottom: 8 }}>
        ⚕️ AI responses are for informational purposes only. Not medical advice.
      </div>

      {/* Input */}
      <div className="ai-input-bar">
        <textarea
          id="ai-message-input"
          className="ai-input"
          placeholder="Ask a health question... (Enter to send, Shift+Enter for new line)"
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          rows={1}
          disabled={loading}
        />
        <button
          className="btn btn-primary"
          onClick={() => sendMessage()}
          disabled={loading || !input.trim()}
          id="ai-send-btn"
          style={{ borderRadius: 'var(--radius-md)', padding: '10px 18px' }}
        >
          {loading ? <span className="spinner spinner-sm" /> : '➤'}
        </button>
      </div>
    </div>
  );
};

export default AIAssistant;
