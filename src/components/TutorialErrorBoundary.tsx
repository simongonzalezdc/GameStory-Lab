/**
 * Error boundary specifically for tutorial to prevent auto-start loop
 */

import React, { Component, ReactNode } from 'react';
import { errorHandler, ErrorSeverity } from '@/lib/errors/error-handler';
import { useTutorialStore } from '@/stores/tutorial-store';

interface TutorialErrorBoundaryProps {
  children: ReactNode;
}

interface TutorialErrorBoundaryState {
  hasError: boolean;
}

export class TutorialErrorBoundary extends Component<
  TutorialErrorBoundaryProps,
  TutorialErrorBoundaryState
> {
  constructor(props: TutorialErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(): TutorialErrorBoundaryState {
    return { hasError: true };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo): void {
    errorHandler.handle(
      error,
      'Tutorial Error Boundary',
      ErrorSeverity.ERROR
    );
    
    // Mark tutorial as completed to prevent auto-start loop
    // Use getState() to access store outside of React component
    try {
      const tutorialStore = useTutorialStore.getState();
      if (tutorialStore && typeof tutorialStore.completeTutorial === 'function') {
        tutorialStore.completeTutorial();
      }
    } catch (storeError) {
      // If store access fails, at least log the error
      console.error('Failed to mark tutorial as complete:', storeError);
    }
    
    console.error('Tutorial error caught:', error, errorInfo);
  }

  render(): ReactNode {
    if (this.state.hasError) {
      // Silently fail - tutorial just won't show
      return null;
    }

    return this.props.children;
  }
}
