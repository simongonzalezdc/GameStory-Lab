'use client';

import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { CheckCircle2, Sparkles, FileSearch, Megaphone, Rocket, Scale, ArrowRight } from 'lucide-react';

interface OnboardingProps {
  onComplete: () => void;
}

const ONBOARDING_KEY = 'shiplab-onboarding-completed';

export function OnboardingFlow({ onComplete }: OnboardingProps) {
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState(0);

  useEffect(() => {
    const hasCompletedOnboarding = localStorage.getItem(ONBOARDING_KEY);
    if (!hasCompletedOnboarding) {
      setOpen(true);
    }
  }, []);

  const steps = [
    {
      title: 'Welcome to ShipLab! 🚀',
      description: 'Your AI-powered post-production toolkit for developers',
      content: (
        <div className="space-y-4">
          <p className="text-muted-foreground">
            ShipLab transforms your finished code into shipped products with AI-powered tools for:
          </p>
          <div className="grid gap-3">
            <div className="flex items-start gap-3">
              <CheckCircle2 className="h-5 w-5 text-green-500 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-medium">Code Quality Analysis</p>
                <p className="text-sm text-muted-foreground">ESLint and Semgrep scanning</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <CheckCircle2 className="h-5 w-5 text-green-500 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-medium">Documentation Generation</p>
                <p className="text-sm text-muted-foreground">README and API docs with AI</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <CheckCircle2 className="h-5 w-5 text-green-500 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-medium">Marketing Content</p>
                <p className="text-sm text-muted-foreground">Landing pages, social media, Product Hunt</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <CheckCircle2 className="h-5 w-5 text-green-500 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-medium">Deployment Configs</p>
                <p className="text-sm text-muted-foreground">Vercel, Docker, Railway ready</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <CheckCircle2 className="h-5 w-5 text-green-500 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-medium">License Assistant</p>
                <p className="text-sm text-muted-foreground">Choose the right license with AI guidance</p>
              </div>
            </div>
          </div>
        </div>
      ),
    },
    {
      title: 'Getting Started',
      description: 'Three simple steps to ship faster',
      content: (
        <div className="space-y-4">
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center gap-2">
                <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary text-primary-foreground font-bold">
                  1
                </div>
                <CardTitle className="text-base">Create a Project</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Add your existing project by providing the local path. ShipLab will analyze it automatically.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center gap-2">
                <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary text-primary-foreground font-bold">
                  2
                </div>
                <CardTitle className="text-base">Use AI Tools</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Run quality analysis, generate documentation, create marketing content, and more - all powered by AI.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center gap-2">
                <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary text-primary-foreground font-bold">
                  3
                </div>
                <CardTitle className="text-base">Ship Your Product</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Get deployment configs, marketing materials, and everything you need to launch successfully.
              </p>
            </CardContent>
          </Card>
        </div>
      ),
    },
    {
      title: 'Key Features',
      description: 'Explore what ShipLab can do for you',
      content: (
        <div className="grid grid-cols-2 gap-3">
          <Card className="border-2">
            <CardHeader className="pb-3">
              <FileSearch className="h-8 w-8 text-primary mb-2" />
              <CardTitle className="text-sm">Quality Analysis</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-xs text-muted-foreground">
                Find bugs and code issues with ESLint and Semgrep
              </p>
            </CardContent>
          </Card>

          <Card className="border-2">
            <CardHeader className="pb-3">
              <Sparkles className="h-8 w-8 text-primary mb-2" />
              <CardTitle className="text-sm">AI Chat</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-xs text-muted-foreground">
                Get instant answers about your project
              </p>
            </CardContent>
          </Card>

          <Card className="border-2">
            <CardHeader className="pb-3">
              <Megaphone className="h-8 w-8 text-primary mb-2" />
              <CardTitle className="text-sm">Marketing</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-xs text-muted-foreground">
                Generate landing pages and social content
              </p>
            </CardContent>
          </Card>

          <Card className="border-2">
            <CardHeader className="pb-3">
              <Rocket className="h-8 w-8 text-primary mb-2" />
              <CardTitle className="text-sm">Deployment</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-xs text-muted-foreground">
                Get configs for Vercel, Docker, and Railway
              </p>
            </CardContent>
          </Card>

          <Card className="border-2">
            <CardHeader className="pb-3">
              <Scale className="h-8 w-8 text-primary mb-2" />
              <CardTitle className="text-sm">Licensing</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-xs text-muted-foreground">
                Choose the right license with AI guidance
              </p>
            </CardContent>
          </Card>

          <Card className="border-2">
            <CardHeader className="pb-3">
              <CheckCircle2 className="h-8 w-8 text-primary mb-2" />
              <CardTitle className="text-sm">Documentation</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-xs text-muted-foreground">
                Auto-generate README and API docs
              </p>
            </CardContent>
          </Card>
        </div>
      ),
    },
  ];

  const handleNext = () => {
    if (step < steps.length - 1) {
      setStep(step + 1);
    } else {
      handleComplete();
    }
  };

  const handleSkip = () => {
    handleComplete();
  };

  const handleComplete = () => {
    localStorage.setItem(ONBOARDING_KEY, 'true');
    setOpen(false);
    onComplete();
  };

  const currentStep = steps[step];

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl">{currentStep.title}</DialogTitle>
          <DialogDescription className="text-base">{currentStep.description}</DialogDescription>
        </DialogHeader>

        <div className="py-4">{currentStep.content}</div>

        <div className="flex items-center justify-between pt-4 border-t">
          <div className="flex gap-1">
            {steps.map((_, index) => (
              <div
                key={index}
                className={`h-2 w-2 rounded-full ${
                  index === step ? 'bg-primary' : 'bg-muted'
                }`}
              />
            ))}
          </div>

          <div className="flex gap-2">
            <Button variant="ghost" onClick={handleSkip}>
              Skip
            </Button>
            <Button onClick={handleNext}>
              {step < steps.length - 1 ? (
                <>
                  Next <ArrowRight className="ml-2 h-4 w-4" />
                </>
              ) : (
                'Get Started'
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// Hook to check if onboarding is completed
export function useOnboarding() {
  const [hasCompletedOnboarding, setHasCompletedOnboarding] = useState(true);

  useEffect(() => {
    const completed = localStorage.getItem(ONBOARDING_KEY);
    setHasCompletedOnboarding(!!completed);
  }, []);

  const resetOnboarding = () => {
    localStorage.removeItem(ONBOARDING_KEY);
    setHasCompletedOnboarding(false);
  };

  return { hasCompletedOnboarding, resetOnboarding };
}
