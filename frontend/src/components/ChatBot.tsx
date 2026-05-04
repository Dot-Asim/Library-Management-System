'use client';

import { useState, useRef, useEffect } from 'react';
import { MessageSquare, X, Send, Bot, User, Loader2, Sparkles, MinusCircle } from 'lucide-react';

interface Message {
  role: 'user' | 'bot';
  content: string;
}

export default function ChatBot({ autoOpen = false }: { autoOpen?: boolean }) {
  const [isOpen, setIsOpen] = useState(autoOpen);
  const [messages, setMessages] = useState<Message[]>([
    { role: 'bot', content: 'Hello! I am Libra, your AI library assistant. How can I help you find your next great read?' }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || loading) return;

    const userMessage = input.trim();
    setInput('');
    setMessages(prev => [...prev, { role: 'user', content: userMessage }]);
    setLoading(true);

    try {
      // Get Gemini API Key from environment or window (placeholder for now)
      const apiKey = process.env.NEXT_PUBLIC_GEMINI_API_KEY || '';
      
      if (!apiKey) {
        setMessages(prev => [...prev, { role: 'bot', content: "I'm sorry, I'm currently in 'offline mode' (API Key missing). Please provide a Gemini API key to enable my full AI powers!" }]);
        setLoading(false);
        return;
      }

      const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-flash-latest:generateContent?key=${apiKey}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{
            parts: [{ text: `You are Libra, a helpful and concise library assistant. 
            RULES:
            1. Keep responses brief (max 2-3 short paragraphs).
            2. Use clear bullet points for lists.
            3. Do not be overly wordy.
            4. Focus on being helpful and direct.
            User asks: ${userMessage}` }]
          }]
        })
      });

      const data = await response.json();
      
      if (data.error) {
        console.error("Gemini API Error:", data.error);
        throw new Error(data.error.message);
      }

      const botResponse = data.candidates?.[0]?.content?.parts?.[0]?.text || "I'm having trouble thinking right now. Please try again later!";
      
      setMessages(prev => [...prev, { role: 'bot', content: botResponse }]);
    } catch (error) {
      console.error("ChatBot Error:", error);
      setMessages(prev => [...prev, { role: 'bot', content: "Error connecting to the AI brain. Please check your connection or API key." }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed bottom-6 right-6 z-[100] flex flex-col items-end">
      {/* Chat Window */}
      {isOpen && (
        <div className="mb-4 w-[350px] sm:w-[450px] h-[600px] bg-zinc-900/95 backdrop-blur-xl rounded-3xl border border-white/10 shadow-[0_20px_50px_rgba(0,0,0,0.5)] flex flex-col overflow-hidden animate-in slide-in-from-bottom-6 duration-300">
          {/* Header */}
          <div className="p-4 bg-indigo-600/20 border-b border-white/[0.06] flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-indigo-500/20 flex items-center justify-center border border-indigo-500/30">
                <Bot className="w-4 h-4 text-indigo-400" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-white">AI Libra</h3>
                <div className="flex items-center gap-1.5">
                  <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  <span className="text-[10px] text-zinc-400 font-medium uppercase tracking-wider">Online</span>
                </div>
              </div>
            </div>
            <button 
              onClick={() => setIsOpen(false)}
              className="p-2 rounded-xl hover:bg-white/10 text-zinc-400 hover:text-white transition-colors"
            >
              <MinusCircle className="w-4 h-4" />
            </button>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4 no-scrollbar">
            {messages.map((msg, idx) => (
              <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[80%] flex gap-2.5 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
                  <div className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 border ${
                    msg.role === 'user' ? 'bg-zinc-800 border-white/10' : 'bg-indigo-500/10 border-indigo-500/20'
                  }`}>
                    {msg.role === 'user' ? <User className="w-3.5 h-3.5 text-zinc-400" /> : <Sparkles className="w-3.5 h-3.5 text-indigo-400" />}
                  </div>
                  <div className={`p-4 rounded-2xl text-[14px] leading-[1.6] ${
                    msg.role === 'user' 
                      ? 'bg-indigo-600 text-white rounded-tr-none shadow-lg' 
                      : 'bg-zinc-800/80 text-zinc-100 border border-white/10 rounded-tl-none shadow-md'
                  }`}>
                    {msg.content}
                  </div>
                </div>
              </div>
            ))}
            {loading && (
              <div className="flex justify-start">
                <div className="flex gap-2.5">
                  <div className="w-7 h-7 rounded-full bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center shrink-0">
                    <Loader2 className="w-3.5 h-3.5 text-indigo-400 animate-spin" />
                  </div>
                  <div className="p-3.5 rounded-2xl bg-white/5 border border-white/[0.06] rounded-tl-none flex gap-1">
                    <div className="w-1 h-1 rounded-full bg-indigo-400 animate-bounce" />
                    <div className="w-1 h-1 rounded-full bg-indigo-400 animate-bounce [animation-delay:0.2s]" />
                    <div className="w-1 h-1 rounded-full bg-indigo-400 animate-bounce [animation-delay:0.4s]" />
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <form onSubmit={handleSend} className="p-4 bg-zinc-900/50 border-t border-white/[0.06]">
            <div className="relative">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Ask about any book..."
                className="w-full bg-white/5 border border-white/10 rounded-2xl py-3 pl-4 pr-12 text-[13px] text-white focus:outline-none focus:border-indigo-500/50 transition-all"
              />
              <button
                type="submit"
                disabled={!input.trim() || loading}
                className="absolute right-2 top-1/2 -translate-y-1/2 p-2 bg-indigo-600 text-white rounded-xl hover:bg-indigo-500 transition-all disabled:opacity-50 disabled:bg-zinc-800"
              >
                <Send className="w-4 h-4" />
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Toggle Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`w-14 h-14 rounded-full flex items-center justify-center shadow-2xl transition-all duration-300 ${
          isOpen ? 'bg-zinc-800 rotate-90 scale-90' : 'bg-indigo-600 hover:bg-indigo-500 hover:scale-110 active:scale-95'
        }`}
      >
        {isOpen ? <X className="w-6 h-6 text-white" /> : <MessageSquare className="w-6 h-6 text-white" />}
      </button>
    </div>
  );
}
