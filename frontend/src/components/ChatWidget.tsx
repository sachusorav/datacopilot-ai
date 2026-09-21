import React, { useState, useEffect, useRef } from 'react';
import { 
  Send, 
  Bot, 
  User, 
  Sparkles, 
  Loader2, 
  ChevronDown, 
  ChevronRight, 
  Database, 
  Calculator, 
  AlertCircle,
  RotateCcw
} from 'lucide-react';
import { api, ChatMessage, ChatSource } from '../lib/api';

interface ChatWidgetProps {
  datasetId: string | null;
  filename: string | null;
}

export const ChatWidget: React.FC<ChatWidgetProps> = ({ datasetId, filename }) => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [openSourceId, setOpenSourceId] = useState<number | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (datasetId) {
      loadHistory();
    } else {
      setMessages([]);
    }
  }, [datasetId]);

  useEffect(() => {
    scrollToBottom();
  }, [messages, loading]);

  const loadHistory = async () => {
    if (!datasetId) return;
    try {
      const history = await api.getChatHistory(datasetId);
      if (history.length > 0) {
        setMessages(history);
      } else {
        setMessages([
          {
            sender: 'ai',
            text: `Hello! I am **DataCopilot AI**. I've indexed your dataset \`${filename || 'data'}\` using our hybrid RAG pipeline.\n\nYou can ask me total revenue calculations, top customer lookups, sales trends, or search specific order records!`,
          },
        ]);
      }
    } catch (e) {
      // fallback initial message
      setMessages([
        {
          sender: 'ai',
          text: `Hello! I am **DataCopilot AI**. Ask me anything about your uploaded business data!`,
        },
      ]);
    }
  };

  const handleSend = async () => {
    if (!input.trim() || loading) return;

    if (!datasetId) {
      setError('No dataset loaded. Please upload a dataset first before chatting.');
      return;
    }

    const userText = input.trim();
    setInput('');
    setError(null);

    const userMsg: ChatMessage = { sender: 'user', text: userText };
    setMessages((prev) => [...prev, userMsg]);
    setLoading(true);

    try {
      const resp = await api.sendChatMessage(datasetId, userText);
      const aiMsg: ChatMessage = {
        sender: 'ai',
        text: resp.reply,
        route_used: resp.route_used,
        sources: resp.sources,
      };
      setMessages((prev) => [...prev, aiMsg]);
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to get answer from AI. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-[calc(100vh-6rem)] max-w-4xl mx-auto bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm overflow-hidden">
      {/* Chat Top Banner */}
      <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/50 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-blue-600 text-white flex items-center justify-center shadow-md shadow-blue-500/20">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-bold text-slate-900 dark:text-white text-sm">
              Hybrid RAG AI Data Copilot
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              FAISS Vector Search + Pandas Aggregate Engine + Gemini 2.0 Flash
            </p>
          </div>
        </div>

        {filename && (
          <span className="px-3 py-1 rounded-full text-xs font-semibold bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 border border-blue-200 dark:border-blue-800 flex items-center gap-1.5">
            <Database className="w-3.5 h-3.5" />
            {filename}
          </span>
        )}
      </div>

      {/* Messages Scroll Area */}
      <div className="flex-1 overflow-y-auto p-6 space-y-6">
        {messages.length === 0 && (
          <div className="text-center py-16 space-y-3">
            <Bot className="w-12 h-12 text-slate-300 dark:text-slate-600 mx-auto" />
            <p className="text-sm text-slate-500 dark:text-slate-400 font-medium">
              Upload a dataset and start asking questions in plain English!
            </p>
          </div>
        )}

        {messages.map((msg, index) => {
          const isUser = msg.sender === 'user';
          const isSourceOpen = openSourceId === index;

          return (
            <div
              key={index}
              className={`flex gap-3.5 ${isUser ? 'justify-end' : 'justify-start'}`}
            >
              {!isUser && (
                <div className="w-8 h-8 rounded-xl bg-blue-600 text-white flex items-center justify-center shrink-0 mt-1 shadow-sm">
                  <Bot className="w-4 h-4" />
                </div>
              )}

              <div className={`max-w-[80%] space-y-2`}>
                <div
                  className={`p-4 rounded-2xl text-sm leading-relaxed ${
                    isUser
                      ? 'bg-blue-600 text-white rounded-br-none shadow-sm'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-100 rounded-bl-none border border-slate-200/60 dark:border-slate-700/60'
                  }`}
                >
                  <div className="whitespace-pre-wrap font-sans">{msg.text}</div>
                </div>

                {/* Grounded Sources Inspector Accordion */}
                {!isUser && msg.sources && msg.sources.length > 0 && (
                  <div className="bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden text-xs">
                    <button
                      onClick={() => setOpenSourceId(isSourceOpen ? null : index)}
                      className="w-full px-3 py-2 flex items-center justify-between font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                    >
                      <span className="flex items-center gap-1.5 text-[11px] text-blue-600 dark:text-blue-400 uppercase tracking-wider">
                        {msg.route_used === 'aggregate' ? (
                          <Calculator className="w-3.5 h-3.5" />
                        ) : (
                          <Database className="w-3.5 h-3.5" />
                        )}
                        <span>
                          Grounded Context ({msg.sources.length} {msg.route_used} sources)
                        </span>
                      </span>
                      {isSourceOpen ? (
                        <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
                      ) : (
                        <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
                      )}
                    </button>

                    {isSourceOpen && (
                      <div className="p-3 border-t border-slate-200 dark:border-slate-800 space-y-2 bg-white dark:bg-slate-900/80">
                        {msg.sources.map((src, sIdx) => (
                          <div
                            key={sIdx}
                            className="p-2 rounded-lg bg-slate-50 dark:bg-slate-800/80 border border-slate-200/50 dark:border-slate-700/50 text-slate-700 dark:text-slate-300"
                          >
                            <div className="font-semibold text-[11px] text-slate-500 dark:text-slate-400 mb-0.5">
                              {src.type === 'pandas_aggregate' ? 'Server Calculated Metric' : 'FAISS Vector Search Match'}
                            </div>
                            <div className="font-mono text-[11px]">{src.summary}</div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>

              {isUser && (
                <div className="w-8 h-8 rounded-xl bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200 flex items-center justify-center shrink-0 mt-1">
                  <User className="w-4 h-4" />
                </div>
              )}
            </div>
          );
        })}

        {/* Loading Indicator */}
        {loading && (
          <div className="flex gap-3.5 items-center text-slate-400 text-xs font-medium italic">
            <div className="w-8 h-8 rounded-xl bg-blue-600 text-white flex items-center justify-center">
              <Bot className="w-4 h-4" />
            </div>
            <div className="flex items-center gap-2 p-3 bg-slate-100 dark:bg-slate-800 rounded-2xl rounded-bl-none border border-slate-200/60 dark:border-slate-700/60">
              <Loader2 className="w-4 h-4 animate-spin text-blue-500" />
              <span>Routing intent & searching vector index...</span>
            </div>
          </div>
        )}

        {error && (
          <div className="p-3 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900/50 rounded-xl text-red-600 dark:text-red-400 text-xs font-medium flex items-center justify-between">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-4 h-4" />
              <span>{error}</span>
            </div>
            <button
              onClick={handleSend}
              className="flex items-center gap-1 text-xs font-bold underline hover:opacity-80"
            >
              <RotateCcw className="w-3 h-3" /> Retry
            </button>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input Bar */}
      <div className="p-4 border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSend();
          }}
          className="flex items-center gap-2"
        >
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={
              datasetId
                ? 'Ask about total sales, top customers, or find orders...'
                : 'Please upload a dataset first to enable AI chat...'
            }
            disabled={!datasetId || loading}
            className="flex-1 px-4 py-3 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
          />
          <button
            type="submit"
            disabled={!input.trim() || !datasetId || loading}
            className="px-5 py-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-sm shadow-md shadow-blue-500/20 disabled:opacity-50 transition-all flex items-center gap-2"
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
          </button>
        </form>
      </div>
    </div>
  );
};
