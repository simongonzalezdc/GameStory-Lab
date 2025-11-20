import React, { useEffect, useMemo, useRef, useState } from 'react';
import { assistantAPI } from '../services/api';

interface ProjectAssistantPanelProps {
  projectId: string;
  type?: 'concept' | 'architect';
  onRefine?: (focus: 'deepen-mechanics' | 'enrich-lore' | 'improve-consistency' | 'enhance-genre-fit') => void;
  refining?: boolean;
  onProposalAccepted?: () => void;
}

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  createdAt?: string;
  debug?: any;
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
  onRefine,
  refining = false,
  onProposalAccepted,
}: ProjectAssistantPanelProps) {
  const userBubbleStyle = useMemo(
    () => ({
      background: [
        'radial-gradient(120% 140% at 22% 18%, rgba(255,255,255,0.09), rgba(255,255,255,0) 52%)',
        'radial-gradient(140% 160% at 82% 12%, rgba(255,255,255,0.07), rgba(255,255,255,0) 55%)',
        'linear-gradient(145deg, #344676 0%, #4a5688 50%, #6B5D88 100%)', // sapphire to amethyst gradient
      ].join(','),
      border: '1px solid rgba(107, 93, 136, 0.65)', // amethyst border
      color: 'var(--color-text-primary)',
      borderRadius: 'var(--chat-bubble-radius)',
      padding: 'var(--chat-message-padding-y) var(--chat-message-padding-x)',
      fontSize: '0.875rem',
      lineHeight: '1.5',
      wordWrap: 'break-word' as const,
      maxWidth: 'var(--chat-message-max-width)',
      alignSelf: 'flex-end',
      marginLeft: 'auto',
      boxShadow: '0 16px 36px -18px rgba(52, 70, 118, 0.7), 0 0 0 1px rgba(107, 93, 136, 0.28)',
    }),
    []
  );

  const assistantBubbleStyle = useMemo(
    () => ({
      background: [
        'radial-gradient(120% 140% at 18% 18%, rgba(255,255,255,0.07), rgba(255,255,255,0) 52%)',
        'radial-gradient(140% 160% at 82% 16%, rgba(255,255,255,0.05), rgba(255,255,255,0) 55%)',
        'linear-gradient(155deg, #8F3E48 0%, #A85664 50%, #B5933C 100%)', // garnet to topaz brand gradient
      ].join(', '),
      border: '1px solid rgba(143, 62, 72, 0.65)', // garnet border
      boxShadow:
        '0 16px 36px -18px rgba(143, 62, 72, 0.7), 0 0 0 1px rgba(143, 62, 72, 0.28)',
    }),
    []
  );

  const parseSegments = (content: string) => {
    const segments: Array<{ type: 'code' | 'text'; lang?: string; content: string }> = [];
    const codeRegex = /```(\w+)?\n([\s\S]*?)```/gm;
    let lastIndex = 0;
    let match;
    while ((match = codeRegex.exec(content)) !== null) {
      if (match.index > lastIndex) {
        segments.push({ type: 'text', content: content.slice(lastIndex, match.index) });
      }
      segments.push({ type: 'code', lang: match[1] || undefined, content: match[2] });
      lastIndex = codeRegex.lastIndex;
    }
    if (lastIndex < content.length) {
      segments.push({ type: 'text', content: content.slice(lastIndex) });
    }
    return segments;
  };

  const renderInline = (text: string, keyPrefix: string) => {
    const parts: React.ReactNode[] = [];
    const regex = /(\[([^\]]+)\]\(([^)]+)\))|(`([^`]+)`)|(\*\*([^*]+)\*\*)|(_([^_]+)_)/g;
    let lastIndex = 0;
    let match;
    let idx = 0;
    while ((match = regex.exec(text)) !== null) {
      if (match.index > lastIndex) {
        parts.push(<span key={`${keyPrefix}-${idx++}`}>{text.slice(lastIndex, match.index)}</span>);
      }
      if (match[2] && match[3]) {
        parts.push(
          <a key={`${keyPrefix}-${idx++}`} href={match[3]} target="_blank" rel="noreferrer" className="text-brand-200 underline">
            {match[2]}
          </a>
        );
      } else if (match[5]) {
        parts.push(
          <code key={`${keyPrefix}-${idx++}`} className="inline-code">
            {match[5]}
          </code>
        );
      } else if (match[7]) {
        parts.push(
          <strong key={`${keyPrefix}-${idx++}`} className="text-slate-50">
            {match[7]}
          </strong>
        );
      } else if (match[9]) {
        parts.push(
          <em key={`${keyPrefix}-${idx++}`} className="text-slate-200">
            {match[9]}
          </em>
        );
      }
      lastIndex = regex.lastIndex;
    }
    if (lastIndex < text.length) {
      parts.push(<span key={`${keyPrefix}-${idx++}`}>{text.slice(lastIndex)}</span>);
    }
    return parts;
  };

  const renderTextSegment = (text: string, keyPrefix: string) => {
    const trimmed = text.trim();
    const calloutMatch = trimmed.match(/^(INFO|WARNING|WARN|ERROR):?\s*(.*)$/i);
    if (calloutMatch) {
      const level = calloutMatch[1].toLowerCase();
      const body = calloutMatch[2] || '';
      const bg =
        level.startsWith('err') ? 'bg-red-900/25 border-red-700 text-red-100' :
        level.startsWith('warn') ? 'bg-amber-900/25 border-amber-700 text-amber-100' :
        'bg-brand-900/20 border-brand-700 text-brand-100';
      return (
        <div key={`${keyPrefix}-callout`} className={`rounded-md border px-3 py-2 text-sm ${bg}`}>
          <div className="font-semibold mb-1 uppercase tracking-wide text-xs">{calloutMatch[1]}</div>
          <div className="leading-relaxed">{renderInline(body, `${keyPrefix}-c`)}</div>
        </div>
      );
    }

    const lines = text.split('\n');
    const nodes: React.ReactNode[] = [];
    let bulletBuffer: string[] = [];

    const flushBullets = () => {
      if (bulletBuffer.length) {
        nodes.push(
          <ul key={`${keyPrefix}-ul-${nodes.length}`} className="list-disc list-inside space-y-1 text-slate-200">
            {bulletBuffer.map((item, idx) => (
              <li key={`${keyPrefix}-li-${idx}`}>{renderInline(item.trim(), `${keyPrefix}-li-${idx}`)}</li>
            ))}
          </ul>
        );
        bulletBuffer = [];
      }
    };

    lines.forEach((line, idx) => {
      if (/^\s*[-*]\s+/.test(line)) {
        bulletBuffer.push(line.replace(/^\s*[-*]\s+/, ''));
      } else if (line.trim() === '') {
        flushBullets();
      } else {
        flushBullets();
        nodes.push(
          <p key={`${keyPrefix}-p-${idx}`} className="text-slate-200 leading-relaxed">
            {renderInline(line, `${keyPrefix}-p-${idx}`)}
          </p>
        );
      }
    });
    flushBullets();

    if (!nodes.length) {
      return (
        <p key={`${keyPrefix}-plain`} className="text-slate-200 leading-relaxed">
          {renderInline(text, `${keyPrefix}-plain`)}
        </p>
      );
    }
    return nodes;
  };

  const [session, setSession] = useState<any | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [proposals, setProposals] = useState<AssistantProposal[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showProposals, setShowProposals] = useState(false);
  const [quickMode, setQuickMode] = useState<'standard' | 'concise' | 'detailed'>('standard');
  const [expandedMessages, setExpandedMessages] = useState<Set<string>>(new Set());
  const listRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);

  useEffect(() => {
    if (!projectId) return;
    setError(null);
    console.log('[Assistant] Starting session:', { projectId, type });
    assistantAPI
      .startSession({ projectId, type })
      .then((data) => {
        console.log('[Assistant] Session started:', data);
        setSession(data.session);
        setMessages(
          (data.messages as ChatMessage[]).map((msg) => ({
            ...msg,
            role: msg.role === 'assistant' ? 'assistant' : 'user',
            createdAt: msg.createdAt || new Date().toISOString(),
          }))
        );
        setProposals(data.proposals as AssistantProposal[]);
        // Auto-show proposals if they exist
        if (data.proposals && data.proposals.length > 0) {
          setShowProposals(true);
        }
        
        // For architect type, automatically send a greeting to trigger the interview
        if (type === 'architect' && data.messages.length === 0 && data.session?.id) {
          // Wait a moment for the session to be fully initialized, then send greeting
          setTimeout(async () => {
            try {
              const response = await assistantAPI.sendMessage(data.session.id, 'Hi! I\'m ready to create documentation for my game.');
              setMessages((prev) => [
                ...prev,
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
              console.error('[Assistant] Failed to send auto-greeting:', err);
              // Don't show error to user - just log it
            }
          }, 1500);
        }
      })
      .catch((err) => {
        console.error('[Assistant] Failed to start session:', err);
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
    
    // Add user message immediately for better UX
    const tempUserMessage = {
      id: crypto.randomUUID(),
      role: 'user' as const,
      content: userMessage,
      createdAt: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, tempUserMessage]);
    
    try {
      console.log('[Assistant] Sending message:', { sessionId: session.id, message: userMessage });
      const response: any = await assistantAPI.sendMessage(session.id, userMessage);
      console.log('[Assistant] Received response:', response);
      
      // Log debug info if available
      if ((response as any).debug) {
        const dbg = (response as any).debug;
        console.log('[Assistant] Debug Info:', dbg);
        console.log('[Assistant] AI Response Preview:', dbg.aiResponsePreview);
        console.log('[Assistant] Parsed Proposal Preview:', dbg.parsedProposalPreview);
        console.log('[Assistant] Has Proposal:', dbg.hasProposal);
        console.log('[Assistant] Proposal Keys:', dbg.proposalKeys);
      }
      
      setMessages((prev) => [
        ...prev,
        {
          ...response.message,
          createdAt: response.message.createdAt || new Date().toISOString(),
        }
      ]);
      
      if (response.proposal) {
        console.log('[Assistant] Received proposal:', response.proposal);
        setProposals((prev) => [response.proposal as AssistantProposal, ...prev]);
        setShowProposals(true); // Auto-show when new proposal arrives
      } else if (response.debug?.userWantsProposal) {
        console.warn('[Assistant] User requested proposal but none was generated!');
        console.warn('[Assistant] Debug details:', response.debug);
      }
    } catch (err) {
      console.error('[Assistant] Error sending message:', err);
      const errorMessage = err instanceof Error ? err.message : 'Assistant failed to respond';
      setError(errorMessage);
      // Remove the user message if sending failed
      setMessages((prev) => prev.filter((msg) => msg.id !== tempUserMessage.id));
    } finally {
      setLoading(false);
    }
  };

  const handleQuickAction = (action: string) => {
    const prompts: Record<string, string> = {
      'summarize': `Summarize the current version and check its consistency:

1. Provide a comprehensive summary of the mechanics and lore
2. Analyze the consistency between mechanics and lore
3. Highlight any alignment issues or validation concerns
4. Give an overall assessment of the version's coherence

This helps me understand the current state and identify any consistency problems.`,
      'suggest-tweaks': `Analyze this version comprehensively and suggest improvements across all dimensions:

1. **Mechanics Depth**: What opportunities exist to deepen gameplay mechanics? Consider edge cases, balancing, advanced systems, and complexity.

2. **Lore Enrichment**: How could the narrative and worldbuilding be expanded? Think about character depth, backstory, thematic elements, and world rules.

3. **Consistency Issues**: What inconsistencies exist between mechanics and lore? What validation issues need addressing?

4. **Genre Fit**: How well does this align with genre conventions? What genre-specific elements could be enhanced?

For each category, provide specific, actionable suggestions. Help me understand what improvements are possible before I decide which refinement to apply.`,
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
      // Find the proposal to log its contents before accepting
      const proposal = proposals.find(p => p.id === proposalId);
      console.log('[Assistant] Accepting proposal:', {
        proposalId,
        proposalType: proposal?.proposalType,
        hasMechanics: !!(proposal?.payload?.mechanics),
        hasLore: !!(proposal?.payload?.lore),
        mechanicsKeys: proposal?.payload?.mechanics ? Object.keys(proposal.payload.mechanics) : [],
        loreKeys: proposal?.payload?.lore ? Object.keys(proposal.payload.lore) : [],
        mechanicsEmpty: proposal?.payload?.mechanics && Object.keys(proposal.payload.mechanics).length === 0,
        loreEmpty: proposal?.payload?.lore && Object.keys(proposal.payload.lore).length === 0,
      });
      
      let response;
     try {
       response = await assistantAPI.acceptProposal(proposalId) as any;
     } catch (err: any) {
       // Handle API errors (400, 500, etc.)
       console.error('[Assistant] Proposal acceptance failed:', err);
        const errorMessage = err?.error || err?.message || (err as any)?.response?.data || 'Failed to apply proposal';
        const errorDetails = err?.details || (err as any)?.response?.data?.details || '';
        setError(`${errorMessage}${errorDetails ? `\n\nDetails: ${errorDetails}` : ''}`);
        // Don't remove proposal from list if it failed
        return;
     }
      
      console.log('[Assistant] Proposal accepted, response:', response);
      
      // The API returns {success: true, result: {newVersion: {...} | documentation: {...}}}
      // OR {error: "...", details: "..."} if validation failed
      if ((response as any).error) {
        console.error('[Assistant] Proposal acceptance returned error:', response);
        setError((response as any).error + ((response as any).details ? `\n\n${(response as any).details}` : ''));
        // Don't remove proposal from list if it failed
        return;
      }
      
      const actualResult = (response as any).result;
      
      console.log('[Assistant] Checking result structure:', {
        fullResponse: response,
        responseKeys: Object.keys(response),
        hasResult: !!response.result,
        resultType: typeof response.result,
        resultValue: response.result,
        resultKeys: response.result && typeof response.result === 'object' ? Object.keys(response.result) : [],
        resultStringified: response.result ? JSON.stringify(response.result, null, 2) : 'null/undefined',
      });
      
      if (!actualResult || (!actualResult.newVersion && !actualResult.documentation)) {
        console.warn('[Assistant] Proposal accepted but no version or documentation was created', {
          fullResponse: response,
          actualResult,
          hasNewVersion: !!actualResult?.newVersion,
          hasDocumentation: !!actualResult?.documentation,
          resultIsNull: actualResult === null,
          resultIsUndefined: actualResult === undefined,
        });
        setError('Proposal was accepted but no changes were applied. The proposal may have been empty or contained no actual mechanics/lore changes.');
        // Still remove the proposal from the list since it was accepted
        setProposals((prev) => prev.filter((p) => p.id !== proposalId));
        return;
      }
      
      console.log('[Assistant] Proposal applied successfully', {
        hasNewVersion: !!actualResult.newVersion,
        hasDocumentation: !!actualResult.documentation,
        newVersionId: actualResult.newVersion?.id,
        newVersionNumber: actualResult.newVersion?.version,
      });
      
      setProposals((prev) => prev.filter((p) => p.id !== proposalId));
      // Notify parent component to refresh data
      if (onProposalAccepted) {
        await onProposalAccepted();
      }
    } catch (err) {
      console.error('[Assistant] Failed to accept proposal:', err);
      const errorMessage = err instanceof Error ? err.message : 'Failed to apply proposal';
      setError(errorMessage);
      // Show alert for better visibility
      alert(`Failed to apply proposal: ${errorMessage}`);
    }
  };

  const handleReject = async (proposalId: string) => {
    try {
      await assistantAPI.rejectProposal(proposalId);
      setProposals((prev) => prev.filter((p) => p.id !== proposalId));
    } catch (err) {
      const msg = err instanceof Error ? err.message : (err as any)?.response?.data || 'Failed to reject proposal';
      setError(msg);
    }
  };

  const headerLabel = useMemo(() => {
    if (type === 'architect') return 'Architect Assistant';
    return 'Project Assistant';
  }, [type]);

  return (
    <div className="chat-container relative cq-panel w-full h-full">
      {/* Full-height Assistant Card */}
      <div className="flex-1 flex flex-col min-h-0 overflow-hidden bg-surface chat-container assistant-card-glow assistant-transition shadow-lg">
        {/* Rich Header */}
        <div className="chat-header divider-glow">
          <div className="flex items-center justify-between mb-1">
            <div className="flex items-center gap-3">
              <div className="chat-avatar bg-gradient-to-br from-brand-500 to-mint-500 text-white shadow-lg" style={{ width: '40px', height: '40px', fontSize: '1rem' }}>
                AI
              </div>
              <div>
                <h3 className="text-lg font-bold text-slate-100">{headerLabel}</h3>
                <p className="text-xs text-slate-400">
                  {session ? `Session ${session.id.slice(0, 8)}` : 'Connecting...'}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <select
                value={quickMode}
                onChange={(e) => setQuickMode(e.target.value as 'standard' | 'concise' | 'detailed')}
                className="input text-xs px-2 py-1 bg-surface-strong border border-border-subtle text-slate-300 focus:outline-none focus:ring-2 focus:ring-brand-500"
              >
                <option value="standard">Standard</option>
                <option value="concise">Concise</option>
                <option value="detailed">Detailed</option>
              </select>
              {proposals.length > 0 && (
                <button
                  onClick={() => setShowProposals(!showProposals)}
                  className={`relative px-3 py-1.5 btn transition text-xs font-medium flex items-center gap-1.5 ${
                    showProposals
                      ? 'bg-brand-600 text-white'
                      : 'bg-brand-500 text-white hover:bg-brand-600 animate-pulse'
                  }`}
                  title={`${proposals.length} proposal${proposals.length > 1 ? 's' : ''} ready for review`}
                >
                  <span>💡</span>
                  <span>Proposals</span>
                  <span className="notification-badge bg-red-500 -top-1 -right-1">
                    {proposals.length}
                  </span>
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Main Content Area */}
        <div className="flex-1 flex min-h-0 overflow-hidden cq-stack">
          {/* Chat Area */}
          <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
            {/* Messages */}
            <div ref={listRef} className="chat-messages-area">
              {messages.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-center px-4">
                  <div className="chat-avatar bg-gradient-to-br from-brand-500 to-mint-500 text-white mb-3 shadow-lg" style={{ width: '48px', height: '48px', fontSize: '1.125rem' }}>
                    AI
                  </div>
                  <h4 className="text-base font-semibold text-slate-100 mb-1.5">
                    Start a conversation
                  </h4>
                  <p className="text-xs text-slate-400 max-w-md">
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
                    <div className={`chat-avatar ${
                      msg.role === 'assistant'
                        ? 'bg-gradient-to-br from-brand-500 to-mint-500 text-white'
                        : 'bg-gradient-to-br from-slate-400 to-slate-600 text-white'
                    }`}>
                      {getInitials(msg.role)}
                    </div>
                    {/* Message Bubble */}
                    <div className={`flex-1 ${msg.role === 'user' ? 'flex flex-col items-end' : 'flex flex-col items-start'}`}>
                      <div
                        className={`chat-message-bubble relative shadow-sm ${
                          msg.role === 'assistant'
                            ? 'chat-message-assistant text-slate-100'
                            : 'chat-message-user text-white'
                        }`}
                        style={msg.role === 'user' ? userBubbleStyle : assistantBubbleStyle}
                      >
                        {(() => {
                          const segments = parseSegments(msg.content);
                          const isLong = msg.content.length > 1200;
                          const isExpanded = expandedMessages.has(msg.id);
                          return (
                            <>
                              <div
                                className={`space-y-2 ${isLong && !isExpanded ? 'max-h-[380px] overflow-hidden pr-1.5' : ''}`}
                              >
                                {segments.map((segment, idx) =>
                                  segment.type === 'code' ? (
                                    <pre
                                      key={`${msg.id}-code-${idx}`}
                                      className="code-block text-slate-100 overflow-auto"
                                    >
                                      <code className="whitespace-pre">{segment.content}</code>
                                    </pre>
                                  ) : (
                                    <div key={`${msg.id}-text-${idx}`} className="space-y-2">
                                      {renderTextSegment(segment.content, `${msg.id}-t-${idx}`)}
                                    </div>
                                  )
                                )}
                              </div>
                              {isLong && !isExpanded && (
                                <div className="absolute inset-x-0 bottom-0 h-20 pointer-events-none bg-gradient-to-t from-black/50 via-black/20 to-transparent rounded-b-lg" />
                              )}
                              {isLong && (
                                <div className="pt-2 flex justify-end">
                                  <button
                                    onClick={() => {
                                      setExpandedMessages((prev) => {
                                        const next = new Set(prev);
                                        if (isExpanded) {
                                          next.delete(msg.id);
                                        } else {
                                          next.add(msg.id);
                                        }
                                        return next;
                                      });
                                    }}
                                    className="text-xs px-2 py-1 btn border border-border-subtle bg-surface-strong hover:border-brand-300 transition"
                                  >
                                    {isExpanded ? 'Collapse' : 'Expand'}
                                  </button>
                                </div>
                              )}
                            </>
                          );
                        })()}
                      </div>
                      {msg.createdAt && (
                        <div className={`text-xs text-slate-400 mt-0.5 px-1 ${
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
                  <div className="chat-avatar bg-gradient-to-br from-brand-600 to-mint-500 text-white">
                    AI
                  </div>
                  <div className="typing-indicator bg-surface-elevated border border-border-subtle">
                    <div className="w-2 h-2 bg-brand-500 rounded-full typing-dot" />
                    <div className="w-2 h-2 bg-brand-500 rounded-full typing-dot" />
                    <div className="w-2 h-2 bg-brand-500 rounded-full typing-dot" />
                  </div>
                </div>
              )}
            </div>

            {/* Composer - Always Visible */}
            <div className="chat-input-area shadow-lg">
              {error && (
                <div className="px-4 pt-2">
                  <div className="text-sm text-red-400 bg-red-900/20 border border-red-800 rounded-md px-3 py-2 flex items-start justify-between gap-2">
                    <div className="flex-1">
                      <p className="font-semibold mb-1">Error sending message</p>
                      <p className="text-xs">{error}</p>
                      <p className="text-xs mt-1 opacity-75">Check the browser console (F12) for more details.</p>
                    </div>
                    <button
                      onClick={() => setError(null)}
                      className="text-red-400 hover:text-red-300 flex-shrink-0"
                      title="Dismiss error"
                    >
                      ✕
                    </button>
                  </div>
                </div>
              )}
              
              {/* Quick Actions */}
              <div className="px-4 pt-2 pb-1.5">
                <div className="flex flex-wrap gap-2">
                  {/* Quick Chat Actions */}
                  <button
                    onClick={() => handleQuickAction('summarize')}
                    className="quick-action-pill focus-visible:outline-2 focus-visible:outline focus-visible:outline-brand-500"
                  >
                    📋 Summarize & Check Consistency
                  </button>
                  <button
                    onClick={() => handleQuickAction('suggest-tweaks')}
                    className="quick-action-pill focus-visible:outline-2 focus-visible:outline focus-visible:outline-brand-500"
                  >
                    ✨ Suggest Tweaks
                  </button>
                  
                  {/* Refinement Actions */}
                  {onRefine && (
                    <>
                      <button
                        onClick={() => onRefine('deepen-mechanics')}
                        disabled={refining}
                        className="quick-action-pill bg-brand-900/25 text-brand-200 hover:bg-brand-900/40 disabled:opacity-50 border border-brand-800/70 focus-visible:outline-2 focus-visible:outline focus-visible:outline-brand-500"
                      >
                        ⚙️ Deepen Mechanics
                      </button>
                      <button
                        onClick={() => onRefine('enrich-lore')}
                        disabled={refining}
                        className="quick-action-pill bg-mint-500/20 text-mint-300 hover:bg-mint-500/30 disabled:opacity-50 border border-mint-500/40 focus-visible:outline-2 focus-visible:outline focus-visible:outline-mint-500/70"
                      >
                        📖 Enrich Lore
                      </button>
                      <button
                        onClick={() => onRefine('improve-consistency')}
                        disabled={refining}
                        className="quick-action-pill bg-surface-strong text-emerald-200 hover:border-emerald-400 disabled:opacity-50 focus-visible:outline-2 focus-visible:outline focus-visible:outline-emerald-500/80"
                      >
                        ♻️ Improve Consistency
                      </button>
                      <button
                        onClick={() => onRefine('enhance-genre-fit')}
                        disabled={refining}
                        className="quick-action-pill bg-amber-900/30 text-amber-200 hover:bg-amber-900/50 disabled:opacity-50 border border-amber-800/70 focus-visible:outline-2 focus-visible:outline focus-visible:outline-amber-500/80"
                      >
                        🎯 Enhance Genre Fit
                      </button>
                    </>
                  )}
                </div>
              </div>

              {/* Input Area */}
              <div className="px-4 pb-3">
                <div className="flex gap-2 items-end">
                  <button
                    className="btn flex-shrink-0 w-10 h-10 border border-border-subtle bg-surface-strong text-slate-300 hover:bg-surface-elevated transition opacity-50 cursor-not-allowed"
                    title="Attach file"
                    disabled
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
                    className="input flex-1 resize-none border border-border-subtle px-4 py-2.5 text-sm bg-surface-elevated text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent max-h-[120px]"
                  />
                  <button
                    onClick={handleSend}
                    disabled={!input.trim() || loading}
                    className="btn flex-shrink-0 px-6 py-2.5 bg-brand-500 text-white hover:bg-brand-600 transition font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
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
            <div className="chat-proposal-panel panel-slide-in">
              <div className="chat-header flex items-center justify-between">
                <h4 className="text-sm font-semibold text-slate-100">
                  Proposals ({proposals.length})
                </h4>
                <button
                  onClick={() => setShowProposals(false)}
                  className="text-slate-400 hover:text-slate-200"
                >
                  ✕
                </button>
              </div>
              <div className="flex-1 overflow-y-auto p-4 space-y-3">
                {proposals.map((proposal, index) => (
                  <div
                    key={proposal.id}
                    className={`card p-4 text-sm shadow-sm ${
                      index === 0
                        ? 'border-brand-400 shadow-brand-500/20'
                        : 'border-border-subtle'
                    }`}
                  >
                    {index === 0 && (
                      <div className="mb-3 px-3 py-1.5 badge-lg bg-gradient-to-r from-brand-600 to-mint-500 text-white text-center">
                        ⭐ Most Recent Proposal
                      </div>
                    )}
                    <p className="font-medium text-slate-100 mb-2">
                      {proposal.proposalType === 'architect-document' ? '📄 Document Update' : '🎮 Mechanics & Lore Update'}
                    </p>
                    
                    <div className="mb-3 p-2 bg-brand-900/20 rounded border border-brand-800">
                      <p className="text-xs font-semibold text-brand-200 mb-1">What this will improve:</p>
                      <div className="text-xs text-brand-300 whitespace-pre-wrap">
                        {proposal.payload?.explanation || (
                          proposal.proposalType === 'architect-document'
                            ? 'Updates project documentation with better structure and content.'
                            : 'Enhances game mechanics and lore to improve consistency and depth.'
                        )}
                      </div>
                    </div>

                    {/* Show preview of architect documents if present */}
                    {proposal.proposalType === 'architect-document' && proposal.payload?.architectDocuments && (
                      <div className="mb-3 p-2 bg-purple-900/20 rounded border border-purple-800">
                        <p className="text-xs font-semibold text-purple-200 mb-1">Documents to create/update:</p>
                        <ul className="text-xs text-purple-300 space-y-1">
                          {proposal.payload.architectDocuments.map((doc: any, idx: number) => (
                            <li key={idx} className="flex items-start gap-1">
                              <span>📄</span>
                              <span className="font-medium">{doc.name || `Document ${idx + 1}`}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {/* Show preview of mechanics/lore changes if present */}
                    {proposal.proposalType === 'concept-update' && (
                      <div className="mb-3 p-2 bg-emerald-900/20 rounded border border-emerald-800">
                        <p className="text-xs font-semibold text-emerald-200 mb-1">Will update:</p>
                        <div className="text-xs text-emerald-300 space-y-1">
                          {proposal.payload?.mechanics && (
                            <div className="flex items-center gap-1">
                              <span>⚙️</span>
                              <span>Mechanics ({Object.keys(proposal.payload.mechanics).length} fields)</span>
                              {Object.keys(proposal.payload.mechanics).length === 0 && (
                                <span className="text-red-400 ml-2">⚠️ Empty!</span>
                              )}
                            </div>
                          )}
                          {proposal.payload?.lore && (
                            <div className="flex items-center gap-1">
                              <span>📖</span>
                              <span>Lore ({Object.keys(proposal.payload.lore).length} fields)</span>
                              {Object.keys(proposal.payload.lore).length === 0 && (
                                <span className="text-red-400 ml-2">⚠️ Empty!</span>
                              )}
                            </div>
                          )}
                          {(!proposal.payload?.mechanics || Object.keys(proposal.payload.mechanics).length === 0) &&
                           (!proposal.payload?.lore || Object.keys(proposal.payload.lore).length === 0) && (
                            <div className="text-red-400 font-semibold mt-2 p-2 bg-red-900/20 rounded border border-red-800">
                              ⚠️ WARNING: This proposal has no mechanics or lore content! Accepting it will not create a new version.
                            </div>
                          )}
                        </div>
                      </div>
                    )}

                    {proposal.changeLog?.length > 0 && (
                      <div className="mb-3 space-y-1">
                        <p className="text-xs font-semibold text-slate-300 mb-1">Changes:</p>
                        {proposal.changeLog.slice(0, 3).map((change) => (
                          <div key={change.field} className="text-xs text-slate-300 flex items-start gap-1">
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
                        className="flex-1 px-3 py-2 btn bg-brand-500 text-white hover:bg-brand-600 transition text-xs font-medium"
                      >
                        ✅ Accept
                      </button>
                      <button
                        onClick={() => handleReject(proposal.id)}
                        className="px-3 py-2 btn bg-slate-700 text-slate-300 hover:bg-slate-600 transition text-xs font-medium"
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
