import React, { useState, useRef, useEffect, useCallback } from 'react';
import { sendChatMessage } from '../../services/api';
import { useCarbonContext } from '../../context/CarbonContext';

export interface ChatMessage {
  role: 'user' | 'model';
  content: string;
}

export const EcoChatbot = React.memo(function EcoChatbot() {
  const { state } = useCarbonContext();
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([
    { role: 'model', content: "Hi! I'm your EcoTrace AI assistant. Ask me how to reduce your carbon footprint or understand your dashboard!" }
  ]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, isTyping, scrollToBottom]);

  const handleSend = useCallback(async () => {
    if (!input.trim()) return;
    
    const userMsg: ChatMessage = { role: 'user', content: input.trim() };
    const newMessages = [...messages, userMsg];
    setMessages(newMessages);
    setInput('');
    setIsTyping(true);

    try {
      // Context: give the bot basic awareness of the user's footprint
      const contextData = state.entries.length > 0 ? {
        totalEmissionsKg: state.entries[0].totalKgCO2,
        breakdown: state.entries[0].breakdown,
      } : { info: 'No entries logged yet.' };

      const result = await sendChatMessage(newMessages, contextData);
      setMessages([...newMessages, { role: 'model', content: result.response }]);
    } catch {
      setMessages([...newMessages, { role: 'model', content: "I'm having trouble connecting to my brain right now. Please try again later!" }]);
    } finally {
      setIsTyping(false);
    }
  }, [input, messages, state.entries]);

  return (
    <>
      {/* Floating Action Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="fixed bottom-6 right-6 w-14 h-14 rounded-full bg-emerald-500 hover:bg-emerald-400 flex items-center justify-center text-2xl shadow-lg shadow-emerald-500/20 transition-transform hover:scale-105 z-50"
        aria-label="Toggle AI Chat"
      >
        {isOpen ? '✕' : '✨'}
      </button>

      {/* Chat Window */}
      {isOpen && (
        <div className="fixed bottom-24 right-6 w-80 sm:w-96 max-w-[calc(100vw-3rem)] h-[500px] max-h-[calc(100vh-8rem)] glass-card flex flex-col z-50 overflow-hidden animate-fade-in shadow-2xl border border-white/10 rounded-2xl">
          {/* Header */}
          <div className="p-4 border-b border-white/10 bg-white/5 flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-emerald-500/20 flex items-center justify-center text-emerald-400 text-sm">
              AI
            </div>
            <div>
              <h3 className="text-sm font-semibold text-white">EcoTrace Assistant</h3>
              <p className="text-[10px] text-emerald-400">Powered by Gemini / Smart Rules</p>
            </div>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {messages.map((msg, i) => (
              <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div 
                  className={`max-w-[85%] rounded-2xl px-4 py-2 text-sm ${
                    msg.role === 'user' 
                      ? 'bg-emerald-500/20 text-white border border-emerald-500/30 rounded-br-sm' 
                      : 'bg-white/5 text-slate-200 border border-white/10 rounded-bl-sm'
                  }`}
                >
                  {msg.content}
                </div>
              </div>
            ))}
            {isTyping && (
              <div className="flex justify-start">
                <div className="bg-white/5 border border-white/10 rounded-2xl rounded-bl-sm px-4 py-3 flex gap-1 items-center">
                  <div className="w-1.5 h-1.5 rounded-full bg-slate-400 animate-bounce" style={{ animationDelay: '0ms' }} />
                  <div className="w-1.5 h-1.5 rounded-full bg-slate-400 animate-bounce" style={{ animationDelay: '150ms' }} />
                  <div className="w-1.5 h-1.5 rounded-full bg-slate-400 animate-bounce" style={{ animationDelay: '300ms' }} />
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input Area */}
          <div className="p-3 border-t border-white/10 bg-white/5">
            <form 
              onSubmit={(e) => { e.preventDefault(); handleSend(); }}
              className="flex gap-2"
            >
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Ask about your footprint..."
                className="flex-1 bg-black/20 border border-white/10 rounded-xl px-3 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500/50"
              />
              <button 
                type="submit"
                disabled={!input.trim() || isTyping}
                className="bg-emerald-500 hover:bg-emerald-400 disabled:opacity-50 disabled:hover:bg-emerald-500 text-white rounded-xl px-4 py-2 text-sm transition-colors"
              >
                Send
              </button>
            </form>
          </div>
        </div>
      )}
    </>
  );
});
