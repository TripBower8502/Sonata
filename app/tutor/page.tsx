'use client';

import { useState, useRef, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

const QUICK_PROMPTS = [
  'Explain diastolic dysfunction grades',
  'How do I calculate RVSP?',
  'What is the PISA method?',
  'Explain E/A ratio',
  'How is AVA calculated?',
  'What is McConnell\'s sign?',
  'Explain AS severity grading',
  'How to grade MR severity?',
];

const WELCOME_MESSAGE: Message = {
  role: 'assistant',
  content: `Hello! I'm your **AI Echo Tutor**, an expert echocardiographer and cardiac sonographer educator here to help you master echocardiography.

I can help you with:
- **Normal values** and measurements
- **View identification** and acquisition
- **Pathology** recognition (AS, AR, MR, MS, HCM, tamponade, PE, and more)
- **Doppler interpretation** and techniques
- **Formulas** — RVSP, AVA, EF, EROA, and others
- **Diastolic dysfunction** grading
- **Clinical pearls** and exam tips

What would you like to learn today? Feel free to use the quick prompts below or ask anything!`,
};

export default function TutorPage() {
  const [messages, setMessages] = useState<Message[]>([WELCOME_MESSAGE]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading]);

  const sendMessage = async (content: string) => {
    if (!content.trim() || isLoading) return;

    const userMessage: Message = { role: 'user', content: content.trim() };
    const newMessages = [...messages, userMessage];
    setMessages(newMessages);
    setInput('');
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: newMessages.map(m => ({ role: m.role, content: m.content })),
        }),
      });

      if (!response.ok) {
        const err = await response.json().catch(() => ({ error: 'Unknown error' }));
        throw new Error(err.error || `Server error: ${response.status}`);
      }

      const reader = response.body?.getReader();
      if (!reader) throw new Error('No response stream');

      let assistantContent = '';
      const assistantMessage: Message = { role: 'assistant', content: '' };
      setMessages(prev => [...prev, assistantMessage]);

      const decoder = new TextDecoder();
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        const chunk = decoder.decode(value, { stream: true });
        const lines = chunk.split('\n');
        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = line.slice(6).trim();
            if (data === '[DONE]') continue;
            try {
              const parsed = JSON.parse(data);
              const delta = parsed.choices?.[0]?.delta?.content;
              if (delta) {
                assistantContent += delta;
                setMessages(prev => {
                  const updated = [...prev];
                  updated[updated.length - 1] = { role: 'assistant', content: assistantContent };
                  return updated;
                });
              }
            } catch { /* ignore parse errors */ }
          }
        }
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to connect to AI tutor';
      setError(msg);
      setMessages(prev => prev.filter(m => m.content !== ''));
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    sendMessage(input);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage(input);
    }
  };

  const clearChat = () => {
    setMessages([WELCOME_MESSAGE]);
    setError(null);
  };

  return (
    <div className="page-enter flex flex-col bg-navy-900" style={{ height: '100dvh' }}>
      {/* Header */}
      <div
        className="flex-shrink-0 px-5 pt-4 pb-3 border-b border-pink-100 bg-white"
        style={{ paddingTop: 'max(1rem, env(safe-area-inset-top))' }}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-pink-50 border border-pink-200 flex items-center justify-center">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#ec4899" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
              </svg>
            </div>
            <div>
              <h1 className="text-base font-bold text-gray-900 leading-none">AI Echo Tutor</h1>
              <div className="flex items-center gap-1.5 mt-0.5">
                <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                <span className="text-[11px] text-gray-400">Powered by Grok</span>
              </div>
            </div>
          </div>
          <button
            onClick={clearChat}
            className="p-2 rounded-xl bg-pink-50 border border-pink-200 text-gray-400 active:text-pink-500 transition-colors"
            title="Clear chat"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="1 4 1 10 7 10" />
              <path d="M3.51 15a9 9 0 1 0 .49-3.5" />
            </svg>
          </button>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
        {messages.map((msg, i) => (
          <div
            key={i}
            className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            {msg.role === 'assistant' && (
              <div className="w-7 h-7 rounded-full bg-pink-100 border border-pink-200 flex items-center justify-center flex-shrink-0 mr-2 mt-1">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="#ec4899">
                  <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 14.5v-9l6 4.5-6 4.5z"/>
                </svg>
              </div>
            )}
            <div
              className={`max-w-[85%] rounded-2xl px-4 py-3 ${
                msg.role === 'user'
                  ? 'bg-pink-500 text-white rounded-tr-sm shadow-sm'
                  : 'bg-white border border-pink-100 rounded-tl-sm shadow-sm'
              }`}
            >
              {msg.role === 'user' ? (
                <p className="text-sm font-medium leading-relaxed">{msg.content}</p>
              ) : (
                <div className="prose-echo">
                  {msg.content ? (
                    <ReactMarkdown>{msg.content}</ReactMarkdown>
                  ) : (
                    <div className="flex items-center gap-2 py-1">
                      <div className="w-2 h-2 rounded-full bg-pink-400 animate-bounce" style={{ animationDelay: '0ms' }} />
                      <div className="w-2 h-2 rounded-full bg-pink-400 animate-bounce" style={{ animationDelay: '150ms' }} />
                      <div className="w-2 h-2 rounded-full bg-pink-400 animate-bounce" style={{ animationDelay: '300ms' }} />
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        ))}

        {isLoading && messages[messages.length - 1]?.role === 'user' && (
          <div className="flex justify-start">
            <div className="w-7 h-7 rounded-full bg-pink-100 border border-pink-200 flex items-center justify-center flex-shrink-0 mr-2 mt-1">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="#ec4899">
                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 14.5v-9l6 4.5-6 4.5z"/>
              </svg>
            </div>
            <div className="bg-white border border-pink-100 rounded-2xl rounded-tl-sm px-4 py-3.5 shadow-sm">
              <div className="flex items-center gap-2">
                <div className="skeleton h-2 w-2 rounded-full" />
                <div className="skeleton h-2 w-2 rounded-full" style={{ animationDelay: '0.15s' }} />
                <div className="skeleton h-2 w-2 rounded-full" style={{ animationDelay: '0.3s' }} />
              </div>
            </div>
          </div>
        )}

        {error && (
          <div className="mx-2 p-3 bg-red-50 border border-red-200 rounded-xl">
            <p className="text-xs text-red-500">{error}</p>
            <p className="text-xs text-gray-400 mt-1">Make sure XAI_API_KEY is configured in your environment.</p>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Quick prompts */}
      <div className="flex-shrink-0 px-4 py-2 border-t border-pink-100 bg-white">
        <div className="flex gap-2 overflow-x-auto pb-1" style={{ scrollbarWidth: 'none' }}>
          {QUICK_PROMPTS.map((prompt) => (
            <button
              key={prompt}
              onClick={() => sendMessage(prompt)}
              disabled={isLoading}
              className="flex-shrink-0 px-3 py-1.5 bg-pink-50 border border-pink-200 rounded-xl text-xs text-pink-600 font-medium hover:border-pink-300 transition-all active:scale-95 disabled:opacity-50"
            >
              {prompt}
            </button>
          ))}
        </div>
      </div>

      {/* Input */}
      <div
        className="flex-shrink-0 px-4 pt-2 pb-3 bg-white border-t border-pink-100"
        style={{ paddingBottom: 'max(0.75rem, env(safe-area-inset-bottom))' }}
      >
        <form onSubmit={handleSubmit} className="flex items-end gap-2">
          <div className="flex-1 bg-pink-50 border border-pink-200 rounded-2xl overflow-hidden focus-within:border-pink-400 transition-colors">
            <textarea
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Ask about echo techniques, values, pathology..."
              rows={1}
              className="w-full bg-transparent px-4 py-3 text-sm text-gray-900 placeholder-gray-400 resize-none outline-none max-h-28"
              style={{ lineHeight: '1.5' }}
              disabled={isLoading}
            />
          </div>
          <button
            type="submit"
            disabled={!input.trim() || isLoading}
            className="w-11 h-11 rounded-2xl bg-pink-500 flex items-center justify-center flex-shrink-0 disabled:opacity-40 disabled:cursor-not-allowed active:scale-95 transition-all shadow-sm"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <line x1="22" y1="2" x2="11" y2="13" />
              <polygon points="22 2 15 22 11 13 2 9 22 2" />
            </svg>
          </button>
        </form>
        <p className="text-[10px] text-gray-400 text-center mt-2">AI responses are for educational purposes only</p>
      </div>
    </div>
  );
}
