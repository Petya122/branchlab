import React, { useState, useEffect } from 'react'
import {
  Sparkles,
  ArrowRight,
  GitBranch,
  Play,
  GitMerge,
  Trophy,
  ShieldCheck,
  Zap,
  Globe,
  CheckCircle2,
} from 'lucide-react'

const GithubIcon: React.FC = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor">
    <path
      fillRule="evenodd"
      clipRule="evenodd"
      d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.53 1.032 1.53 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z"
    />
  </svg>
)

interface HomePageProps {
  onLaunchLab: () => void
  onOpenTour: () => void
}

export const HomePage: React.FC<HomePageProps> = ({ onLaunchLab, onOpenTour }) => {
  const [pulseOffset, setPulseOffset] = useState(0)

  useEffect(() => {
    const interval = setInterval(() => {
      setPulseOffset((prev) => (prev + 1) % 100)
    }, 40)
    return () => clearInterval(interval)
  }, [])

  return (
    <div style={{ display: 'flex', flexDirection: 'column', flex: 1 }}>
      {/* Hero Section */}
      <section
        style={{
          padding: '64px 24px 48px',
          textAlign: 'center',
          maxWidth: '1040px',
          margin: '0 auto',
          position: 'relative',
        }}
      >
        {/* Top Badge */}
        <div
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
            background: 'rgba(56, 189, 248, 0.1)',
            border: '1px solid rgba(56, 189, 248, 0.3)',
            borderRadius: 'var(--radius-full)',
            padding: '4px 14px',
            fontSize: '12px',
            color: '#38bdf8',
            fontWeight: '600',
            marginBottom: '20px',
          }}
        >
          <Sparkles size={13} />
          <span>DevOps és tesztelés • Soproni Egyetem</span>
          <span style={{ opacity: 0.5 }}>|</span>
          <span style={{ color: '#34d399' }}>branchlab.me</span>
        </div>

        {/* Headline */}
        <h1
          style={{
            fontSize: 'clamp(32px, 5vw, 54px)',
            fontWeight: '800',
            lineHeight: '1.15',
            letterSpacing: '-0.03em',
            marginBottom: '18px',
            background: 'linear-gradient(to right, #f8fafc, #cbd5e1, #38bdf8)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
          }}
        >
          Master Git Branching & CI/CD Pipelines in Real-Time
        </h1>

        {/* Subtitle */}
        <p
          style={{
            fontSize: 'clamp(15px, 2vw, 18px)',
            color: 'var(--text-secondary)',
            lineHeight: '1.6',
            maxWidth: '720px',
            margin: '0 auto 32px',
          }}
        >
          An interactive laboratory designed for software developers and DevOps students.
          Simulate GitFlow, Trunk-Based releases, branch protection quality gates, and automated deployments to Vercel.
        </p>

        {/* CTA Buttons */}
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '14px', flexWrap: 'wrap', marginBottom: '40px' }}>
          <button
            className="action-btn btn-primary"
            style={{ fontSize: '15px', padding: '12px 28px', borderRadius: '10px' }}
            onClick={onLaunchLab}
          >
            Launch Interactive Lab <ArrowRight size={16} />
          </button>
          <button
            className="action-btn btn-ghost"
            style={{ fontSize: '15px', padding: '12px 24px', borderRadius: '10px' }}
            onClick={onOpenTour}
          >
            Explore Quick Tour 💡
          </button>
        </div>

        {/* Feature Pills */}
        <div style={{ display: 'flex', justifyContent: 'center', gap: '18px', flexWrap: 'wrap', fontSize: '12px', color: 'var(--text-muted)' }}>
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
            <Zap size={14} color="#38bdf8" /> React 19 + TypeScript
          </span>
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
            <CheckCircle2 size={14} color="#34d399" /> 24+ Automated Vitest Tests
          </span>
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
            <Globe size={14} color="#a855f7" /> Live on branchlab.me
          </span>
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
            <ShieldCheck size={14} color="#f59e0b" /> Branch Protection Gates
          </span>
        </div>
      </section>

      {/* Living Git Pulse Hero Canvas Section */}
      <section
        style={{
          maxWidth: '1120px',
          width: '92%',
          margin: '0 auto 64px',
          position: 'relative',
        }}
      >
        <div
          style={{
            background: 'linear-gradient(180deg, #090e18, #05080f)',
            border: '1px solid rgba(56, 189, 248, 0.25)',
            borderRadius: '16px',
            overflow: 'hidden',
            boxShadow: '0 20px 50px -10px rgba(0, 0, 0, 0.8), 0 0 30px rgba(56, 189, 248, 0.15)',
            padding: '24px',
            position: 'relative',
          }}
        >
          {/* Header Bar */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '12px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div style={{ display: 'flex', gap: '6px' }}>
                <span style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#ef4444' }} />
                <span style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#f59e0b' }} />
                <span style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#10b981' }} />
              </div>
              <span style={{ fontSize: '12px', fontFamily: 'var(--font-mono)', color: 'var(--text-muted)' }}>
                living-git-pulse • active pipeline stream
              </span>
            </div>
            <div
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                background: 'rgba(16, 185, 129, 0.15)',
                color: '#34d399',
                border: '1px solid rgba(16, 185, 129, 0.3)',
                padding: '2px 10px',
                borderRadius: 'var(--radius-full)',
                fontSize: '11px',
                fontWeight: 'bold',
              }}
            >
              <CheckCircle2 size={12} /> CI Checks Green (5/5)
            </div>
          </div>

          {/* Living SVG Canvas */}
          <div style={{ width: '100%', height: '240px', position: 'relative' }}>
            <svg viewBox="0 0 900 240" style={{ width: '100%', height: '100%' }}>
              <defs>
                <linearGradient id="mainRail" x1="0" y1="0" x2="1" y2="0">
                  <stop offset="0%" stopColor="#10b981" />
                  <stop offset="100%" stopColor="#38bdf8" />
                </linearGradient>
                <linearGradient id="featureRail" x1="0" y1="0" x2="1" y2="0">
                  <stop offset="0%" stopColor="#38bdf8" />
                  <stop offset="100%" stopColor="#a855f7" />
                </linearGradient>
                <linearGradient id="hotfixRail" x1="0" y1="0" x2="1" y2="0">
                  <stop offset="0%" stopColor="#f59e0b" />
                  <stop offset="100%" stopColor="#10b981" />
                </linearGradient>
                <filter id="pulseGlow" x="-20%" y="-20%" width="140%" height="140%">
                  <feGaussianBlur stdDeviation="4" result="glow" />
                  <feComposite in="SourceGraphic" in2="glow" operator="over" />
                </filter>
              </defs>

              {/* main branch rail */}
              <line x1="60" y1="60" x2="840" y2="60" stroke="url(#mainRail)" strokeWidth="4" opacity="0.8" />
              <text x="70" y="44" fill="#10b981" fontSize="11" fontFamily="var(--font-mono)" fontWeight="700">
                main (v1.0.0 → branchlab.me)
              </text>

              {/* develop branch rail */}
              <line x1="160" y1="130" x2="840" y2="130" stroke="#06b6d4" strokeWidth="3" opacity="0.7" strokeDasharray="6 4" />
              <text x="170" y="118" fill="#06b6d4" fontSize="11" fontFamily="var(--font-mono)">
                develop (staging integration)
              </text>

              {/* feature/auth branch curve */}
              <path
                d="M 280 130 C 350 130, 360 200, 440 200 C 520 200, 540 130, 620 130"
                fill="none"
                stroke="url(#featureRail)"
                strokeWidth="4"
                strokeDasharray="4 2"
              />
              <text x="440" y="222" fill="#a855f7" fontSize="11" fontFamily="var(--font-mono)" textAnchor="middle">
                feature/auth (student SSO)
              </text>

              {/* hotfix branch curve */}
              <path
                d="M 620 60 C 660 60, 680 100, 720 100 C 760 100, 780 60, 820 60"
                fill="none"
                stroke="url(#hotfixRail)"
                strokeWidth="3.5"
              />

              {/* Static Commits */}
              {[
                { cx: 120, cy: 60, color: '#10b981', sha: '1a2b3c' },
                { cx: 240, cy: 130, color: '#06b6d4', sha: '4d5e6f' },
                { cx: 360, cy: 200, color: '#a855f7', sha: '7g8h9i' },
                { cx: 500, cy: 200, color: '#a855f7', sha: '0j1k2l' },
                { cx: 620, cy: 130, color: '#06b6d4', sha: '3m4n5o', isMerge: true },
                { cx: 720, cy: 100, color: '#f59e0b', sha: 'patch9' },
                { cx: 820, cy: 60, color: '#10b981', sha: 'deploy', isMerge: true },
              ].map((node, idx) => (
                <g key={`hero-node-${idx}`}>
                  <circle cx={node.cx} cy={node.cy} r="10" fill="#06090e" stroke={node.color} strokeWidth="3" />
                  <circle cx={node.cx} cy={node.cy} r="3.5" fill={node.color} />
                  <text x={node.cx} y={node.cy + 22} fill="var(--text-muted)" fontSize="10" fontFamily="var(--font-mono)" textAnchor="middle">
                    {node.sha}
                  </text>
                </g>
              ))}

              {/* Animated Traveling Pulse Packet */}
              <circle
                cx={60 + (pulseOffset / 100) * 780}
                cy="60"
                r="7"
                fill="#ffffff"
                filter="url(#pulseGlow)"
              />
            </svg>
          </div>
        </div>
      </section>

      {/* 4-Card Bento Grid */}
      <section
        style={{
          maxWidth: '1120px',
          width: '92%',
          margin: '0 auto 80px',
        }}
      >
        <div style={{ textAlign: 'center', marginBottom: '36px' }}>
          <h2 style={{ fontSize: '28px', fontWeight: '700', color: 'var(--text-primary)', marginBottom: '8px' }}>
            Built for Modern DevOps & Software Testing
          </h2>
          <p style={{ fontSize: '14px', color: 'var(--text-secondary)' }}>
            Everything you need to master branching strategies, CI checks, and release automation.
          </p>
        </div>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
            gap: '20px',
          }}
        >
          {/* Card 1 */}
          <div
            className="card-panel"
            style={{ padding: '24px', cursor: 'pointer' }}
            onClick={onLaunchLab}
          >
            <div style={{ width: '42px', height: '42px', borderRadius: '10px', background: 'rgba(56, 189, 248, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#38bdf8', marginBottom: '16px' }}>
              <GitBranch size={22} />
            </div>
            <h3 style={{ fontSize: '16px', fontWeight: '700', marginBottom: '8px', color: 'var(--text-primary)' }}>
              Interactive Git DAG
            </h3>
            <p style={{ fontSize: '13px', color: 'var(--text-secondary)', lineHeight: '1.5' }}>
              Simulate GitFlow, Trunk-Based, and GitHub Flow with interactive commits, parent pointers, and SVG branch rails.
            </p>
          </div>

          {/* Card 2 */}
          <div
            className="card-panel"
            style={{ padding: '24px', cursor: 'pointer' }}
            onClick={onLaunchLab}
          >
            <div style={{ width: '42px', height: '42px', borderRadius: '10px', background: 'rgba(16, 185, 129, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#34d399', marginBottom: '16px' }}>
              <Play size={22} />
            </div>
            <h3 style={{ fontSize: '16px', fontWeight: '700', marginBottom: '8px', color: 'var(--text-primary)' }}>
              CI/CD Pipeline Simulator
            </h3>
            <p style={{ fontSize: '13px', color: 'var(--text-secondary)', lineHeight: '1.5' }}>
              Execute Lint, Vitest tests, SAST security audits, and Vite builds. Test Chaos Controls to inject build failures.
            </p>
          </div>

          {/* Card 3 */}
          <div
            className="card-panel"
            style={{ padding: '24px', cursor: 'pointer' }}
            onClick={onLaunchLab}
          >
            <div style={{ width: '42px', height: '42px', borderRadius: '10px', background: 'rgba(245, 158, 11, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#f59e0b', marginBottom: '16px' }}>
              <GitMerge size={22} />
            </div>
            <h3 style={{ fontSize: '16px', fontWeight: '700', marginBottom: '8px', color: 'var(--text-primary)' }}>
              Merge Conflict Studio
            </h3>
            <p style={{ fontSize: '13px', color: 'var(--text-secondary)', lineHeight: '1.5' }}>
              Practice resolving 3-way Git merge conflicts with realistic diff markers (&lt;&lt;&lt;&lt;&lt;&lt;&lt; HEAD) and previewing output.
            </p>
          </div>

          {/* Card 4 */}
          <div
            className="card-panel"
            style={{ padding: '24px', cursor: 'pointer' }}
            onClick={onLaunchLab}
          >
            <div style={{ width: '42px', height: '42px', borderRadius: '10px', background: 'rgba(168, 85, 247, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#a855f7', marginBottom: '16px' }}>
              <Trophy size={22} />
            </div>
            <h3 style={{ fontSize: '16px', fontWeight: '700', marginBottom: '8px', color: 'var(--text-primary)' }}>
              DevOps Trophy Room
            </h3>
            <p style={{ fontSize: '13px', color: 'var(--text-secondary)', lineHeight: '1.5' }}>
              Earn XP, unlock 5 unique achievements, and progress from Apprentice up to Principal SRE Architect.
            </p>
          </div>
        </div>
      </section>

      {/* University Footer */}
      <footer
        style={{
          borderTop: '1px solid var(--border-subtle)',
          padding: '28px 24px',
          background: 'rgba(12, 18, 30, 0.7)',
          textAlign: 'center',
          fontSize: '12px',
          color: 'var(--text-muted)',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '10px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px', flexWrap: 'wrap' }}>
          <span><strong>DevOps School Project</strong> — Soproni Egyetem</span>
          <span>•</span>
          <a
            href="https://branchlab.me"
            target="_blank"
            rel="noopener noreferrer"
            style={{ color: '#38bdf8', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '4px' }}
          >
            <Globe size={12} /> branchlab.me
          </a>
          <span>•</span>
          <a
            href="https://github.com/Petya122/branchlab"
            target="_blank"
            rel="noopener noreferrer"
            style={{ color: 'var(--text-secondary)', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '4px' }}
          >
            <GithubIcon /> Petya122/branchlab
          </a>
        </div>
        <div>Continuous Deployment verified with Vitest & Vercel Edge Network.</div>
      </footer>
    </div>
  )
}
