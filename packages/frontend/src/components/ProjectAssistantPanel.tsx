import { useEffect, useMemo, useRef, useState } from 'react';
import { assistantAPI } from '../services/api';

interface ProjectAssistantPanelProps {
  projectId: string;
  type?: 'concept' | 'architect';
  initiallyOpen?: boolean;
}

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
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
  payload: any;
  createdAt: string;
}

export function ProjectAssistantPanel({
  projectId,
  type = 'concept',
  initiallyOpen = false,
}: ProjectAssistantPanelProps) {
  const [session, setSession] = useState<any | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [proposals, setProposals] = useState<AssistantProposal[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [open, setOpen] = useState(initiallyOpen);
  const listRef = useRef<HTMLDivElement>(null);

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
          }))
        );
        setProposals(data.proposals as AssistantProposal[]);
      })
      .catch((err) => {
        setError(err instanceof Error ? err.message : 'Failed to start assistant');
      });
  }, [projectId, type]);

  useEffect(() => {
    if (!listRef.current) return;
    listRef.current.scrollTop = listRef.current.scrollHeight;
  }, [messages]);

  const handleSend = async () => {
    if (!session?.id || !input.trim()) return;
    setLoading(true);
    setError(null);
    try {
      const response = await assistantAPI.sendMessage(session.id, input.trim());
      setMessages((prev) => [...prev, { id: crypto.randomUUID(), role: 'user', content: input.trim() }, response.message]);
      setInput('');
      if (response.proposal) {
        setProposals((prev) => [response.proposal as AssistantProposal, ...prev]);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Assistant failed to respond');
    } finally {
      setLoading(false);
    }
  };

  const handleAccept = async (proposalId: string) => {
    try {
      await assistantAPI.acceptProposal(proposalId);
      setProposals((prev) => prev.filter((p) => p.id !== proposalId));
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
    <div className="relative">
      <button
        onClick={() => setOpen((prev) => !prev)}
        className="btn btn-secondary w-full mb-4"
      >
        {open ? 'Hide' : 'Show'} {headerLabel}
      </button>
      {open && (
        <div className="border border-slate-200 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-800 shadow-sm flex flex-col h-[600px]">
          <div className="px-4 py-3 border-b border-slate-100 dark:border-slate-700 flex items-center justify-between">
            <div>
              <p className="text-sm uppercase tracking-wide text-slate-500 dark:text-slate-400">{headerLabel}</p>
              <p className="text-xs text-slate-400">{session ? `Session ${session.id.slice(0, 8)}` : 'Connecting...'}</p>
            </div>
          </div>

          <div ref={listRef} className="flex-1 overflow-y-auto px-4 py-3 space-y-3">
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`rounded-lg px-3 py-2 text-sm max-w-[90%] ${
                  msg.role === 'assistant'
                    ? 'bg-blue-50 dark:bg-blue-900/20 self-start'
                    : 'bg-slate-100 dark:bg-slate-700 self-end ml-auto'
                }`}
              >
                {msg.content}
              </div>
            ))}
            {loading && (
              <div className="text-xs text-slate-500">Assistant typing…</div>
            )}
          </div>

          <div className="border-t border-slate-100 dark:border-slate-700 p-3">
            {error && <p className="text-sm text-red-500 mb-2">{error}</p>}
            <div className="flex gap-2">
              <input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Ask for help..."
                className="flex-1 border border-slate-200 dark:border-slate-600 rounded-lg px-3 py-2 text-sm bg-white dark:bg-slate-900"
              />
              <button
                onClick={handleSend}
                disabled={!input.trim() || loading}
                className="btn btn-primary"
              >
                Send
              </button>
            </div>
          </div>

          {proposals.length > 0 && (
            <div className="border-t border-slate-100 dark:border-slate-700 p-3 bg-slate-50 dark:bg-slate-900/50">
              <p className="text-xs uppercase text-slate-500 mb-2">
                Pending Suggestions ({proposals.length})
              </p>
              <div className="space-y-3 max-h-52 overflow-y-auto pr-1">
                {proposals.map((proposal) => (
                  <div key={proposal.id} className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-600 rounded-lg p-3 text-sm">
                    <p className="font-medium text-slate-800 dark:text-slate-100 mb-1">
                      {proposal.proposalType === 'architect-document' ? 'Document Update' : 'Mechanics & Lore Update'}
                    </p>
                    <div className="space-y-1">
                      {proposal.changeLog?.length ? (
                        proposal.changeLog.map((change) => (
                          <div key={change.field} className="text-xs text-slate-600 dark:text-slate-300">
                            <span className="font-semibold">{change.field}</span>: {change.changeType}
                          </div>
                        ))
                      ) : (
                        <p className="text-xs text-slate-500">Preview not available.</p>
                      )}
                    </div>
                    <div className="flex gap-2 mt-3">
                      <button
                        onClick={() => handleAccept(proposal.id)}
                        className="btn btn-primary flex-1"
                      >
                        Accept
                      </button>
                      <button
                        onClick={() => handleReject(proposal.id)}
                        className="btn btn-secondary flex-1"
                      >
                        Reject
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
