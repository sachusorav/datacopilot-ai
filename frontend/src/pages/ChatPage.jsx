import React, { useEffect, useState, useRef } from 'react';
import { chatAPI } from '../lib/api';
import LLMStatusChip from '../components/LLMStatusChip';
import {
  Send,
  Square,
  Copy,
  Check,
  RefreshCw,
  Sparkles,
  ChevronDown,
  ChevronRight,
  Calculator,
  Database,
  Bot,
  User
} from 'lucide-react';

export default function ChatPage({ dataset }) {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [isStreaming, setIsStreaming] = useState(false);
  const [copiedIdx, setCopiedIdx] = useState(null);
  const [expandedSources, setExpandedSources] = useState({});
  const messagesEndRef = useRef(null);
  const abortStreamRef = useRef(null);

  const suggestedQuestions = dataset ? [
    'What are the total sales and average per record?',
    'Top 5 categories by total revenue?',
    'What is the dataset health and cleanliness summary?',
    'Find highest order value details'
  ] : [];

  useEffect(() => {
    if (!dataset) return;
    chatAPI.getHistory(dataset.id)
      .then((res) => setMessages(res.data || []))
      .catch((err) => console.error(err));
  }, [dataset]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = (textToSend) => {
    const query = textToSend || input;
    if (!query.trim() || !dataset || isStreaming) return;

    const userMsg = { sender: 'user', text: query, id: Date.now() };
    const aiMsgPlaceholder = {
      sender: 'ai',
      text: '',
      route_used: 'both',
      sources: [],
      provider: 'streaming...',
      id: Date.now() + 1
    };

    setMessages((prev) => [...prev, userMsg, aiMsgPlaceholder]);
    setInput('');
    setIsStreaming(true);

    let accumulatedText = '';

    const cancelFn = chatAPI.streamMessage(
      dataset.id,
      query,
      (startData) => {
        setMessages((prev) => {
          const updated = [...prev];
          const last = updated[updated.length - 1];
          if (last) last.route_used = startData.route;
          return updated;
        });
      },
      (chunk) => {
        accumulatedText += chunk;
        setMessages((prev) => {
          const updated = [...prev];
          const last = updated[updated.length - 1];
          if (last) last.text = accumulatedText;
          return updated;
        });
      },
      (sources, provider) => {
        setMessages((prev) => {
          const updated = [...prev];
          const last = updated[updated.length - 1];
          if (last) {
            last.sources = sources;
            last.provider = provider;
          }
          return updated;
        });
      },
      (err) => {
        console.error('Chat stream error:', err);
        setIsStreaming(false);
      }
    );

    abortStreamRef.current = () => {
      cancelFn();
      setIsStreaming(false);
    };
  };

  const handleStop = () => {
    if (abortStreamRef.current) {
      abortStreamRef.current();
    }
  };

  const copyToClipboard = (text, idx) => {
    navigator.clipboard.writeText(text);
    setCopiedIdx(idx);
    setTimeout(() => setCopiedIdx(null), 2000);
  };

  const toggleSources = (idx) => {
    setExpandedSources((prev) => ({ ...prev, [idx]: !prev[idx] }));
  };

  if (!dataset) {
    return (
      <div className="p-8 text-center text-slate-500">
        Please upload or select a dataset to launch Ask Data chat.
      </div>
    );
  }

  return (
    <div className="flex flex-col h-[calc(100vh-3.5rem)] bg-slate-50 dark:bg-slate-950">
      {/* Messages Scroll Area */}
      <div className="flex-1 overflow-y-auto p-6 space-y-6 max-w-4xl w-full mx-auto">
        {messages.length === 0 && (
          <div className="p-8 text-center space-y-4 my-auto">
            <div className="w-12 h-12 rounded-2xl bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400 flex items-center justify-center mx-auto">
              <Sparkles className="w-6 h-6" />
            </div>
            <h3 className="text-sm font-semibold text-slate-900 dark:text-white">
              Ask DataCopilot AI Anything About Your Dataset
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 max-w-md mx-auto">
              Powered by server-side Pandas calculations and local Llama AI synthesis.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2 pt-4 max-w-xl mx-auto">
              {suggestedQuestions.map((q, idx) => (
                <button
                  key={idx}
                  onClick={() => handleSend(q)}
                  className="p-3 text-left text-xs bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl hover:border-indigo-400 dark:hover:border-indigo-500 font-medium text-slate-700 dark:text-slate-300 transition-all shadow-sm"
                >
                  {q}
                </button>
              ))}
            </div>
          </div>
        )}

        {messages.map((msg, idx) => {
          const isUser = msg.sender === 'user';
          const pandasSource = msg.sources?.find((s) => s.type === 'pandas_aggregate');

          return (
            <div
              key={idx}
              className={`flex gap-4 ${isUser ? 'justify-end' : 'justify-start'}`}
            >
              {!isUser && (
                <div className="w-8 h-8 rounded-xl bg-indigo-600 text-white flex items-center justify-center flex-shrink-0 shadow-md">
                  <Bot className="w-4 h-4" />
                </div>
              )}

              <div
                className={`max-w-2xl rounded-2xl p-4 space-y-3 shadow-sm ${
                  isUser
                    ? 'bg-indigo-600 text-white rounded-br-none'
                    : 'bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white rounded-bl-none'
                }`}
              >
                {/* Calculated by Pandas Banner */}
                {!isUser && pandasSource && (
                  <div className="p-2.5 rounded-xl bg-indigo-50/80 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-800 text-xs text-indigo-900 dark:text-indigo-200 flex items-center justify-between">
                    <span className="flex items-center gap-1.5 font-semibold">
                      <Calculator className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
                      Calculated by Pandas (Server-Side)
                    </span>
                    <span className="text-[10px] opacity-75 uppercase tracking-wider font-mono">Exact</span>
                  </div>
                )}

                <div className="text-xs whitespace-pre-wrap leading-relaxed">
                  {msg.text || (isStreaming && idx === messages.length - 1 ? 'Thinking...' : '')}
                </div>

                {/* Sources Inspector */}
                {!isUser && msg.sources && msg.sources.length > 0 && (
                  <div className="pt-2 border-t border-slate-100 dark:border-slate-800">
                    <button
                      onClick={() => toggleSources(idx)}
                      className="flex items-center gap-1.5 text-[11px] font-semibold text-slate-500 dark:text-slate-400 hover:text-indigo-600"
                    >
                      {expandedSources[idx] ? <ChevronDown className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />}
                      Sources ({msg.sources.length} records retrieved)
                    </button>
                    {expandedSources[idx] && (
                      <div className="mt-2 space-y-1.5 text-[11px] font-mono text-slate-600 dark:text-slate-400">
                        {msg.sources.map((s, sIdx) => (
                          <div key={sIdx} className="p-2 rounded-lg bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">
                            • {s.summary}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {/* Action Buttons */}
                {!isUser && msg.text && (
                  <div className="flex items-center justify-between pt-2 text-[11px] text-slate-400">
                    <span className="capitalize text-[10px] font-mono">
                      Route: {msg.route_used || 'both'}
                    </span>
                    <button
                      onClick={() => copyToClipboard(msg.text, idx)}
                      className="flex items-center gap-1 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
                    >
                      {copiedIdx === idx ? <Check className="w-3 h-3 text-emerald-500" /> : <Copy className="w-3 h-3" />}
                      {copiedIdx === idx ? 'Copied' : 'Copy'}
                    </button>
                  </div>
                )}
              </div>

              {isUser && (
                <div className="w-8 h-8 rounded-xl bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 flex items-center justify-center flex-shrink-0">
                  <User className="w-4 h-4" />
                </div>
              )}
            </div>
          );
        })}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Dock */}
      <div className="p-4 border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 sticky bottom-0">
        <div className="max-w-4xl mx-auto flex items-center gap-3">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSend()}
            placeholder="Ask a question about sales, categories, records, or data health..."
            disabled={isStreaming}
            className="flex-1 px-4 py-3 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:opacity-50"
          />
          {isStreaming ? (
            <button
              onClick={handleStop}
              className="p-3 rounded-xl bg-rose-600 hover:bg-rose-700 text-white shadow-md transition-colors"
              title="Stop Generating"
            >
              <Square className="w-4 h-4 fill-white" />
            </button>
          ) : (
            <button
              onClick={() => handleSend()}
              disabled={!input.trim()}
              className="p-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white shadow-md transition-colors disabled:opacity-40"
              title="Send Message"
            >
              <Send className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
