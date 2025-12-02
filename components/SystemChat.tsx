import React, { useState, useRef, useEffect } from 'react';
import { SystemWindow, Button } from './SystemComponents';
import { generateSystemMessage } from '../services/geminiService';
import { User } from '../types';
import { saveChatHistory, loadChatHistory, ChatMessage } from '../services/storage';

export const SystemChat: React.FC<{ user: User }> = ({ user }) => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const history = loadChatHistory(user.email);
    if (history.length > 0) {
      setMessages(history);
    } else {
      setMessages([
        {
          sender: 'SYSTEM',
          text: `Welcome, ${user.username}. You may now request system guidance.`,
        },
      ]);
    }
  }, [user.email]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim()) return;

    const userMsg = input;
    setInput('');

    const updatedPlayer: ChatMessage[] = [
      ...messages,
      { sender: 'PLAYER', text: userMsg },
    ];
    setMessages(updatedPlayer);
    saveChatHistory(user.email, updatedPlayer);

    setLoading(true);
    const resp = await generateSystemMessage('ADVICE', user, userMsg);

    const updatedSystem: ChatMessage[] = [
      ...updatedPlayer,
      { sender: 'SYSTEM', text: resp },
    ];
    setMessages(updatedSystem);
    saveChatHistory(user.email, updatedSystem);

    setLoading(false);
  };

  const handleClearChat = () => {
    const resetMsg: ChatMessage[] = [
      {
        sender: 'SYSTEM',
        text: `Chat cleared. How may I assist you, ${user.username}?`,
      },
    ];

    setMessages(resetMsg);
    saveChatHistory(user.email, resetMsg);
  };

  return (
    <SystemWindow title="SYSTEM CONSULTANT" className="flex flex-col h-[450px]">

      {/* CHAT BOX */}
      <div
        ref={scrollRef}
        className="
          overflow-y-auto
          p-3
          space-y-4
          bg-slate-950/40 
          border border-slate-800 
          rounded
        "
        style={{ height: "300px" }}
      >
        {messages.map((m, i) => (
          <div
            key={i}
            className={`flex ${m.sender === 'PLAYER' ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`
                max-w-[80%] p-3 rounded-xl shadow-md whitespace-pre-wrap leading-relaxed
                ${
                  m.sender === 'SYSTEM'
                    ? 'bg-slate-800 text-cyan-300 border border-cyan-600/40'
                    : 'bg-slate-700 text-white border border-slate-500'
                }
              `}
            >
              <div className="text-[10px] uppercase tracking-wider opacity-60 mb-1">
                {m.sender}
              </div>
              <div className="text-sm">{m.text}</div>
            </div>
          </div>
        ))}

        {loading && (
          <div className="flex justify-start">
            <div className="bg-slate-800 text-cyan-400 border border-cyan-600/30 px-3 py-2 text-xs rounded animate-pulse">
              SYSTEM PROCESSING...
            </div>
          </div>
        )}
      </div>

      {/* FIXED — INPUT + CLEAR BUTTON */}
      <div className="mt-3 flex flex-col">

        <div className="flex gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSend()}
            placeholder="Query the system..."
            className="
              flex-grow
              bg-slate-800
              border border-slate-600
              p-2
              text-white
              rounded
              focus:border-cyan-500
              outline-none
            "
          />

          <Button
            onClick={handleSend}
            disabled={loading}
            className="px-4"
          >
            SEND
          </Button>
        </div>

        {/* FIXED CLEAR BUTTON BELOW, INSIDE MARGIN */}
        <div className="flex justify-end mt-2">
          <Button
            onClick={handleClearChat}
            className="px-4 bg-red-600 hover:bg-red-500 text-white text-xs"
          >
            CLEAR
          </Button>
        </div>

      </div>

    </SystemWindow>
  );
};
