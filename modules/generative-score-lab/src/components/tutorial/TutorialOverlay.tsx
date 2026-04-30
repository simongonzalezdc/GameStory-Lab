/**
 * Tutorial overlay component
 * Displays step-by-step tutorial with spotlight highlighting
 */

import { useEffect, useState, useCallback, CSSProperties } from 'react';
import { useTutorialStore } from '@/stores/tutorial-store';
import { tutorialSteps, TutorialStep } from './tutorial-steps';
import { Button } from '../ui/Button';
import { ConfirmDialog } from '../ui/ConfirmDialog';

export default function TutorialOverlay() {
  const {
    isActive,
    currentStep,
    nextStep,
    previousStep,
    skipTutorial,
    completeTutorial,
  } = useTutorialStore();

  const [targetRect, setTargetRect] = useState<DOMRect | null>(null);
  const [showSkipConfirm, setShowSkipConfirm] = useState(false);

  const step = tutorialSteps[currentStep];
  const isFirstStep = currentStep === 0;
  const isLastStep = currentStep === tutorialSteps.length - 1;

  // Update target element position
  useEffect(() => {
    if (!step?.targetElement) {
      setTargetRect(null);
      return;
    }

    const updateTargetRect = () => {
      const element = document.querySelector(step.targetElement!);
      if (element) {
        setTargetRect(element.getBoundingClientRect());
      }
    };

    updateTargetRect();

    // Update on window resize
    window.addEventListener('resize', updateTargetRect);
    window.addEventListener('scroll', updateTargetRect);

    // Also update after a short delay in case elements are loading
    const timeout = setTimeout(updateTargetRect, 100);

    return () => {
      window.removeEventListener('resize', updateTargetRect);
      window.removeEventListener('scroll', updateTargetRect);
      clearTimeout(timeout);
    };
  }, [step?.targetElement]);

  const handleNext = useCallback(() => {
    if (isLastStep) {
      completeTutorial();
    } else {
      nextStep();
    }
  }, [isLastStep, completeTutorial, nextStep]);

  const handleSkip = useCallback(() => {
    setShowSkipConfirm(true);
  }, []);

  const handleConfirmSkip = useCallback(() => {
    skipTutorial();
    setShowSkipConfirm(false);
  }, [skipTutorial]);

  if (!isActive) return null;

  return (
    <>
      <ConfirmDialog
        open={showSkipConfirm}
        onOpenChange={setShowSkipConfirm}
        title="Skip Tutorial"
        description="Are you sure you want to skip the tutorial? You can restart it later from the help menu."
        onConfirm={handleConfirmSkip}
        confirmLabel="Skip Tutorial"
        variant="default"
      />
      {/* Backdrop with spotlight effect */}
      <div className="fixed inset-0 z-50 pointer-events-none">
        <svg className="w-full h-full" style={{ pointerEvents: 'none' }}>
          <defs>
            <mask id="spotlight-mask">
              <rect x="0" y="0" width="100%" height="100%" fill="white" />
              {targetRect && (
                <rect
                  x={targetRect.left - 8}
                  y={targetRect.top - 8}
                  width={targetRect.width + 16}
                  height={targetRect.height + 16}
                  rx="8"
                  fill="black"
                />
              )}
            </mask>
          </defs>
          <rect
            x="0"
            y="0"
            width="100%"
            height="100%"
            fill="rgba(0, 0, 0, 0.7)"
            mask="url(#spotlight-mask)"
            style={{ pointerEvents: 'auto' }}
          />
        </svg>

        {/* Highlight border around target */}
        {targetRect && (
          <div
            className="absolute border-4 border-forest-500 rounded-lg pointer-events-none animate-pulse"
            style={{
              left: `${targetRect.left - 8}px`,
              top: `${targetRect.top - 8}px`,
              width: `${targetRect.width + 16}px`,
              height: `${targetRect.height + 16}px`,
            }}
          />
        )}
      </div>

      {/* Tutorial content card */}
      <div className="fixed z-50 pointer-events-none inset-0 flex items-center justify-center p-4 overflow-auto">
        <div
          className={`bg-white rounded-xl shadow-2xl max-w-lg w-full p-6 pointer-events-auto flex flex-col ${
            step?.position === 'center' ? '' : getPositionClass(step, targetRect)
          }`}
          style={{
            ...getPositionStyle(step, targetRect),
            maxHeight: `${Math.min(window.innerHeight - 32, 600)}px`,
            maxWidth: `${Math.min(window.innerWidth - 32, 500)}px`,
          }}
          role="dialog"
          aria-labelledby="tutorial-title"
          aria-describedby="tutorial-description"
        >
          {/* Header */}
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-forest-500 text-white rounded-full flex items-center justify-center font-bold text-sm">
                {currentStep + 1}
              </div>
              <h2 id="tutorial-title" className="text-xl font-bold text-gray-900">{step?.title}</h2>
            </div>
            <button
              onClick={handleSkip}
              className="text-gray-400 hover:text-gray-600 transition"
              title="Skip tutorial"
            >
              ✕
            </button>
          </div>

          {/* Scrollable content area */}
          <div className="flex-1 overflow-y-auto min-h-0 mb-6">
            {/* Description */}
            <p id="tutorial-description" className="text-gray-700 mb-6 leading-relaxed">{step?.description}</p>

            {/* Progress bar */}
            <div className="mb-6">
              <div className="flex justify-between text-xs text-gray-500 mb-2">
                <span>Progress</span>
                <span>
                  {currentStep + 1} / {tutorialSteps.length}
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className="bg-forest-500 h-2 rounded-full transition-all duration-300"
                  style={{
                    width: `${((currentStep + 1) / tutorialSteps.length) * 100}%`,
                  }}
                />
              </div>
            </div>
          </div>

          {/* Navigation buttons - always visible at bottom */}
          <div className="flex items-center justify-between flex-shrink-0 pt-4 border-t border-gray-200">
            <Button
              onClick={previousStep}
              variant="secondary"
              size="sm"
              disabled={isFirstStep}
            >
              Previous
            </Button>

            <div className="flex gap-2">
              <Button onClick={handleSkip} variant="ghost" size="sm">
                Skip Tutorial
              </Button>
              <Button onClick={handleNext} size="sm">
                {isLastStep ? 'Finish' : step?.actionLabel || 'Next'}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

/**
 * Get position class based on target element
 */
function getPositionClass(step: TutorialStep | undefined, targetRect: DOMRect | null): string {
  if (!step?.position || !targetRect || step.position === 'center') {
    return '';
  }

  return 'absolute';
}

/**
 * Get position style based on target element
 * Responsive positioning for mobile viewports
 * Ensures the tutorial card always stays within viewport bounds
 */
function getPositionStyle(
  step: TutorialStep | undefined,
  targetRect: DOMRect | null
): CSSProperties {
  if (!step?.position || !targetRect || step.position === 'center') {
    return {};
  }

  const padding = 24; // Distance from target element
  const estimatedCardHeight = 300; // Estimated card height (will be constrained by maxHeight)
  const estimatedCardWidth = 400; // Estimated card width
  const isMobile = window.innerWidth < 768; // Mobile breakpoint
  const viewportWidth = window.innerWidth;
  const viewportHeight = window.innerHeight;
  
  // On mobile, prefer bottom or center positioning to avoid overflow
  const preferredPosition = isMobile ? 'bottom' : step.position;

  // Calculate safe positioning that keeps the card within bounds
  switch (preferredPosition) {
    case 'top': {
      // Position above target, but ensure it doesn't go above viewport
      const centerX = targetRect.left + targetRect.width / 2;
      const maxCardWidth = Math.min(estimatedCardWidth, viewportWidth - padding * 2);
      
      // Calculate left position ensuring card (with -50% transform) stays in bounds
      // After transform, card extends left by maxCardWidth/2 and right by maxCardWidth/2
      const left = Math.max(
        padding + maxCardWidth / 2,
        Math.min(centerX, viewportWidth - padding - maxCardWidth / 2)
      );
      
      // Calculate top position ensuring card (with -100% transform) stays in bounds
      // After transform, card extends upward by full height
      const desiredTop = targetRect.top - padding;
      const minTop = padding + estimatedCardHeight; // Card needs this much space above
      const cardTop = Math.max(minTop, desiredTop);
      
      // If card would still go out of bounds, position it below target instead
      if (cardTop - estimatedCardHeight < padding) {
        return {
          left: `${left}px`,
          top: `${targetRect.bottom + padding}px`,
          transform: 'translateX(-50%)',
          maxWidth: `${maxCardWidth}px`,
        };
      }
      
      return {
        left: `${left}px`,
        top: `${cardTop}px`,
        transform: 'translate(-50%, -100%)',
        maxWidth: `${maxCardWidth}px`,
      };
    }

    case 'bottom': {
      // Position below target, but ensure it doesn't go below viewport
      const centerX = targetRect.left + targetRect.width / 2;
      const maxCardWidth = Math.min(estimatedCardWidth, viewportWidth - padding * 2);
      
      // Calculate left position ensuring card (with -50% transform) stays in bounds
      const left = Math.max(
        padding + maxCardWidth / 2,
        Math.min(centerX, viewportWidth - padding - maxCardWidth / 2)
      );
      
      // Calculate top position ensuring card stays within viewport
      const desiredTop = targetRect.bottom + padding;
      const maxTop = viewportHeight - estimatedCardHeight - padding;
      const cardTop = Math.min(desiredTop, maxTop);
      
      // If card would go out of bounds, position it above target instead
      if (cardTop + estimatedCardHeight > viewportHeight - padding) {
        return {
          left: `${left}px`,
          top: `${Math.max(padding, targetRect.top - padding - estimatedCardHeight)}px`,
          transform: 'translate(-50%, -100%)',
          maxWidth: `${maxCardWidth}px`,
        };
      }
      
      return {
        left: `${left}px`,
        top: `${cardTop}px`,
        transform: 'translateX(-50%)',
        maxWidth: `${maxCardWidth}px`,
      };
    }

    case 'left': {
      // Position to the left of target, but ensure it doesn't go off left edge
      const centerY = targetRect.top + targetRect.height / 2;
      const maxCardWidth = Math.min(300, viewportWidth - padding * 2);
      
      // Calculate left position ensuring card (with -100% transform) stays in bounds
      // After transform, card extends left by full width
      const desiredLeft = targetRect.left - padding;
      const minLeft = padding + maxCardWidth; // Card needs this much space to the left
      const cardLeft = Math.max(minLeft, desiredLeft);
      
      // Calculate top position ensuring card (with -50% transform) stays in bounds
      const top = Math.max(
        padding + estimatedCardHeight / 2,
        Math.min(centerY, viewportHeight - padding - estimatedCardHeight / 2)
      );
      
      // If card would go out of bounds, position it to the right instead
      if (cardLeft - maxCardWidth < padding) {
        return {
          left: `${Math.min(viewportWidth - padding, targetRect.right + padding)}px`,
          top: `${top}px`,
          transform: 'translateY(-50%)',
          maxWidth: `${maxCardWidth}px`,
        };
      }
      
      return {
        left: `${cardLeft}px`,
        top: `${top}px`,
        transform: 'translate(-100%, -50%)',
        maxWidth: `${maxCardWidth}px`,
      };
    }

    case 'right': {
      // Position to the right of target, but ensure it doesn't go off right edge
      const centerY = targetRect.top + targetRect.height / 2;
      const maxCardWidth = Math.min(300, viewportWidth - padding * 2);
      
      // Calculate left position ensuring card stays within viewport
      const desiredLeft = targetRect.right + padding;
      const maxLeft = viewportWidth - maxCardWidth - padding;
      const cardLeft = Math.min(desiredLeft, maxLeft);
      
      // Calculate top position ensuring card (with -50% transform) stays in bounds
      const top = Math.max(
        padding + estimatedCardHeight / 2,
        Math.min(centerY, viewportHeight - padding - estimatedCardHeight / 2)
      );
      
      // If card would go out of bounds, position it to the left instead
      if (cardLeft + maxCardWidth > viewportWidth - padding) {
        return {
          left: `${Math.max(padding, targetRect.left - padding - maxCardWidth)}px`,
          top: `${top}px`,
          transform: 'translate(-100%, -50%)',
          maxWidth: `${maxCardWidth}px`,
        };
      }
      
      return {
        left: `${cardLeft}px`,
        top: `${top}px`,
        transform: 'translateY(-50%)',
        maxWidth: `${maxCardWidth}px`,
      };
    }

    default:
      return {
        maxWidth: `${viewportWidth - padding * 2}px`,
      };
  }
}
