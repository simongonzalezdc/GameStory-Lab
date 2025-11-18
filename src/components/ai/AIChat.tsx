import { useState, useRef, useEffect, useCallback } from 'react';
import { useUIStore } from '@/stores/ui-store';
import { useAIStore } from '@/stores/ai-store';
import { useProjectStore } from '@/stores/project-store';
import { Button } from '../ui/Button';
import { sendAIMessage, applyMusicActions } from '@/lib/ai/ai-service';
import AISetupWizard from './AISetupWizard';
import { AlertDialog } from '../ui/AlertDialog';
import { errorHandler, ErrorSeverity } from '@/lib/errors/error-handler';
import type { MusicAction } from '@/types/ai';

export default function AIChat() {
  const { isAIChatOpen, toggleAIChat } = useUIStore();
  const { messages, isLoading, config, addMessage, setLoading, setAbortController, cancelRequest } = useAIStore();
  const projectStore = useProjectStore();
  const [input, setInput] = useState('');
  const [showSetup, setShowSetup] = useState(false);
  const [showConfigError, setShowConfigError] = useState(false);
  const [recentActions, setRecentActions] = useState<Array<{
    action: MusicAction;
    success: boolean;
    error?: string;
  }>>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = useCallback(async () => {
    if (!input.trim() || isLoading) return;

    // Check if AI is configured
    if (!config) {
      setShowConfigError(true);
      return;
    }

    const userMessage = input.trim();
    setInput('');

    // Add user message
    addMessage({ role: 'user', content: userMessage });
    setLoading(true);

    // Create abort controller for cancellation
    const controller = new AbortController();
    setAbortController(controller);

    try {
      // Get project context
      const currentScene = projectStore.project?.scenes.find(
        s => s.id === projectStore.currentSceneId
      );

      // Build context with recent actions - PASSING FULL PROJECT FOR PROJECT-WIDE CONTEXT
      const contextWithHistory = {
        currentScene,
        projectSnapshot: projectStore.project ? {
          // Include all project data including scenes array for project-wide context
          ...projectStore.project,
          scenes: projectStore.project.scenes // Ensure scenes are included
        } : undefined,
        recentActions: recentActions.slice(-3) // Last 3 actions
      };

      // Send message to AI
      const response = await sendAIMessage(
        config,
        [...messages, { role: 'user', content: userMessage }],
        contextWithHistory,
        controller.signal
      );

      // Add assistant message (if not cancelled)
      if (response.message || !response.error || response.error !== 'Request cancelled') {
        addMessage({ role: 'assistant', content: response.message });
      }

      // Apply actions if any
      if (response.actions && response.actions.length > 0) {
        // Log actions in development for debugging
        if (import.meta.env.MODE === 'development') {
          console.info('[AI Actions]', response.actions);
        }

        const result = applyMusicActions(response.actions, {
          ...projectStore,
          currentSceneId: projectStore.currentSceneId,
        } as Parameters<typeof applyMusicActions>[1]);

        // Track action results for feedback loop
        const actionResults = response.actions.map(action => ({
          action,
          success: result.success > 0 && !result.errors.find(e => e.includes(action.type)),
          error: result.errors.find(e => e.includes(action.type))
        }));

        // Update recent actions (keep last 5)
        setRecentActions(prev => [
          ...prev.slice(-4),
          ...actionResults
        ]);

        if (result.failed > 0) {
          const errorDetails = result.errors.join('; ');
          errorHandler.handle(
            new Error(`${result.failed} AI actions failed: ${errorDetails}`),
            'AI Actions',
            ErrorSeverity.WARNING
          );
          
          // Show detailed error message to user
          addMessage({
            role: 'assistant',
            content: `⚠️ ${result.failed} action(s) could not be applied: ${errorDetails}. ${result.success} action(s) succeeded.`,
          });
        } else if (result.success > 0) {
          // Confirm successful actions
          if (import.meta.env.MODE === 'development') {
            console.info(`[AI Actions] Successfully applied ${result.success} action(s)`);
          }
        }
      }
    } catch (error) {
      errorHandler.handle(error, 'AI Chat', ErrorSeverity.ERROR);
      addMessage({
        role: 'assistant',
        content: 'Sorry, I encountered an error. Please try again.',
      });
    } finally {
      setLoading(false);
      setAbortController(null);
    }
  }, [input, isLoading, config, addMessage, setLoading, setAbortController, messages, projectStore, recentActions]);

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
    <>
      <AISetupWizard open={showSetup} onClose={() => setShowSetup(false)} />
      <AlertDialog
        open={showConfigError}
        onOpenChange={setShowConfigError}
        title="AI Not Configured"
        description="Please configure your AI assistant first. Click the settings icon (⚙️) to get started."
        variant="warning"
      />
      <aside className="w-96 bg-white border-l border-gray-200 flex flex-col" data-tutorial="ai-chat">
        <div className="px-4 py-3 border-b border-gray-200 flex items-center justify-between">
          <h2 className="font-semibold text-gray-900">AI Assistant</h2>
          <div className="flex gap-2">
            <button
              onClick={() => setShowSetup(true)}
              className="text-gray-500 hover:text-gray-700"
              aria-label="AI Settings"
              title="Configure AI"
            >
              ⚙️
            </button>
            <button
              onClick={toggleAIChat}
              className="text-gray-500 hover:text-gray-700"
              aria-label="Close AI Chat"
            >
              ✕
            </button>
          </div>
        </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 ? (
          <div className="text-center text-gray-500 mt-8">
            <p className="mb-2">👋 Hi! I'm your music composition assistant.</p>
            <p className="text-sm">Ask me to help create, modify, or improve your music!</p>
            {!config && (
              <p className="text-sm text-red-600 mt-4">
                ⚠️ Please configure your AI assistant first
              </p>
            )}
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
        <div ref={messagesEndRef} />
      </div>

      <div className="p-4 border-t border-gray-200">
        <div className="flex gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && !isLoading && handleSend()}
            placeholder="Ask me anything..."
            className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-forest-500"
            disabled={isLoading}
          />
          {isLoading ? (
            <Button onClick={cancelRequest} variant="secondary">
              Cancel
            </Button>
          ) : (
            <Button onClick={handleSend} disabled={!input.trim()}>
              Send
            </Button>
          )}
        </div>
      </div>
      </aside>
    </>
  );
}
