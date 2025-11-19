import { useEffect, useMemo, useRef, useState } from 'react';
import { assistantAPI } from '../services/api';

interface ProjectAssistantPanelProps {
  projectId: string;
  type?: 'concept' | 'architect';
  onProposalAccepted?: () => void;
}

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  createdAt?: string;
}

interface AssistantProposal {
  id: string;
  proposalType: string;
  changeLog: Array<{
    field: string;
    changeType: string;
    before?: any;
    after?: any;
  }>;
  payload: {
    explanation?: string;
    mechanics?: any;
    lore?: any;
    architectDocuments?: Array<{ name: string; content: string }>;
  };
  createdAt: string;
}

export function ProjectAssistantPanel({
  projectId,
  type = 'concept',
  onProposalAccepted,
}: ProjectAssistantPanelProps) {
  const [session, setSession] = useState<any | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [proposals, setProposals] = useState<AssistantProposal[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showProposals, setShowProposals] = useState(false);
  const [quickMode, setQuickMode] = useState<'standard' | 'concise' | 'detailed'>('standard');
  const listRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);

  useEffect(() => {
    if (!projectId) return;
    setError(null);
    assistantAPI
      .startSession({ projectId, type })
      .then((data) => {
        setSession(data.session);
        setMessages(
          (data.messages as ChatMessage[]).map((msg) => ({
            ...msg,
            role: msg.role === 'assistant' ? 'assistant' : 'user',
            createdAt: msg.createdAt || new Date().toISOString(),
          }))
        );
        setProposals(data.proposals as AssistantProposal[]);
        if (data.proposals && data.proposals.length > 0) {
          setShowProposals(true);
        }
      })
      .catch((err) => {
        setError(err instanceof Error ? err.message : 'Failed to start assistant');
      });
  }, [projectId, type]);

  useEffect(() => {
    if (!listRef.current) return;
    listRef.current.scrollTop = listRef.current.scrollHeight;
  }, [messages]);

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 120)}px`;
    }
  }, [input]);

  const handleSend = async () => {
    if (!session?.id || !input.trim()) return;
    const userMessage = input.trim();
    setLoading(true);
    setError(null);
    setInput('');
    try {
      const response = await assistantAPI.sendMessage(session.id, userMessage);
      setMessages((prev) => [
        ...prev,
        { 
          id: crypto.randomUUID(), 
          role: 'user', 
          content: userMessage,
          createdAt: new Date().toISOString(),
        },
        {
          ...response.message,
          createdAt: response.message.createdAt || new Date().toISOString(),
        }
      ]);
      if (response.proposal) {
        setProposals((prev) => [response.proposal as AssistantProposal, ...prev]);
        setShowProposals(true);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Assistant failed to respond');
    } finally {
      setLoading(false);
    }
  };

  const handleQuickAction = (action: string) => {
    const prompts: Record<string, string> = {
      'summarize': 'Can you summarize the current version?',
      'suggest-tweaks': 'What improvements would you suggest for this version?',
      'check-consistency': 'Check the consistency between mechanics and lore.',
      'expand-lore': 'Can you expand on the lore and world-building?',
    };
    if (prompts[action]) {
      setInput(prompts[action]);
      textareaRef.current?.focus();
    }
  };

  const formatTime = (timestamp?: string) => {
    if (!timestamp) return '';
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    
    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffMins < 1440) return `${Math.floor(diffMins / 60)}h ago`;
    return date.toLocaleDateString();
  };

  const getInitials = (role: 'user' | 'assistant') => {
    return role === 'user' ? 'U' : 'AI';
  };

  const handleAccept = async (proposalId: string) => {
    try {
      await assistantAPI.acceptProposal(proposalId);
      setProposals((prev) => prev.filter((p) => p.id !== proposalId));
      // Notify parent component to refresh data
      onProposalAccepted?.();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to apply proposal');
    }
  };

  const handleReject = async (proposalId: string) => {
    try {
      await assistantAPI.rejectProposal(proposalId);
      setProposals((prev) => prev.filter((p) => p.id !== proposalId));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to reject proposal');
    }
  };

  const headerLabel = useMemo(() => {
    if (type === 'architect') return 'Architect Assistant';
    return 'Project Assistant';
  }, [type]);

  return (
    <div className="flex flex-col h-full min-h-0 overflow-hidden relative">
      {/* Full-height Assistant Card */}
      <div className="flex-1 flex flex-col min-h-0 overflow-hidden bg-gradient-to-br from-slate-50 via-white to-blue-50/30 dark:from-slate-900 dark:via-slate-800 dark:to-blue-900/20 rounded-2xl border border-slate-200 dark:border-slate-700 assistant-card-glow assistant-transition">
        {/* Rich Header */}
        <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-700 divider-glow bg-white/50 dark:bg-slate-800/50 backdrop-blur-sm flex-shrink-0">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-bold text-lg shadow-lg">
                AI
              </div>
              <div>
                <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100">{headerLabel}</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  {session ? `Session ${session.id.slice(0, 8)}` : 'Connecting...'}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <select
                value={quickMode}
                onChange={(e) => setQuickMode(e.target.value as 'standard' | 'concise' | 'detailed')}
                className="text-xs px-2 py-1 bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-lg text-slate-700 dark:text-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="standard">Standard</option>
                <option value="concise">Concise</option>
                <option value="detailed">Detailed</option>
              </select>
              {proposals.length > 0 && (
                <button
                  onClick={() => setShowProposals(!showProposals)}
                  className="relative px-3 py-1.5 bg-blue-600 dark:bg-blue-500 text-white rounded-lg hover:bg-blue-700 dark:hover:bg-blue-600 transition text-xs font-medium flex items-center gap-1.5"
                >
                  <span>💡</span>
                  <span>Proposals</span>
                  {proposals.length > 0 && (
                    <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 rounded-full flex items-center justify-center text-xs font-bold">
                      {proposals.length}
                    </span>
                  )}
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Main Content Area */}
        <div className="flex-1 flex min-h-0 overflow-hidden">
          {/* Chat Area */}
          <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
            {/* Messages */}
            <div ref={listRef} className="flex-1 overflow-y-auto px-6 py-4 space-y-4 min-h-0">
              {messages.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-center px-4">
                  <div className="w-16 h-16 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white text-2xl mb-4 shadow-lg">
                    AI
                  </div>
                  <h4 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-2">
                    Start a conversation
                  </h4>
                  <p className="text-sm text-slate-600 dark:text-slate-400 max-w-md">
                    Ask me anything about your project. I can help refine mechanics, expand lore, check consistency, and more.
                  </p>
                </div>
              ) : (
                messages.map((msg) => (
                  <div
                    key={msg.id}
                    className={`flex gap-3 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}
                  >
                    {/* Avatar */}
                    <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ${
                      msg.role === 'assistant'
                        ? 'bg-gradient-to-br from-blue-500 to-purple-600 text-white'
                        : 'bg-gradient-to-br from-slate-400 to-slate-600 text-white'
                    }`}>
                      {getInitials(msg.role)}
                    </div>
                    {/* Message Bubble */}
                    <div className={`flex-1 max-w-[75%] ${msg.role === 'user' ? 'flex flex-col items-end' : ''}`}>
                      <div
                        className={`rounded-2xl px-4 py-3 text-sm shadow-sm ${
                          msg.role === 'assistant'
                            ? 'bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100'
                            : 'bg-blue-600 dark:bg-blue-500 text-white'
                        }`}
                      >
                        <div className="whitespace-pre-wrap break-words">{msg.content}</div>
                      </div>
                      {msg.createdAt && (
                        <div className={`text-xs text-slate-500 dark:text-slate-400 mt-1 px-1 ${
                          msg.role === 'user' ? 'text-right' : ''
                        }`}>
                          {formatTime(msg.createdAt)}
                        </div>
                      )}
                    </div>
                  </div>
                ))
              )}
              {loading && (
                <div className="flex gap-3">
                  <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-xs font-bold text-white">
                    AI
                  </div>
                  <div className="flex items-center gap-1 px-4 py-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl">
                    <div className="w-2 h-2 bg-blue-500 rounded-full typing-dot" />
                    <div className="w-2 h-2 bg-blue-500 rounded-full typing-dot" />
                    <div className="w-2 h-2 bg-blue-500 rounded-full typing-dot" />
                  </div>
                </div>
              )}
            </div>

            {/* Composer - Always Visible */}
            <div className="border-t border-slate-200 dark:border-slate-700 bg-white/80 dark:bg-slate-800/80 backdrop-blur-md shadow-lg flex-shrink-0">
              {error && (
                <div className="px-6 pt-3">
                  <p className="text-sm text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg px-3 py-2">
                    {error}
                  </p>
                </div>
              )}
              
              {/* Quick Action Chips */}
              <div className="px-6 pt-3 pb-2 flex flex-wrap gap-2">
                <button
                  onClick={() => handleQuickAction('summarize')}
                  className="px-3 py-1 text-xs bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-full hover:bg-slate-200 dark:hover:bg-slate-600 transition"
                >
                  📋 Summarize version
                </button>
                <button
                  onClick={() => handleQuickAction('suggest-tweaks')}
                  className="px-3 py-1 text-xs bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-full hover:bg-slate-200 dark:hover:bg-slate-600 transition"
                >
                  ✨ Suggest tweaks
                </button>
                <button
                  onClick={() => handleQuickAction('check-consistency')}
                  className="px-3 py-1 text-xs bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-full hover:bg-slate-200 dark:hover:bg-slate-600 transition"
                >
                  🔍 Check consistency
                </button>
                <button
                  onClick={() => handleQuickAction('expand-lore')}
                  className="px-3 py-1 text-xs bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-full hover:bg-slate-200 dark:hover:bg-slate-600 transition"
                >
                  📖 Expand lore
                </button>
              </div>

              {/* Input Area */}
              <div className="px-6 pb-4">
                <div className="flex gap-2 items-end">
                  <button
                    className="flex-shrink-0 w-10 h-10 flex items-center justify-center rounded-lg border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-600 transition"
                    title="Attach file"
                  >
                    📎
                  </button>
                  <textarea
                    ref={textareaRef}
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        handleSend();
                      }
                    }}
                    placeholder="Ask for help..."
                    rows={1}
                    className="flex-1 resize-none border border-slate-200 dark:border-slate-600 rounded-lg px-4 py-2.5 text-sm bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent max-h-[120px]"
                  />
                  <button
                    onClick={handleSend}
                    disabled={!input.trim() || loading}
                    className="flex-shrink-0 px-6 py-2.5 bg-blue-600 dark:bg-blue-500 text-white rounded-lg hover:bg-blue-700 dark:hover:bg-blue-600 transition font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                  >
                    <span>Send</span>
                    <span>→</span>
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Proposals Side Rail */}
          {showProposals && proposals.length > 0 && (
            <div className="w-80 border-l border-slate-200 dark:border-slate-700 divider-glow bg-slate-50/50 dark:bg-slate-900/50 backdrop-blur-sm flex flex-col min-h-0 overflow-hidden flex-shrink-0 panel-slide-in">
              <div className="px-4 py-3 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between flex-shrink-0">
                <h4 className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                  Proposals ({proposals.length})
                </h4>
                <button
                  onClick={() => setShowProposals(false)}
                  className="text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"
                >
                  ✕
                </button>
              </div>
              <div className="flex-1 overflow-y-auto p-4 space-y-3">
                {proposals.map((proposal, index) => (
                  <div
                    key={proposal.id}
                    className={`bg-white dark:bg-slate-800 border rounded-xl p-4 text-sm shadow-sm ${
                      index === 0
                        ? 'border-blue-500 dark:border-blue-400 shadow-blue-500/20'
                        : 'border-slate-200 dark:border-slate-600'
                    }`}
                  >
                    {index === 0 && (
                      <div className="mb-3 px-3 py-1.5 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-lg text-xs font-semibold text-center">
                        ⭐ Most Recent Proposal
                      </div>
                    )}
                    <p className="font-medium text-slate-800 dark:text-slate-100 mb-2">
                      {proposal.proposalType === 'architect-document' ? '📄 Document Update' : '🎮 Mechanics & Lore Update'}
                    </p>
                    
                    <div className="mb-3 p-2 bg-blue-50 dark:bg-blue-900/20 rounded border border-blue-200 dark:border-blue-800">
                      <p className="text-xs font-semibold text-blue-800 dark:text-blue-200 mb-1">What this will improve:</p>
                      <div className="text-xs text-blue-700 dark:text-blue-300">
                        {proposal.payload?.explanation || (
                          proposal.proposalType === 'architect-document'
                            ? 'Updates project documentation with better structure and content.'
                            : 'Enhances game mechanics and lore to improve consistency and depth.'
                        )}
                      </div>
                    </div>

                    {proposal.changeLog?.length > 0 && (
                      <div className="mb-3 space-y-1">
                        <p className="text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">Changes:</p>
                        {proposal.changeLog.slice(0, 3).map((change) => (
                          <div key={change.field} className="text-xs text-slate-600 dark:text-slate-300 flex items-start gap-1">
                            <span>
                              {change.changeType === 'added' ? '➕' :
                               change.changeType === 'modified' ? '✏️' :
                               change.changeType === 'removed' ? '❌' : '📝'}
                            </span>
                            <span className="font-semibold">{change.field}</span>
                          </div>
                        ))}
                        {proposal.changeLog.length > 3 && (
                          <p className="text-xs text-slate-500">+{proposal.changeLog.length - 3} more</p>
                        )}
                      </div>
                    )}

                    <div className="flex gap-2 mt-4">
                      <button
                        onClick={() => handleAccept(proposal.id)}
                        className="flex-1 px-3 py-2 bg-blue-600 dark:bg-blue-500 text-white rounded-lg hover:bg-blue-700 dark:hover:bg-blue-600 transition text-xs font-medium"
                      >
                        ✅ Accept
                      </button>
                      <button
                        onClick={() => handleReject(proposal.id)}
                        className="px-3 py-2 bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-lg hover:bg-slate-300 dark:hover:bg-slate-600 transition text-xs font-medium"
                      >
                        ❌
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
