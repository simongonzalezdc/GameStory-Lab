/**
 * Tutorial Page
 * Interactive tutorial for using GameStory Lab
 */

import React, { useState } from 'react';
import { Link } from 'react-router-dom';

type TutorialSection = 'basics' | 'create-project' | 'generate-concept' | 'validate' | 'refine' | 'export' | 'advanced';

export function TutorialPage() {
  const [activeSection, setActiveSection] = useState<TutorialSection>('basics');

  const sections: { id: TutorialSection; title: string; icon: string }[] = [
    { id: 'basics', title: 'Understanding Basics', icon: '📚' },
    { id: 'create-project', title: 'Creating Projects', icon: '📁' },
    { id: 'generate-concept', title: 'Generating Concepts', icon: '✨' },
    { id: 'validate', title: 'Validating Concepts', icon: '✅' },
    { id: 'refine', title: 'Refining Designs', icon: '🔧' },
    { id: 'export', title: 'Exporting Documentation', icon: '📄' },
    { id: 'advanced', title: 'Advanced Features', icon: '🚀' },
  ];

  const renderContent = () => {
    switch (activeSection) {
      case 'basics':
        return (
          <div className="space-y-6">
            <div>
              <h2 className="text-2xl font-bold text-slate-900 dark:text-slate-100 mb-4">Understanding the Basics</h2>
              <div className="space-y-6">
                <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl p-6">
                  <h3 className="text-lg font-semibold text-blue-900 dark:text-blue-200 mb-2 flex items-center gap-2">
                    <span>📁</span> What is a Project?
                  </h3>
                  <p className="text-blue-800 dark:text-blue-200">
                    A <strong>Project</strong> is a container for your game ideas. Think of it as a folder where you keep all your concepts for a single game.
                  </p>
                </div>

                <div className="bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-800 rounded-xl p-6">
                  <h3 className="text-lg font-semibold text-purple-900 dark:text-purple-200 mb-2 flex items-center gap-2">
                    <span>🎮</span> What is a Concept?
                  </h3>
                  <p className="text-purple-800 dark:text-purple-200 mb-3">
                    A <strong>Concept</strong> is a complete game design that includes:
                  </p>
                  <ul className="list-disc list-inside space-y-2 text-purple-800 dark:text-purple-200">
                    <li><strong>Mechanics</strong>: How the game plays (core loop, player actions, progression systems, win/lose conditions)</li>
                    <li><strong>Lore</strong>: The story and world (setting, protagonist, conflict, themes, world rules)</li>
                  </ul>
                  <p className="text-purple-800 dark:text-purple-200 mt-3">
                    Concepts are <strong>versioned</strong>, meaning you can create multiple versions and refine them over time.
                  </p>
                </div>

                <div className="bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 rounded-xl p-6">
                  <h3 className="text-lg font-semibold text-emerald-900 dark:text-emerald-200 mb-2 flex items-center gap-2">
                    <span>🔄</span> The Workflow
                  </h3>
                  <ol className="list-decimal list-inside space-y-2 text-emerald-800 dark:text-emerald-200">
                    <li><strong>Create a Project</strong> → Give your game a name and genre</li>
                    <li><strong>Generate a Concept</strong> → Use AI to create mechanics and/or lore</li>
                    <li><strong>Validate</strong> → Check for consistency issues</li>
                    <li><strong>Refine</strong> → Improve your concept with AI assistance</li>
                    <li><strong>Export</strong> → Generate professional documentation (GDD, pitch deck, etc.)</li>
                  </ol>
                </div>
              </div>
            </div>
          </div>
        );

      case 'create-project':
        return (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold text-slate-900 dark:text-slate-100 mb-4">Creating Your First Project</h2>
            
            <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-6 shadow-sm">
              <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-4">Step-by-Step Guide</h3>
              
              <div className="space-y-4">
                <div className="flex gap-4">
                  <div className="flex-shrink-0 w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold">
                    1
                  </div>
                  <div className="flex-1">
                    <h4 className="font-semibold text-slate-900 dark:text-slate-100 mb-1">Navigate to Projects</h4>
                    <p className="text-slate-600 dark:text-slate-300">When you first open GameStory Lab, you'll see the <strong>Projects</strong> page. This is your dashboard where all your game projects are listed.</p>
                  </div>
                </div>

                <div className="flex gap-4">
                  <div className="flex-shrink-0 w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold">
                    2
                  </div>
                  <div className="flex-1">
                    <h4 className="font-semibold text-slate-900 dark:text-slate-100 mb-1">Create a New Project</h4>
                    <ol className="list-decimal list-inside space-y-1 text-slate-600 dark:text-slate-300 ml-4">
                      <li>Click the <strong>"+ Create New Project"</strong> button (top of the page)</li>
                      <li>Enter a <strong>Project Title</strong> (required)
                        <ul className="list-disc list-inside ml-4 mt-1 text-sm">
                          <li>Example: "My Epic RPG" or "Cozy Farming Sim"</li>
                        </ul>
                      </li>
                      <li>Optionally add a <strong>Genre or Mood</strong>
                        <ul className="list-disc list-inside ml-4 mt-1 text-sm">
                          <li>Example: "RPG", "cozy sim", "tactical strategy"</li>
                          <li>This helps AI generate more appropriate content</li>
                        </ul>
                      </li>
                      <li>Click <strong>"Create Project"</strong></li>
                    </ol>
                  </div>
                </div>

                <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4 mt-4">
                  <p className="text-sm text-blue-800 dark:text-blue-200">
                    <strong>💡 Tip:</strong> You'll now see your project in the list! Click on it to open and start creating concepts.
                  </p>
                </div>
              </div>
            </div>

            <div className="flex gap-3">
              <Link to="/" className="btn btn-primary">
                <span>📁</span>
                <span>Go to Projects</span>
              </Link>
            </div>
          </div>
        );

      case 'generate-concept':
        return (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold text-slate-900 dark:text-slate-100 mb-4">Generating Your First Concept</h2>
            
            <div className="grid md:grid-cols-2 gap-6">
              <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-6 shadow-sm">
                <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-3 flex items-center gap-2">
                  <span>✨</span> Option A: Generate from Scratch
                </h3>
                <p className="text-slate-600 dark:text-slate-300 mb-4">Recommended for first-time users</p>
                <ol className="list-decimal list-inside space-y-2 text-slate-600 dark:text-slate-300">
                  <li>Click on your project to open it</li>
                  <li>Click <strong>"Generate Concept with AI"</strong></li>
                  <li>Choose what to generate:
                    <ul className="list-disc list-inside ml-4 mt-1 text-sm">
                      <li><strong>Both</strong> (recommended): Creates mechanics + lore</li>
                      <li><strong>Mechanics only</strong>: Just gameplay systems</li>
                      <li><strong>Lore only</strong>: Just story and world</li>
                    </ul>
                  </li>
                  <li>Optionally describe your game idea</li>
                  <li>Click <strong>"Generate Concept"</strong></li>
                </ol>
              </div>

              <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-6 shadow-sm">
                <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-3 flex items-center gap-2">
                  <span>🎨</span> Option B: Start from Template
                </h3>
                <p className="text-slate-600 dark:text-slate-300 mb-4">Use pre-built genre templates</p>
                <ol className="list-decimal list-inside space-y-2 text-slate-600 dark:text-slate-300">
                  <li>Click <strong>"Templates"</strong> in navigation</li>
                  <li>Browse available templates:
                    <ul className="list-disc list-inside ml-4 mt-1 text-sm">
                      <li>RPG, FPS, Strategy, Puzzle, Survival</li>
                    </ul>
                  </li>
                  <li>Click a template to preview</li>
                  <li>Click <strong>"Create Project from Template"</strong></li>
                  <li>Enter a project name</li>
                </ol>
              </div>
            </div>

            <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg p-4">
              <p className="text-sm text-amber-800 dark:text-amber-200">
                <strong>💡 Pro Tip:</strong> The more detail you provide in your description, the better the AI can tailor the concept to your vision!
              </p>
            </div>

            <div className="flex gap-3">
              <Link to="/" className="btn btn-primary">
                <span>✨</span>
                <span>Create a Concept</span>
              </Link>
              <Link to="/templates" className="btn btn-secondary">
                <span>🎨</span>
                <span>Browse Templates</span>
              </Link>
            </div>
          </div>
        );

      case 'validate':
        return (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold text-slate-900 dark:text-slate-100 mb-4">Validating Your Concept</h2>
            
            <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-6 shadow-sm">
              <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-4">Understanding Validation</h3>
              <p className="text-slate-600 dark:text-slate-300 mb-4">
                The validation system checks if your mechanics and lore work together coherently. It looks for:
              </p>
              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <div className="flex items-start gap-2">
                    <span className="text-blue-600">•</span>
                    <span className="text-slate-700"><strong>Mechanics-Lore Alignment</strong>: Do gameplay actions match the story?</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <span className="text-blue-600">•</span>
                    <span className="text-slate-700"><strong>Genre Conventions</strong>: Does it follow genre expectations?</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <span className="text-blue-600">•</span>
                    <span className="text-slate-700"><strong>World Physics</strong>: Are world rules consistent?</span>
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="flex items-start gap-2">
                    <span className="text-blue-600">•</span>
                    <span className="text-slate-700"><strong>Progression Coherence</strong>: Does progression make sense?</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <span className="text-blue-600">•</span>
                    <span className="text-slate-700"><strong>Narrative Structure</strong>: Is the story well-structured?</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <span className="text-blue-600">•</span>
                    <span className="text-slate-700"><strong>Technical Feasibility</strong>: Can this actually be built?</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-6 shadow-sm">
              <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-4">Checking Your Score</h3>
              <div className="space-y-4">
                <div>
                  <h4 className="font-semibold text-slate-900 dark:text-slate-100 mb-2">1. Click the "Validation" tab</h4>
                  <p className="text-slate-600 dark:text-slate-300">View your consistency score and any issues found.</p>
                </div>
                <div>
                  <h4 className="font-semibold text-slate-900 dark:text-slate-100 mb-2">2. Understand Your Score</h4>
                  <div className="space-y-2">
                    <div className="flex items-center gap-3 p-3 bg-green-50 border border-green-200 rounded-lg">
                      <span className="text-2xl">🟢</span>
                      <div>
                        <strong className="text-green-900">80-100%</strong>
                        <p className="text-sm text-green-700">Excellent! Your concept is very coherent</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                      <span className="text-2xl">🟡</span>
                      <div>
                        <strong className="text-yellow-900">60-79%</strong>
                        <p className="text-sm text-yellow-700">Good, but some improvements possible</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 p-3 bg-red-50 border border-red-200 rounded-lg">
                      <span className="text-2xl">🔴</span>
                      <div>
                        <strong className="text-red-900">Below 60%</strong>
                        <p className="text-sm text-red-700">Needs work - check the issues below</p>
                      </div>
                    </div>
                  </div>
                </div>
                <div>
                  <h4 className="font-semibold text-slate-900 dark:text-slate-100 mb-2">3. Review Issues</h4>
                  <ul className="list-disc list-inside space-y-1 text-slate-600 dark:text-slate-300">
                    <li><strong className="text-red-600">Errors</strong> (red): Critical problems that should be fixed</li>
                    <li><strong className="text-yellow-600">Warnings</strong> (yellow): Potential issues to consider</li>
                    <li><strong className="text-blue-600">Info</strong> (blue): Suggestions for improvement</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        );

      case 'refine':
        return (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold text-slate-900 dark:text-slate-100 mb-4">Refining Your Concept</h2>
            
            <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-6 shadow-sm">
              <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-3">What is Refinement?</h3>
              <p className="text-slate-600 dark:text-slate-300 mb-4">
                Refinement uses AI to improve your concept while keeping what works. It creates a <strong>new version</strong> so you can compare changes.
              </p>
            </div>

            <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-6 shadow-sm">
              <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-4">How to Refine</h3>
              <ol className="list-decimal list-inside space-y-3 text-slate-600 dark:text-slate-300">
                <li>Click the <strong>"✨ Refine"</strong> button (top right of concept page)</li>
                <li>Choose a focus:
                  <div className="grid md:grid-cols-2 gap-3 mt-3">
                    <div className="p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
                      <strong className="text-blue-900 dark:text-blue-200">Deepen Mechanics</strong>
                      <p className="text-sm text-blue-700">Add more detail to gameplay systems</p>
                    </div>
                    <div className="p-3 bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-800 rounded-lg">
                      <strong className="text-purple-900 dark:text-purple-200">Enrich Lore</strong>
                      <p className="text-sm text-purple-700">Expand the story and world</p>
                    </div>
                    <div className="p-3 bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 rounded-lg">
                      <strong className="text-emerald-900 dark:text-emerald-200">Improve Consistency</strong>
                      <p className="text-sm text-emerald-700">Fix validation issues</p>
                    </div>
                    <div className="p-3 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg">
                      <strong className="text-amber-900">Enhance Genre Fit</strong>
                      <p className="text-sm text-amber-700">Better align with genre conventions</p>
                    </div>
                  </div>
                </li>
                <li>Wait while AI refines your concept...</li>
                <li>A new version is created automatically</li>
                <li>Compare versions to see what changed</li>
              </ol>
            </div>

            <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
              <p className="text-sm text-blue-800 dark:text-blue-200">
                <strong>💡 Tip:</strong> Each refinement creates a new version. You can see all versions in your project, and the latest is shown by default.
              </p>
            </div>
          </div>
        );

      case 'export':
        return (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold text-slate-900 dark:text-slate-100 mb-4">Exporting Your Concept</h2>
            
            <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-6 shadow-sm">
              <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-4">Export Formats</h3>
              <p className="text-slate-600 dark:text-slate-300 mb-4">
                Once you're happy with your concept, export it to professional documentation:
              </p>
              <ol className="list-decimal list-inside space-y-3 text-slate-600 dark:text-slate-300">
                <li>Click the <strong>"📄 Export"</strong> button (top right)</li>
                <li>Choose a template:
                  <div className="grid md:grid-cols-3 gap-3 mt-3">
                    <div className="p-4 bg-slate-50 dark:bg-slate-700/50 border border-slate-200 dark:border-slate-700 rounded-lg">
                      <strong className="text-slate-900 dark:text-slate-100 block mb-1">GDD</strong>
                      <p className="text-sm text-slate-600 dark:text-slate-300">Game Design Document - Comprehensive design doc</p>
                    </div>
                    <div className="p-4 bg-slate-50 dark:bg-slate-700/50 border border-slate-200 dark:border-slate-700 rounded-lg">
                      <strong className="text-slate-900 dark:text-slate-100 block mb-1">Pitch</strong>
                      <p className="text-sm text-slate-600 dark:text-slate-300">Investor/publisher pitch deck</p>
                    </div>
                    <div className="p-4 bg-slate-50 dark:bg-slate-700/50 border border-slate-200 dark:border-slate-700 rounded-lg">
                      <strong className="text-slate-900 dark:text-slate-100 block mb-1">Technical</strong>
                      <p className="text-sm text-slate-600 dark:text-slate-300">Technical specification document</p>
                    </div>
                  </div>
                </li>
                <li>The markdown file downloads automatically</li>
                <li>Open it in any markdown viewer or editor</li>
              </ol>
            </div>

            <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-6 shadow-sm">
              <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-3">What's Included</h3>
              <p className="text-slate-600 dark:text-slate-300 mb-3">The exported document includes:</p>
              <ul className="list-disc list-inside space-y-1 text-slate-600 dark:text-slate-300">
                <li>Project overview</li>
                <li>Complete mechanics breakdown</li>
                <li>Full lore and narrative</li>
                <li>Validation results</li>
                <li>Consistency score</li>
                <li>All concept details in a professional format</li>
              </ul>
            </div>
          </div>
        );

      case 'advanced':
        return (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold text-slate-900 dark:text-slate-100 mb-4">Advanced Features</h2>
            
            <div className="grid md:grid-cols-2 gap-6">
              <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-6 shadow-sm">
                <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-3 flex items-center gap-2">
                  <span>🔄</span> Multiple Concepts
                </h3>
                <ul className="list-disc list-inside space-y-1 text-slate-600 dark:text-slate-300">
                  <li>A project can have <strong>multiple concepts</strong> (versions)</li>
                  <li>Each concept is independent</li>
                  <li>Use refinement to create new versions</li>
                  <li>Compare different approaches</li>
                </ul>
              </div>

              <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-6 shadow-sm">
                <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-3 flex items-center gap-2">
                  <span>🎨</span> Using Templates
                </h3>
                <ul className="list-disc list-inside space-y-1 text-slate-600 dark:text-slate-300">
                  <li>Templates are pre-built starting points</li>
                  <li><strong>Browse Templates</strong>: See all available genres</li>
                  <li><strong>Preview</strong>: Check what's included before creating</li>
                  <li><strong>Customize</strong>: Templates can be modified after creation</li>
                </ul>
              </div>

              <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-6 shadow-sm">
                <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-3 flex items-center gap-2">
                  <span>🤖</span> AI Model Selection
                </h3>
                <p className="text-slate-600 dark:text-slate-300 mb-2">The system automatically selects the best AI model:</p>
                <ul className="list-disc list-inside space-y-1 text-slate-600 dark:text-slate-300">
                  <li><strong>Ollama</strong> (free, local): Used when available</li>
                  <li><strong>OpenRouter</strong> (cloud): Access to multiple models</li>
                  <li><strong>Google Gemini</strong>: Fast validation</li>
                </ul>
                <p className="text-sm text-slate-500 dark:text-slate-400 mt-2">The system chooses optimally for you.</p>
              </div>

              <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-6 shadow-sm">
                <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-3 flex items-center gap-2">
                  <span>💡</span> Common Workflows
                </h3>
                <div className="space-y-3 text-sm">
                  <div>
                    <strong className="text-slate-900 dark:text-slate-100">Workflow 1: Start Fresh</strong>
                    <p className="text-slate-600 dark:text-slate-300">Create → Generate Both → Validate → Refine → Export</p>
                  </div>
                  <div>
                    <strong className="text-slate-900 dark:text-slate-100">Workflow 2: Mechanics First</strong>
                    <p className="text-slate-600 dark:text-slate-300">Generate Mechanics → Review → Generate Lore → Validate</p>
                  </div>
                  <div>
                    <strong className="text-slate-900 dark:text-slate-100">Workflow 3: Template-Based</strong>
                    <p className="text-slate-600 dark:text-slate-300">Browse → Create from Template → Customize → Refine</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 rounded-xl p-6">
              <h3 className="text-lg font-semibold text-emerald-900 dark:text-emerald-200 mb-3">Tips & Best Practices</h3>
              <ul className="list-disc list-inside space-y-2 text-emerald-800 dark:text-emerald-200">
                <li><strong>Be Specific</strong>: The more detail in your prompt, the better</li>
                <li><strong>Use Genre</strong>: Always set a genre for better AI guidance</li>
                <li><strong>Iterate</strong>: Don't expect perfection on the first try</li>
                <li><strong>Validate Early</strong>: Check consistency before refining too much</li>
                <li><strong>Refine Strategically</strong>: Use the right refinement focus for your needs</li>
              </ul>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="max-w-6xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-slate-900 dark:text-slate-100 mb-2">Tutorial</h1>
        <p className="text-lg text-slate-600 dark:text-slate-300">
          Learn how to use GameStory Lab to create professional game concepts
        </p>
      </div>

      <div className="grid lg:grid-cols-[250px_1fr] gap-8">
        {/* Sidebar Navigation */}
        <aside className="lg:sticky lg:top-24 h-fit">
          <nav className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm p-4">
            <h2 className="text-sm font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-4">
              Sections
            </h2>
            <ul className="space-y-1">
              {sections.map((section) => (
                <li key={section.id}>
                  <button
                    onClick={() => setActiveSection(section.id)}
                    className={`w-full text-left px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                      activeSection === section.id
                        ? 'bg-slate-900 dark:bg-blue-600 text-white'
                        : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 hover:text-slate-900 dark:text-slate-100'
                    }`}
                  >
                    <span className="mr-2">{section.icon}</span>
                    {section.title}
                  </button>
                </li>
              ))}
            </ul>
          </nav>

          <div className="mt-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl p-4">
            <p className="text-sm text-blue-800 dark:text-blue-200 mb-3">
              <strong>Ready to start?</strong>
            </p>
            <Link to="/" className="btn btn-primary w-full text-center text-sm">
              <span>📁</span>
              <span>Go to Projects</span>
            </Link>
          </div>
        </aside>

        {/* Main Content */}
        <main className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm p-8">
          {renderContent()}
        </main>
      </div>
    </div>
  );
}

