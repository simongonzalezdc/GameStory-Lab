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
      <div className="fixed z-50 pointer-events-none inset-0 flex items-center justify-center p-4">
        <div
          className={`bg-white rounded-xl shadow-2xl max-w-lg w-full p-6 pointer-events-auto ${
            step?.position === 'center' ? '' : getPositionClass(step, targetRect)
          }`}
          style={getPositionStyle(step, targetRect)}
        >
          {/* Header */}
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-forest-500 text-white rounded-full flex items-center justify-center font-bold text-sm">
                {currentStep + 1}
              </div>
              <h2 className="text-xl font-bold text-gray-900">{step?.title}</h2>
            </div>
            <button
              onClick={handleSkip}
              className="text-gray-400 hover:text-gray-600 transition"
              title="Skip tutorial"
            >
              ✕
            </button>
          </div>

          {/* Description */}
          <p className="text-gray-700 mb-6 leading-relaxed">{step?.description}</p>

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

          {/* Navigation buttons */}
          <div className="flex items-center justify-between">
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
 */
function getPositionStyle(
  step: TutorialStep | undefined,
  targetRect: DOMRect | null
): CSSProperties {
  if (!step?.position || !targetRect || step.position === 'center') {
    return {};
  }

  const padding = 24; // Distance from target element
  const isMobile = window.innerWidth < 768; // Mobile breakpoint
  const viewportWidth = window.innerWidth;
  const viewportHeight = window.innerHeight;
  
  // On mobile, prefer bottom or center positioning to avoid overflow
  const preferredPosition = isMobile ? 'bottom' : step.position;

  switch (preferredPosition) {
    case 'top':
      return {
        left: `${Math.max(padding, Math.min(targetRect.left + targetRect.width / 2, viewportWidth - padding))}px`,
        top: `${Math.max(padding, targetRect.top - padding)}px`,
        transform: 'translate(-50%, -100%)',
        maxWidth: `${viewportWidth - padding * 2}px`,
      };

    case 'bottom':
      return {
        left: `${Math.max(padding, Math.min(targetRect.left + targetRect.width / 2, viewportWidth - padding))}px`,
        top: `${Math.min(viewportHeight - padding, targetRect.bottom + padding)}px`,
        transform: 'translateX(-50%)',
        maxWidth: `${viewportWidth - padding * 2}px`,
      };

    case 'left':
      return {
        left: `${Math.max(padding, targetRect.left - padding)}px`,
        top: `${Math.max(padding, Math.min(targetRect.top + targetRect.height / 2, viewportHeight - padding))}px`,
        transform: 'translate(-100%, -50%)',
        maxWidth: `${Math.min(300, viewportWidth - padding * 2)}px`,
      };

    case 'right':
      return {
        left: `${Math.min(viewportWidth - padding, targetRect.right + padding)}px`,
        top: `${Math.max(padding, Math.min(targetRect.top + targetRect.height / 2, viewportHeight - padding))}px`,
        transform: 'translateY(-50%)',
        maxWidth: `${Math.min(300, viewportWidth - padding * 2)}px`,
      };

    default:
      return {
        maxWidth: `${viewportWidth - padding * 2}px`,
      };
  }
}
