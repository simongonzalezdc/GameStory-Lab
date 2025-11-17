import { useState } from 'react';
import { useUIStore } from '@/stores/ui-store';
import { useAIStore } from '@/stores/ai-store';
import { Button } from '../ui/Button';

export default function AIChat() {
  const { isAIChatOpen, toggleAIChat } = useUIStore();
  const { messages, isLoading } = useAIStore();
  const [input, setInput] = useState('');

  const handleSend = () => {
    if (!input.trim() || isLoading) return;

    // TODO: Implement AI message sending
    console.log('Send message:', input);
    setInput('');
  };

  if (!isAIChatOpen) {
    return (
      <button
        onClick={toggleAIChat}
        className="fixed bottom-4 right-4 w-14 h-14 bg-forest-600 text-white rounded-full shadow-lg hover:bg-forest-700 transition flex items-center justify-center text-2xl"
        aria-label="Open AI Chat"
      >
        🤖
      </button>
    );
  }

  return (
    <aside className="w-96 bg-white border-l border-gray-200 flex flex-col">
      <div className="px-4 py-3 border-b border-gray-200 flex items-center justify-between">
        <h2 className="font-semibold text-gray-900">AI Assistant</h2>
        <button
          onClick={toggleAIChat}
          className="text-gray-500 hover:text-gray-700"
          aria-label="Close AI Chat"
        >
          ✕
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 ? (
          <div className="text-center text-gray-500 mt-8">
            <p className="mb-2">👋 Hi! I'm your music composition assistant.</p>
            <p className="text-sm">Ask me to help create, modify, or improve your music!</p>
          </div>
        ) : (
          messages.map((msg, idx) => (
            <div
              key={idx}
              className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-[80%] rounded-lg px-4 py-2 ${
                  msg.role === 'user'
                    ? 'bg-forest-600 text-white'
                    : 'bg-gray-100 text-gray-900'
                }`}
              >
                {msg.content}
              </div>
            </div>
          ))
        )}
        {isLoading && (
          <div className="flex justify-start">
            <div className="bg-gray-100 rounded-lg px-4 py-2">
              <span className="animate-pulse">Thinking...</span>
            </div>
          </div>
        )}
      </div>

      <div className="p-4 border-t border-gray-200">
        <div className="flex gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSend()}
            placeholder="Ask me anything..."
            className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-forest-500"
            disabled={isLoading}
          />
          <Button onClick={handleSend} disabled={isLoading || !input.trim()}>
            Send
          </Button>
        </div>
      </div>
    </aside>
  );
}
