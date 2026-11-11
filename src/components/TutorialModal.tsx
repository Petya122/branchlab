import React, { useState } from 'react'
import {
  X,
  Sparkles,
  GitBranch,
  Play,
  GitPullRequest,
  Trophy,
  ArrowRight,
  ArrowLeft,
  CheckCircle2,
} from 'lucide-react'
import { setTutorialSeen, shouldShowTutorial } from '../utils/tutorial'

interface TutorialModalProps {
  isOpen: boolean
  onClose: () => void
}

interface TutorialStep {
  stepNumber: number
  badge: string
  title: string
  description: string
  icon: React.ReactNode
  accentColor: string
  bullets: string[]
  proTip: string
}

export const TutorialModal: React.FC<TutorialModalProps> = ({ isOpen, onClose }) => {
  const [currentStep, setCurrentStep] = useState(0)
  // Saved as soon as it is ticked, so it also counts when the tour is closed
  // with ✕, Esc or a click outside (not only with "Skip tour" / the last step)
  const [dontShowAgain, setDontShowAgain] = useState(() => !shouldShowTutorial())
  const toggleDontShowAgain = (checked: boolean) => {
    setDontShowAgain(checked)
    setTutorialSeen(checked)
  }

  if (!isOpen) return null

  const steps: TutorialStep[] = [
    {
      stepNumber: 1,
      badge: 'Welcome to BranchLab',
      title: 'Master Modern DevOps & Git Workflows',
      description:
        'BranchLab is an interactive, visual sandbox designed for students and software engineers to experiment with version control branching, automated release pipelines, and quality gates.',
      icon: <Sparkles size={28} color="#38bdf8" />,
      accentColor: '#38bdf8',
      bullets: [
        'Explore real Git branching models: GitFlow, Trunk-Based, and GitHub Flow.',
        'Simulate a full 5-stage CI/CD release pipeline with real-time logs.',
        'Practice resolving 3-way Git merge conflicts and branch protection rules.',
      ],
      proTip: 'Live on branchlab.tech: every merge to main is tested and deployed automatically by GitHub Actions to a Docker server on Oracle Cloud.',
    },
    {
      stepNumber: 2,
      badge: 'Module 1: Git Visualizer',
      title: 'Interactive Git DAG & Branch Rails',
      description:
        'The canvas displays commits as glowing nodes connected by branch rails. Switch strategies using the top navbar selector to see how team workflows differ.',
      icon: <GitBranch size={28} color="#a855f7" />,
      accentColor: '#a855f7',
      bullets: [
        'Click [Commit] to add a new commit to the active branch.',
        'Click [Branch] to create feature/ or hotfix/ branches from any branch.',
        'Click [Merge] to merge branches and watch the merge commit get two parents.',
      ],
      proTip: 'Click on any commit circle on the canvas to inspect its author, SHA hash, and commit message!',
    },
    {
      stepNumber: 3,
      badge: 'Module 2: CI/CD Pipeline',
      title: 'Automated Build Gates & Chaos Injection',
      description:
        'In DevOps, every commit triggers automated verification. BranchLab mirrors its own GitHub Actions pipeline in 5 stages: Lint & Typecheck, Tests (Vitest), Security Scan (npm audit + Trivy), Docker Image & E2E, and Deploy to Oracle Cloud (main only).',
      icon: <Play size={28} color="#10b981" />,
      accentColor: '#10b981',
      bullets: [
        'Click [Run CI/CD] (on phones: Trigger Pipeline) to watch the stages run one after another.',
        'Use Chaos Injection Controls to simulate broken unit tests or lint errors.',
        'A red stage stops the pipeline ❌, and only main is deployed; other branches skip the deploy.',
      ],
      proTip: 'Turn a red pipeline green by switching the chaos error off again, and earn the Quality Gatekeeper achievement!',
    },
    {
      stepNumber: 4,
      badge: 'Module 3: PRs & Conflicts',
      title: 'Pull Requests & Merge Conflict Resolution',
      description:
        'Experience real-world team collaboration challenges with simulated GitHub Pull Requests and interactive conflict resolution.',
      icon: <GitPullRequest size={28} color="#ec4899" />,
      accentColor: '#ec4899',
      bullets: [
        'Click [PR] to open a simulated GitHub pull request (feature branches target develop in GitFlow, main otherwise).',
        'Merging is blocked until the pipeline is green on the PR branch’s own latest commit.',
        'Click [Conflict] to resolve code conflicts using standard Git diff markers (<<<<<<< HEAD).',
      ],
      proTip: 'Choose between Accept Current, Accept Incoming, or Accept Both to resolve conflicts cleanly.',
    },
    {
      stepNumber: 5,
      badge: 'Module 4: Trophy Room',
      title: 'Level Up Your DevOps Engineering Rank',
      description:
        'Complete challenges and perform Git operations to earn XP and unlock achievements stored directly in your browser.',
      icon: <Trophy size={28} color="#f59e0b" />,
      accentColor: '#f59e0b',
      bullets: [
        'Unlock 5 unique achievements: Quality Gatekeeper, Production Firefighter, Conflict Master, PR Champion, and Trunk Pioneer.',
        'Progress from Junior DevOps Apprentice up to Principal SRE Architect.',
        'Click the Level widget in the navbar anytime to view your trophy collection.',
      ],
      proTip: 'Progress is saved automatically in your browser localStorage without cookies or tracking!',
    },
  ]

  const step = steps[currentStep]

  const handleFinish = () => onClose()

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep((s) => s + 1)
    } else {
      handleFinish()
    }
  }

  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep((s) => s - 1)
    }
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div
        className="modal-content"
        style={{ maxWidth: '640px', padding: '24px' }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div
              style={{
                width: '46px',
                height: '46px',
                borderRadius: '12px',
                background: `rgba(${step.accentColor === '#38bdf8' ? '56, 189, 248' : step.accentColor === '#a855f7' ? '168, 85, 247' : step.accentColor === '#10b981' ? '16, 185, 129' : step.accentColor === '#ec4899' ? '236, 72, 153' : '245, 158, 11'}, 0.15)`,
                border: `1px solid ${step.accentColor}`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              {step.icon}
            </div>
            <div>
              <span
                style={{
                  fontSize: '11px',
                  fontWeight: '700',
                  color: step.accentColor,
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em',
                }}
              >
                {step.badge} • Step {step.stepNumber} of {steps.length}
              </span>
              <div style={{ fontSize: '17px', fontWeight: '700', color: 'var(--text-primary)', marginTop: '2px' }}>
                {step.title}
              </div>
            </div>
          </div>
          <button aria-label="Close"
            onClick={onClose}
            style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}
          >
            <X size={18} />
          </button>
        </div>

        {/* Body Description */}
        <p style={{ fontSize: '13px', color: 'var(--text-secondary)', lineHeight: '1.6', marginBottom: '16px' }}>
          {step.description}
        </p>

        {/* Feature Highlights */}
        <div
          style={{
            background: 'var(--bg-surface-elevated)',
            border: '1px solid var(--border-subtle)',
            borderRadius: 'var(--radius-md)',
            padding: '14px',
            marginBottom: '16px',
            display: 'flex',
            flexDirection: 'column',
            gap: '8px',
          }}
        >
          {step.bullets.map((bullet, idx) => (
            <div key={`b-${idx}`} style={{ display: 'flex', alignItems: 'flex-start', gap: '8px', fontSize: '12px', color: 'var(--text-primary)' }}>
              <CheckCircle2 size={15} color={step.accentColor} style={{ flexShrink: 0, marginTop: '2px' }} />
              <span>{bullet}</span>
            </div>
          ))}
        </div>

        {/* Pro Tip Box */}
        <div
          style={{
            background: 'rgba(255, 255, 255, 0.03)',
            borderLeft: `3px solid ${step.accentColor}`,
            padding: '8px 12px',
            borderRadius: '0 var(--radius-sm) var(--radius-sm) 0',
            fontSize: '11px',
            color: 'var(--text-muted)',
            marginBottom: '20px',
          }}
        >
          <strong style={{ color: 'var(--text-primary)' }}>💡 Pro-Tip:</strong> {step.proTip}
        </div>

        {/* Bottom Navigation & Indicators */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          {/* Step Dots */}
          <div style={{ display: 'flex', gap: '6px' }}>
            {steps.map((_, idx) => (
              <span
                key={`dot-${idx}`}
                onClick={() => setCurrentStep(idx)}
                style={{
                  width: idx === currentStep ? '20px' : '8px',
                  height: '8px',
                  borderRadius: '4px',
                  background: idx === currentStep ? step.accentColor : 'var(--border-medium)',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                }}
              />
            ))}
          </div>

          {/* Action Buttons */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            {currentStep > 0 && (
              <button type="button" className="action-btn btn-ghost" onClick={handleBack}>
                <ArrowLeft size={14} /> Back
              </button>
            )}
            <button
              type="button"
              className="action-btn btn-primary"
              onClick={handleNext}
              style={{
                background: currentStep === steps.length - 1 ? 'linear-gradient(135deg, #059669, #10b981)' : undefined,
              }}
            >
              {currentStep === steps.length - 1 ? (
                <>Start Exploring! 🚀</>
              ) : (
                <>Next <ArrowRight size={14} /></>
              )}
            </button>
          </div>
        </div>

        {/* Don't show again checkbox */}
        <div style={{ marginTop: '14px', paddingTop: '12px', borderTop: '1px solid var(--border-subtle)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <label style={{ fontSize: '11px', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer' }}>
            <input
              type="checkbox"
              checked={dontShowAgain}
              onChange={(e) => toggleDontShowAgain(e.target.checked)}
            />
            Don't show this guide automatically on startup
          </label>
          <button
            type="button"
            onClick={handleFinish}
            style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', fontSize: '11px', cursor: 'pointer' }}
          >
            Skip tour
          </button>
        </div>
      </div>
    </div>
  )
}
