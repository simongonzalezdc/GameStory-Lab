import React, { useEffect, useMemo, useRef, useState } from 'react';
import { assistantAPI } from '../services/api';
import { ThinkingIndicator } from './ThinkingIndicator';
import { TokenPrism } from './ui/TokenPrism';

interface ProjectAssistantPanelProps {
  projectId?: string;
  type?: 'concept' | 'architect' | 'project';
  mode?: 'concept' | 'architect' | 'auto';
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
  metadata?: {
    quickActionId?: string;
    thinking?: string; // Minimax M2 thinking/reasoning content
    model?: string;
  };
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

type QuickAction = {
  id: string;
  label: string;
  type: 'message' | 'refine';
  focus?: 'deepen-mechanics' | 'enrich-lore';
};

export function ProjectAssistantPanel({
  projectId,
  type = 'concept',
  mode: initialMode = 'auto',
  onRefine,
  refining = false,
  onProposalAccepted,
}: ProjectAssistantPanelProps) {
  const quickActions = useMemo<QuickAction[]>(() => {
    const isGeneralMode = !projectId;

    const base: QuickAction[] = [
      {
        id: 'summarize-analyze',
        label: isGeneralMode ? '❓ How It Works' : '📊 Summarize & Analyze',
        type: 'message' as const,
      },
      {
        id: 'propose-improvements',
        label: isGeneralMode ? '🚀 Get Started' : '🛠️ Propose Improvements',
        type: 'message' as const,
      },
    ];

    if (onRefine) {
      base.push(
        {
          id: 'deepen-mechanics',
          label: '⚙️ Deepen Mechanics',
          type: 'refine',
          focus: 'deepen-mechanics',
        },
        {
          id: 'enrich-lore',
          label: '📖 Enrich Lore',
          type: 'refine',
          focus: 'enrich-lore',
        }
      );
    }

    return base;
  }, [onRefine]);

  const userBubbleStyle = useMemo(
    () => ({
      background: 'var(--chat-bubble-user-background)',
      border: '1px solid var(--chat-bubble-user-border-color)',
      color: 'var(--chat-bubble-text-color)',
      borderRadius: 'var(--chat-bubble-radius)',
      padding: 'var(--chat-message-padding-y) var(--chat-message-padding-x)',
      fontSize: '0.9rem',
      fontWeight: '500',
      lineHeight: '1.6',
      wordWrap: 'break-word' as const,
      maxWidth: 'var(--chat-message-max-width)',
      alignSelf: 'flex-end',
      marginLeft: 'auto',
      boxShadow: 'var(--chat-bubble-user-shadow)',
    }),
    []
  );

  const assistantBubbleStyle = useMemo(
    () => ({
      background: 'var(--chat-bubble-assistant-background)',
      border: '1px solid var(--chat-bubble-assistant-border-color)',
      color: 'var(--chat-bubble-text-color)',
      borderRadius: 'var(--chat-bubble-radius)',
      padding: 'var(--chat-message-padding-y) var(--chat-message-padding-x)',
      fontSize: '0.9rem',
      fontWeight: '500',
      lineHeight: '1.6',
      wordWrap: 'break-word' as const,
      maxWidth: 'var(--chat-message-max-width)',
      boxShadow: 'var(--chat-bubble-assistant-shadow)',
    }),
    []
  );

  // Helper function to format JSON strings
  const formatJSON = (text: string): string => {
    try {
      // Try to parse as JSON
      const parsed = JSON.parse(text.trim());
      // Return formatted JSON with 2-space indentation
      return JSON.stringify(parsed, null, 2);
    } catch {
      // Not valid JSON, return as-is
      return text;
    }
  };

  // Helper function to detect if a string is JSON
  const isJSON = (text: string): boolean => {
    try {
      JSON.parse(text.trim());
      return true;
    } catch {
      return false;
    }
  };

  const parseSegments = (content: string) => {
    const segments: Array<{ type: 'code' | 'text'; lang?: string; content: string }> = [];
    const codeRegex = /```(\w+)?\n([\s\S]*?)```/gm;
    let lastIndex = 0;
    let match;
    while ((match = codeRegex.exec(content)) !== null) {
      if (match.index > lastIndex) {
        segments.push({ type: 'text', content: content.slice(lastIndex, match.index) });
      }
      let codeContent = match[2];
      const lang = match[1]?.toLowerCase() || undefined;
      
      // Auto-detect and format JSON
      if (lang === 'json' || (!lang && isJSON(codeContent))) {
        codeContent = formatJSON(codeContent);
      }
      
      segments.push({ type: 'code', lang: lang || (isJSON(codeContent) ? 'json' : undefined), content: codeContent });
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
          <strong key={`${keyPrefix}-${idx++}`} className="text-[var(--color-text-primary)]">
            {match[7]}
          </strong>
        );
      } else if (match[9]) {
        parts.push(
          <em key={`${keyPrefix}-${idx++}`} className="text-[var(--color-text-secondary)]">
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

  // Enhanced function to find and extract JSON from text (handles strings and nested structures)
  const findJSONInText = (text: string): Array<{ start: number; end: number; json: string }> => {
    const results: Array<{ start: number; end: number; json: string }> = [];
    let depth = 0;
    let start = -1;
    let braceType: '{' | '[' | null = null;
    let inString = false;
    let escapeNext = false;
    
    for (let i = 0; i < text.length; i++) {
      const char = text[i];
      
      if (escapeNext) {
        escapeNext = false;
        continue;
      }
      
      if (char === '\\') {
        escapeNext = true;
        continue;
      }
      
      // Track string boundaries (don't count braces inside strings)
      if (char === '"' && !escapeNext) {
        inString = !inString;
        continue;
      }
      
      if (!inString) {
        if (char === '{' || char === '[') {
          if (depth === 0) {
            start = i;
            braceType = char as '{' | '[';
          }
          depth++;
        } else if ((char === '}' && braceType === '{') || (char === ']' && braceType === '[')) {
          depth--;
          if (depth === 0 && start !== -1) {
            const jsonCandidate = text.substring(start, i + 1);
            // Validate it's actually valid JSON
            if (isJSON(jsonCandidate)) {
              results.push({ start, end: i + 1, json: jsonCandidate });
            }
            start = -1;
            braceType = null;
          }
        }
      }
    }
    
    return results;
  };

  const renderTextSegment = (text: string, keyPrefix: string) => {
    const trimmed = text.trim();
    
    // Check if the entire text segment is a JSON object/array (not in code blocks)
    if ((trimmed.startsWith('{') && trimmed.endsWith('}')) || (trimmed.startsWith('[') && trimmed.endsWith(']'))) {
      if (isJSON(trimmed)) {
        // Render as a formatted JSON code block
        return (
          <div key={`${keyPrefix}-json`} className="relative">
            <div className="text-xs font-medium mb-1.5 px-2 py-1 rounded-t-md inline-block"
              style={{ 
                backgroundColor: 'color-mix(in srgb, var(--color-surface-panel) 80%, transparent)',
                color: 'var(--color-text-tertiary)',
                borderBottom: '1px solid var(--color-border-subtle)'
              }}
            >
              JSON
            </div>
            <pre
              className="code-block text-[var(--color-text-primary)] overflow-auto font-mono text-sm leading-relaxed rounded-md rounded-tl-none"
              style={{
                backgroundColor: 'color-mix(in srgb, var(--color-surface-panel) 60%, transparent)',
                border: '1px solid var(--color-border-subtle)',
                padding: '0.75rem',
                marginTop: '0',
              }}
            >
              <code className="whitespace-pre-wrap break-words">{formatJSON(trimmed)}</code>
            </pre>
          </div>
        );
      }
    }
    
    // Check for JSON objects/arrays embedded within text
    const jsonMatches = findJSONInText(text);
    if (jsonMatches.length > 0) {
      const parts: React.ReactNode[] = [];
      let lastIndex = 0;
      
      jsonMatches.forEach((match, idx) => {
        // Add text before JSON
        if (match.start > lastIndex) {
          const beforeText = text.substring(lastIndex, match.start);
          if (beforeText.trim()) {
            parts.push(
              <span key={`${keyPrefix}-before-${idx}`} className="text-[var(--color-text-secondary)]">
                {renderInline(beforeText, `${keyPrefix}-before-${idx}`)}
              </span>
            );
          }
        }
        
        // Add formatted JSON block
        parts.push(
          <div key={`${keyPrefix}-json-${idx}`} className="relative my-2">
            <div className="text-xs font-medium mb-1.5 px-2 py-1 rounded-t-md inline-block"
              style={{ 
                backgroundColor: 'color-mix(in srgb, var(--color-surface-panel) 80%, transparent)',
                color: 'var(--color-text-tertiary)',
                borderBottom: '1px solid var(--color-border-subtle)'
              }}
            >
              JSON
            </div>
            <pre
              className="code-block text-[var(--color-text-primary)] overflow-auto font-mono text-sm leading-relaxed rounded-md rounded-tl-none"
              style={{
                backgroundColor: 'color-mix(in srgb, var(--color-surface-panel) 60%, transparent)',
                border: '1px solid var(--color-border-subtle)',
                padding: '0.75rem',
                marginTop: '0',
              }}
            >
              <code className="whitespace-pre-wrap break-words">{formatJSON(match.json)}</code>
            </pre>
          </div>
        );
        
        lastIndex = match.end;
      });
      
      // Add remaining text after last JSON
      if (lastIndex < text.length) {
        const afterText = text.substring(lastIndex);
        if (afterText.trim()) {
          parts.push(
            <span key={`${keyPrefix}-after`} className="text-[var(--color-text-secondary)]">
              {renderInline(afterText, `${keyPrefix}-after`)}
            </span>
          );
        }
      }
      
      return <div key={keyPrefix}>{parts}</div>;
    }
    
    const calloutMatch = trimmed.match(/^(INFO|WARNING|WARN|ERROR):?\s*(.*)$/i);
    if (calloutMatch) {
      const level = calloutMatch[1].toLowerCase();
      const body = calloutMatch[2] || '';
      const bg =
        level.startsWith('err') ? 'validation-error' :
        level.startsWith('warn') ? 'validation-warning' :
        'validation-info';
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
    let numberedBuffer: Array<{ num: string; text: string }> = [];

    const flushBullets = () => {
      if (bulletBuffer.length) {
        nodes.push(
          <ul key={`${keyPrefix}-ul-${nodes.length}`} className="list-disc list-inside space-y-1.5 my-2 text-[var(--color-text-secondary)]">
            {bulletBuffer.map((item, idx) => (
              <li key={`${keyPrefix}-li-${idx}`} className="leading-relaxed">{renderInline(item.trim(), `${keyPrefix}-li-${idx}`)}</li>
            ))}
          </ul>
        );
        bulletBuffer = [];
      }
    };

    const flushNumbered = () => {
      if (numberedBuffer.length) {
        nodes.push(
          <ol key={`${keyPrefix}-ol-${nodes.length}`} className="list-decimal list-inside space-y-1.5 my-2 text-[var(--color-text-secondary)]">
            {numberedBuffer.map((item, idx) => (
              <li key={`${keyPrefix}-nli-${idx}`} className="leading-relaxed">{renderInline(item.text.trim(), `${keyPrefix}-nli-${idx}`)}</li>
            ))}
          </ol>
        );
        numberedBuffer = [];
      }
    };

    lines.forEach((line, idx) => {
      const trimmedLine = line.trim();
      
      // Check for headers (# ## ###)
      const headerMatch = trimmedLine.match(/^(#{1,3})\s+(.+)$/);
      if (headerMatch) {
        flushBullets();
        flushNumbered();
        const level = headerMatch[1].length;
        const text = headerMatch[2];
        const HeadingTag = `h${Math.min(level + 2, 6)}` as keyof JSX.IntrinsicElements;
        const sizeClass = level === 1 ? 'text-lg' : level === 2 ? 'text-base' : 'text-sm';
        nodes.push(
          <HeadingTag 
            key={`${keyPrefix}-h-${idx}`} 
            className={`${sizeClass} font-bold text-[var(--color-text-primary)] mt-3 mb-2 leading-tight`}
          >
            {renderInline(text, `${keyPrefix}-h-${idx}`)}
          </HeadingTag>
        );
        return;
      }
      
      // Check for numbered lists (1. 2. 3.)
      const numberedMatch = trimmedLine.match(/^(\d+)\.\s+(.+)$/);
      if (numberedMatch) {
        flushBullets();
        numberedBuffer.push({ num: numberedMatch[1], text: numberedMatch[2] });
        return;
      }
      
      // Check for bullet lists (- or *)
      if (/^\s*[-*]\s+/.test(line)) {
        flushNumbered();
        bulletBuffer.push(line.replace(/^\s*[-*]\s+/, ''));
        return;
      }
      
      // Empty line - flush buffers and add spacing
      if (trimmedLine === '') {
        flushBullets();
        flushNumbered();
        // Add a small spacer for paragraph breaks
        if (nodes.length > 0 && nodes[nodes.length - 1]) {
          nodes.push(<div key={`${keyPrefix}-space-${idx}`} className="h-2" />);
        }
        return;
      }
      
      // Regular text
      flushBullets();
      flushNumbered();
      nodes.push(
        <p key={`${keyPrefix}-p-${idx}`} className="text-[var(--color-text-secondary)] leading-relaxed mb-1">
          {renderInline(line, `${keyPrefix}-p-${idx}`)}
        </p>
      );
    });
    
    flushBullets();
    flushNumbered();

    if (!nodes.length) {
      return (
        <p key={`${keyPrefix}-plain`} className="text-[var(--color-text-secondary)] leading-relaxed">
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
  const [initializing, setInitializing] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedMessages, setExpandedMessages] = useState<Set<string>>(new Set());
  const [expandedThinking, setExpandedThinking] = useState<Set<string>>(new Set());
  const [tokenModeMessages, setTokenModeMessages] = useState<Set<string>>(new Set());
  const [showProposals, setShowProposals] = useState(false);
  const [quickMode, setQuickMode] = useState<'standard' | 'concise' | 'detailed'>('standard');
  const [currentMode, setCurrentMode] = useState<'concept' | 'architect' | 'auto'>(initialMode);
  const listRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);

  useEffect(() => {
    setError(null);
    setInitializing(true);
    setSession(null);
    setMessages([]);
    setProposals([]);
    
    // Use a special "general" projectId when no project is selected
    const effectiveProjectId = projectId || 'general';
    
    console.log('[Assistant] Starting unified session:', { projectId: effectiveProjectId, type: 'project', mode: currentMode });
    assistantAPI
      .startSession({ projectId: effectiveProjectId, type: 'project', mode: currentMode })
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
        
        // Set current mode from session metadata
        if (data.session?.metadata?.mode) {
          setCurrentMode(data.session.metadata.mode);
        }
        
        setInitializing(false);
        
        // For architect mode, automatically send a greeting to trigger the interview
        if ((currentMode === 'architect' || initialMode === 'architect') && data.messages.length === 0 && data.session?.id) {
          // Wait a moment for the session to be fully initialized, then send greeting
          setTimeout(async () => {
            try {
              const response = await assistantAPI.sendMessage(data.session.id, 'Hi! I\'m ready to create documentation for my game.', 'architect');
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
        const errorMessage = err instanceof Error ? err.message : 'Failed to start assistant session. Please check your connection and try again.';
        setError(errorMessage);
        setInitializing(false);
      });
  }, [projectId, currentMode, initialMode]); // Reinitialize when mode changes

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

  const handleSend = async (
    overrideMessage?: string,
    options?: { quickActionId?: string; modeOverride?: 'concept' | 'architect' | 'auto' }
  ) => {
    if (loading) return;
    if (!session?.id) return;

    const userMessage = (overrideMessage ?? input).trim();
    if (!userMessage) return;

    setLoading(true);
    setError(null);
    if (!overrideMessage) {
      setInput('');
    }
    
    // Add user message immediately for better UX
    const tempUserMessage = {
      id: crypto.randomUUID(),
      role: 'user' as const,
      content: userMessage,
      createdAt: new Date().toISOString(),
      metadata: options?.quickActionId ? { quickActionId: options.quickActionId } : undefined,
    };
    setMessages((prev) => [...prev, tempUserMessage]);
    
    try {
      const modeToUse = options?.modeOverride || currentMode;
      console.log('[Assistant] Sending message:', {
        sessionId: session.id,
        message: userMessage,
        mode: modeToUse,
        quickActionId: options?.quickActionId,
      });
      const response: any = await assistantAPI.sendMessage(
        session.id,
        userMessage,
        modeToUse,
        options?.quickActionId
      );
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
    const isGeneralMode = !projectId;

    const prompts: Record<string, string> = isGeneralMode ? {
      'summarize-analyze': `Help me get started with GameStory Lab. Explain:

1. What is the difference between mechanics and lore in game design?
2. How does the validation system work?
3. What's the typical workflow for creating a game concept?
4. Give me an example of a simple game concept I could create.

Provide clear, beginner-friendly explanations with examples.`,
      'propose-improvements': `I'm new to GameStory Lab and want to understand how to create my first game concept. Can you:

1. Walk me through the steps to create a project
2. Explain the difference between using AI generation vs templates
3. Give me tips for writing good prompts for AI generation
4. Show me what a complete game concept looks like

Make it practical and actionable for a beginner.`,
    } : {
      'summarize-analyze': `Summarize the current mechanics and lore, then run a full validation-style analysis:

1. Summarize the mechanics and lore in your own words.
2. Evaluate structure, balance, and completeness for both.
3. Provide a scoring-style assessment (0-100) with justification.
4. Call out blockers, inconsistencies, or missing elements explicitly.

Return the summary followed by the analysis with the score and recommendations.`,
      'propose-improvements': `Your goal is to improve the current concept so that validation scores move closer to 100%.

1. Identify the biggest issues that keep this concept from being production-ready.
2. Propose concrete lore and mechanic updates that address those issues.
3. Explain how the updates improve validation metrics (consistency, genre fit, completeness).
4. Prepare a concise change-list that could be turned into a proposal.

Focus on actionable improvements that meaningfully tighten the concept.`,
    };
    if (prompts[action]) {
      void handleSend(prompts[action], { quickActionId: action });
    }
  };

  const handleQuickActionTrigger = (action: QuickAction) => {
    if (action.type === 'message') {
      handleQuickAction(action.id);
      return;
    }
    if (action.type === 'refine' && action.focus && onRefine) {
      onRefine(action.focus);
    }
  };

  const isActionDisabled = (action: QuickAction) => {
    if (action.type === 'refine') {
      return refining || !onRefine;
    }
    return loading;
  };

  const getActionClassName = (action: QuickAction) => {
    const base = 'quick-action-pill flex-shrink-0 whitespace-nowrap transition';
    if (action.type === 'refine') {
      return `${base} border border-brand-800/60 bg-brand-900/30 text-brand-100 hover:bg-brand-900/50`;
    }
    return base;
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
    if (!session?.id) {
      setError('No active session. Please wait for the session to initialize.');
      return;
    }
    if (!proposalId) {
      setError('Proposal ID is missing.');
      return;
    }
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
       response = await assistantAPI.acceptProposal(session.id, proposalId) as any;
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
    if (!session?.id) {
      setError('No active session. Please wait for the session to initialize.');
      return;
    }
    if (!proposalId) {
      setError('Proposal ID is missing.');
      return;
    }
    try {
      await assistantAPI.dismissProposal(session.id, proposalId);
      setProposals((prev) => prev.filter((p) => p.id !== proposalId));
    } catch (err) {
      const msg = err instanceof Error ? err.message : (err as any)?.response?.data || 'Failed to reject proposal';
      setError(msg);
    }
  };

  const headerLabel = useMemo(() => {
    switch (currentMode) {
      case 'architect':
        return '🏗️ Architect Assistant';
      case 'concept':
        return '🎮 Concept Assistant';
      case 'auto':
      default:
        return '🤖 Unified Assistant';
    }
  }, [currentMode]);

  return (
    <div className="chat-container relative cq-panel w-full h-full flex flex-col min-h-0">
      {/* Full-height Assistant Card */}
      <div className="flex-1 flex flex-col min-h-0 overflow-hidden bg-surface chat-container assistant-card-glow assistant-transition shadow-lg">
        {/* Rich Header */}
        <div className="chat-header divider-glow">
          <div className="flex items-center justify-between mb-1">
            <div className="flex items-center gap-3">
              <div className="chat-avatar gradient-brand-to-br text-white shadow-lg" style={{ width: '40px', height: '40px', fontSize: '1rem' }}>
                AI
              </div>
              <div>
                <h3 className="text-lg font-bold text-primary">{headerLabel}</h3>
                <p className="text-xs text-secondary">
                  {session ? `Session ${session.id.slice(0, 8)}` : 'Connecting...'}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {/* Mode Switcher */}
              <select
                value={currentMode}
                onChange={(e) => {
                  const newMode = e.target.value as 'concept' | 'architect' | 'auto';
                  setCurrentMode(newMode);
                  // Update session mode on the server
                  if (session?.id) {
                    assistantAPI.updateSessionMode(session.id, newMode).catch(console.error);
                  }
                }}
                className="input text-xs px-2 py-1 bg-surface-strong border border-border-subtle text-secondary focus:outline-none focus:ring-2 focus:ring-brand-500"
                title="Switch assistant mode"
              >
                <option value="auto">🤖 Auto</option>
                <option value="concept">🎮 Concept</option>
                <option value="architect">🏗️ Architect</option>
              </select>
              
              <select
                value={quickMode}
                onChange={(e) => setQuickMode(e.target.value as 'standard' | 'concise' | 'detailed')}
                className="input text-xs px-2 py-1 bg-surface-strong border border-border-subtle text-secondary focus:outline-none focus:ring-2 focus:ring-brand-500"
              >
                <option value="standard">Standard</option>
                <option value="concise">Concise</option>
                <option value="detailed">Detailed</option>
              </select>
              {proposals.length > 0 && (
                <button
                  onClick={() => setShowProposals(!showProposals)}
                  className={`relative px-3 py-1.5 btn text-xs font-medium flex items-center gap-1.5 ${
                    showProposals
                      ? 'btn-primary'
                      : 'btn-primary animate-pulse'
                  }`}
                  title={`${proposals.length} proposal${proposals.length > 1 ? 's' : ''} ready for review`}
                >
                  <span>💡</span>
                  <span>Proposals</span>
                  <span className="notification-badge bg-[var(--color-danger)] -top-1 -right-1">
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
              {initializing ? (
                <div className="flex flex-col items-center justify-center h-full text-center px-4">
                  <div className="chat-avatar gradient-brand-to-br text-white mb-3 shadow-lg animate-pulse" style={{ width: '48px', height: '48px', fontSize: '1.125rem' }}>
                    AI
                  </div>
                  <h4 className="text-base font-semibold text-primary mb-1.5">
                    Initializing assistant...
                  </h4>
                  <p className="text-xs text-secondary max-w-md">
                    Setting up your session. This should only take a moment.
                  </p>
                </div>
              ) : error && messages.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-center px-4">
                  <div className="chat-avatar bg-[var(--color-danger)] text-white mb-3 shadow-lg" style={{ width: '48px', height: '48px', fontSize: '1.125rem' }}>
                    ⚠
                  </div>
                  <h4 className="text-base font-semibold text-[var(--color-danger)] mb-1.5">
                    Failed to start session
                  </h4>
                  <p className="text-xs text-[var(--color-danger)] max-w-md mb-3">
                    {error}
                  </p>
                  <button
                    onClick={() => {
                      setError(null);
                      setInitializing(true);
                      // Trigger re-initialization by updating a dependency
                      setCurrentMode(currentMode);
                    }}
                    className="px-4 py-2 text-sm bg-[var(--color-danger)]/20 hover:bg-[var(--color-danger)]/30 text-[var(--color-danger)] rounded-lg border border-[var(--color-danger)]/50 transition-colors"
                  >
                    Retry
                  </button>
                </div>
              ) : messages.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-center px-4">
                  <div className="chat-avatar gradient-brand-to-br text-white mb-3 shadow-lg" style={{ width: '48px', height: '48px', fontSize: '1.125rem' }}>
                    AI
                  </div>
                  <h4 className="text-base font-semibold text-primary mb-1.5">
                    Start a conversation
                  </h4>
                  <p className="text-xs text-secondary max-w-md">
                    {projectId 
                      ? "Ask me anything about your project. I can help refine mechanics, expand lore, check consistency, and more."
                      : "I'm here to help with game design, templates, workflows, and best practices. Ask me anything!"}
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
                        ? 'gradient-brand-to-br text-white'
                        : 'gradient-user-avatar text-white'
                    }`}>
                      {getInitials(msg.role)}
                    </div>
                    {/* Message Bubble */}
                    <div className={`flex-1 ${msg.role === 'user' ? 'flex flex-col items-end' : 'flex flex-col items-start'}`}>
                      <div
                        className={`chat-message-bubble relative shadow-sm ${
                          msg.role === 'assistant'
                            ? 'chat-message-assistant text-primary'
                            : 'chat-message-user text-white'
                        } ${tokenModeMessages.has(msg.id) ? 'token-mode' : ''}`}
                        style={msg.role === 'user' && !tokenModeMessages.has(msg.id) ? userBubbleStyle : tokenModeMessages.has(msg.id) ? {} : assistantBubbleStyle}
                      >
                        {/* Toggle Button */}
                        <button
                          onClick={() => {
                            setTokenModeMessages((prev) => {
                              const next = new Set(prev);
                              if (next.has(msg.id)) {
                                next.delete(msg.id);
                              } else {
                                next.add(msg.id);
                              }
                              return next;
                            });
                          }}
                          className="chat-message-token-toggle"
                          title={tokenModeMessages.has(msg.id) ? 'Switch to standard view' : 'Switch to token view'}
                        >
                          <svg
                            width="16"
                            height="16"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke={tokenModeMessages.has(msg.id) ? '#5A7850' : 'currentColor'}
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          >
                            <path d="M1 12s4-4 11-4 11 4 11 4-4 4-11 4-11-4-11-4z" />
                            <circle cx="12" cy="12" r="3" />
                          </svg>
                        </button>

                        {/* Content Wrapper - Handles the cross-fade */}
                        <div className="chat-message-lens-layer">
                          {(() => {
                            const segments = parseSegments(msg.content);
                            const isLong = msg.content.length > 1200;
                            const isExpanded = expandedMessages.has(msg.id);
                            const isTokenMode = tokenModeMessages.has(msg.id);
                            
                            return (
                              <>
                                {/* Layer 1: Standard Markdown (Fade out when Token Mode is active) */}
                                <div className={`standard-content ${isTokenMode ? 'hidden' : ''}`}>
                                  <div
                                    className={`space-y-2 ${isLong && !isExpanded ? 'max-h-[380px] overflow-hidden pr-1.5' : ''}`}
                                  >
                                    {segments.map((segment, idx) =>
                                      segment.type === 'code' ? (
                                        <div key={`${msg.id}-code-${idx}`} className="relative">
                                          {segment.lang && (
                                            <div className="text-xs font-medium mb-1.5 px-2 py-1 rounded-t-md inline-block"
                                              style={{ 
                                                backgroundColor: 'color-mix(in srgb, var(--color-surface-panel) 80%, transparent)',
                                                color: 'var(--color-text-tertiary)',
                                                borderBottom: '1px solid var(--color-border-subtle)'
                                              }}
                                            >
                                              {segment.lang.toUpperCase()}
                                            </div>
                                          )}
                                          <pre
                                            className="code-block text-[var(--color-text-primary)] overflow-auto font-mono text-sm leading-relaxed rounded-md"
                                            style={{
                                              backgroundColor: 'color-mix(in srgb, var(--color-surface-panel) 60%, transparent)',
                                              border: '1px solid var(--color-border-subtle)',
                                              padding: segment.lang ? '0.75rem' : '0.75rem',
                                              marginTop: segment.lang ? '0' : '0',
                                            }}
                                          >
                                            <code className="whitespace-pre-wrap break-words">{segment.content}</code>
                                          </pre>
                                        </div>
                                      ) : (
                                        <div key={`${msg.id}-text-${idx}`} className="space-y-2">
                                          {renderTextSegment(segment.content, `${msg.id}-t-${idx}`)}
                                        </div>
                                      )
                                    )}
                                  </div>
                                  {isLong && !isExpanded && (
                                    <div className="absolute inset-x-0 bottom-0 h-20 pointer-events-none rounded-b-lg" style={{ background: 'linear-gradient(to top, color-mix(in srgb, var(--color-bg-primary) 50%, transparent) 0%, color-mix(in srgb, var(--color-bg-primary) 20%, transparent) 50%, transparent 100%)' }} />
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
                                        className="btn btn-secondary btn-xs"
                                      >
                                        {isExpanded ? 'Collapse' : 'Expand'}
                                      </button>
                                    </div>
                                  )}
                                </div>

                                {/* Layer 2: Token Prism (Fade in when active) */}
                                <div className={`token-content ${!isTokenMode ? 'hidden' : ''}`}>
                                  <TokenPrism content={msg.content} isVisible={isTokenMode} />
                                </div>
                              </>
                            );
                          })()}
                        </div>
                      </div>
                      {/* Thinking Block - Collapsible (only for assistant messages) */}
                      {msg.role === 'assistant' && msg.metadata?.thinking && (
                        <div className="mt-3 pt-3 border-t" style={{ borderColor: 'var(--color-border-subtle)' }}>
                          <button
                            onClick={() => {
                              setExpandedThinking((prev) => {
                                const next = new Set(prev);
                                if (next.has(msg.id)) {
                                  next.delete(msg.id);
                                } else {
                                  next.add(msg.id);
                                }
                                return next;
                              });
                            }}
                            className="flex items-center gap-2 w-full text-left text-xs transition-all duration-200 rounded-md px-2 py-1.5 hover:bg-surface-panel/30"
                            style={{ 
                              color: 'var(--color-text-secondary)',
                            }}
                            onMouseEnter={(e) => {
                              e.currentTarget.style.color = 'var(--color-text-primary)';
                            }}
                            onMouseLeave={(e) => {
                              e.currentTarget.style.color = 'var(--color-text-secondary)';
                            }}
                          >
                            <svg
                              className={`w-3.5 h-3.5 transition-transform duration-200 ${expandedThinking.has(msg.id) ? 'rotate-90' : ''}`}
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                            </svg>
                            <span className="font-medium flex items-center gap-1.5">
                              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                              </svg>
                              {expandedThinking.has(msg.id) ? 'Hide' : 'Show'} Reasoning
                            </span>
                            <span className="ml-auto text-[10px] font-normal opacity-70" style={{ color: 'var(--color-text-tertiary)' }}>
                              {Math.round(msg.metadata.thinking.length / 100) / 10}k chars
                            </span>
                          </button>
                          {expandedThinking.has(msg.id) && (
                            <div 
                              className="mt-2 p-4 rounded-lg border overflow-hidden"
                              style={{ 
                                backgroundColor: 'color-mix(in srgb, var(--color-surface-panel) 70%, transparent)',
                                borderColor: 'var(--color-border-subtle)',
                              }}
                            >
                              <div className="flex items-center gap-2 mb-2 pb-2 border-b" style={{ borderColor: 'var(--color-border-subtle)' }}>
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" style={{ color: 'var(--color-text-tertiary)' }}>
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                                </svg>
                                <span className="text-xs font-semibold uppercase tracking-wide" style={{ color: 'var(--color-text-tertiary)' }}>
                                  AI Reasoning Process
                                </span>
                              </div>
                              <div 
                                className="text-xs leading-relaxed whitespace-pre-wrap font-mono max-h-[400px] overflow-y-auto"
                                style={{ 
                                  color: 'var(--color-text-secondary)',
                                  lineHeight: '1.7',
                                }}
                              >
                                {msg.metadata.thinking}
                              </div>
                            </div>
                          )}
                        </div>
                      )}
                      {msg.createdAt && (
                        <div className={`text-xs text-secondary mt-0.5 px-1 ${
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
                  <div className="flex-1">
                    <ThinkingIndicator />
                  </div>
                </div>
              )}
            </div>

            {/* Composer - Always Visible */}
            <div className="chat-input-area shadow-lg">
              {error && (
                <div className="px-4 pt-2">
                  <div className="validation-error text-sm rounded-md px-3 py-2 flex items-start justify-between gap-2">
                    <div className="flex-1">
                      <p className="font-semibold mb-1">Error sending message</p>
                      <p className="text-xs">{error}</p>
                      <p className="text-xs mt-1 opacity-75">Check the browser console (F12) for more details.</p>
                    </div>
                    <button
                      onClick={() => setError(null)}
                      className="text-[var(--color-danger)] hover:text-[var(--color-danger)]/80 flex-shrink-0"
                      title="Dismiss error"
                    >
                      ✕
                    </button>
                  </div>
                </div>
              )}
              
              {/* Quick Actions */}
              <div className="px-4 pt-2 pb-1.5">
                <div className="flex gap-2 overflow-x-auto pb-1 -mx-1 px-1">
                  {quickActions.map((action) => (
                    <button
                      key={action.id}
                      onClick={() => handleQuickActionTrigger(action)}
                      disabled={isActionDisabled(action)}
                      className={`${getActionClassName(action)} ${
                        isActionDisabled(action) ? 'opacity-60 cursor-not-allowed' : ''
                      }`}
                    >
                      {action.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Input Area */}
              <div className="px-4 pb-3">
                <div className="flex gap-2 items-end">
                  <button
                    className="btn btn-secondary flex-shrink-0 w-10 h-10 opacity-50 cursor-not-allowed"
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
                        void handleSend();
                      }
                    }}
                    placeholder="Ask for help..."
                    rows={1}
                    className="input flex-1 resize-none border border-border-subtle px-4 py-2.5 text-sm bg-surface-elevated text-primary placeholder:text-secondary focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent max-h-[120px]"
                  />
                  <button
                    onClick={() => void handleSend()}
                    disabled={!input.trim() || loading}
                    className="btn btn-primary flex-shrink-0 px-6 py-2.5 font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
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
                <h4 className="text-sm font-semibold text-primary">
                  Proposals ({proposals.length})
                </h4>
                <button
                  onClick={() => setShowProposals(false)}
                  className="text-secondary hover:text-primary"
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
                      <div className="mb-3 px-3 py-1.5 badge-lg gradient-brand-primary text-white text-center">
                        ⭐ Most Recent Proposal
                      </div>
                    )}
                    <p className="font-medium text-primary mb-2">
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
                      <div className="mb-3 p-2 validation-info rounded">
                        <p className="text-xs font-semibold text-[var(--color-text-primary)] mb-1">Documents to create/update:</p>
                        <ul className="text-xs text-[var(--color-text-secondary)] space-y-1">
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
                      <div className="mb-3 p-2 validation-success rounded">
                        <p className="text-xs font-semibold text-[var(--color-text-primary)] mb-1">Will update:</p>
                        <div className="text-xs text-[var(--color-text-secondary)] space-y-1">
                          {proposal.payload?.mechanics && (
                            <div className="flex items-center gap-1">
                              <span>⚙️</span>
                              <span>Mechanics ({Object.keys(proposal.payload.mechanics).length} fields)</span>
                              {Object.keys(proposal.payload.mechanics).length === 0 && (
                                <span className="text-[var(--color-danger)] ml-2">⚠️ Empty!</span>
                              )}
                            </div>
                          )}
                          {proposal.payload?.lore && (
                            <div className="flex items-center gap-1">
                              <span>📖</span>
                              <span>Lore ({Object.keys(proposal.payload.lore).length} fields)</span>
                              {Object.keys(proposal.payload.lore).length === 0 && (
                                <span className="text-[var(--color-danger)] ml-2">⚠️ Empty!</span>
                              )}
                            </div>
                          )}
                          {(!proposal.payload?.mechanics || Object.keys(proposal.payload.mechanics).length === 0) &&
                           (!proposal.payload?.lore || Object.keys(proposal.payload.lore).length === 0) && (
                            <div className="text-[var(--color-danger)] font-semibold mt-2 p-2 validation-error rounded">
                              ⚠️ WARNING: This proposal has no mechanics or lore content! Accepting it will not create a new version.
                            </div>
                          )}
                        </div>
                      </div>
                    )}

                    {proposal.changeLog?.length > 0 && (
                      <div className="mb-3 space-y-1">
                        <p className="text-xs font-semibold text-secondary mb-1">Changes:</p>
                          {proposal.changeLog.slice(0, 3).map((change) => (
                          <div key={change.field} className="text-xs text-secondary flex items-start gap-1">
                            <span>
                              {change.changeType === 'added' ? '➕' :
                               change.changeType === 'modified' ? '✏️' :
                               change.changeType === 'removed' ? '❌' : '📝'}
                            </span>
                            <span className="font-semibold">{change.field}</span>
                          </div>
                        ))}
                        {proposal.changeLog.length > 3 && (
                          <p className="text-xs text-tertiary">+{proposal.changeLog.length - 3} more</p>
                        )}
                      </div>
                    )}

                    <div className="flex gap-2 mt-4">
                      <button
                        onClick={() => handleAccept(proposal.id)}
                        className="flex-1 btn btn-primary btn-xs font-medium"
                      >
                        ✅ Accept
                      </button>
                      <button
                        onClick={() => handleReject(proposal.id)}
                        className="btn btn-secondary btn-xs font-medium"
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
