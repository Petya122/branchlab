import React from 'react'
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
          <div style={{ width: '100%', height: '245px', position: 'relative' }}>
            <svg viewBox="0 0 900 245" style={{ width: '100%', height: '100%' }}>
              <defs>
                {/* Fixed Linear Gradients with userSpaceOnUse for robust cross-browser rendering */}
                <linearGradient id="mainRail" gradientUnits="userSpaceOnUse" x1="50" y1="55" x2="840" y2="55">
                  <stop offset="0%" stopColor="#10b981" />
                  <stop offset="60%" stopColor="#34d399" />
                  <stop offset="100%" stopColor="#38bdf8" />
                </linearGradient>

                <linearGradient id="developRail" gradientUnits="userSpaceOnUse" x1="160" y1="125" x2="710" y2="125">
                  <stop offset="0%" stopColor="#06b6d4" />
                  <stop offset="100%" stopColor="#38bdf8" />
                </linearGradient>

                <linearGradient id="featureRail" gradientUnits="userSpaceOnUse" x1="340" y1="125" x2="610" y2="195">
                  <stop offset="0%" stopColor="#38bdf8" />
                  <stop offset="50%" stopColor="#a855f7" />
                  <stop offset="100%" stopColor="#06b6d4" />
                </linearGradient>

                <linearGradient id="prRail" gradientUnits="userSpaceOnUse" x1="710" y1="125" x2="810" y2="55">
                  <stop offset="0%" stopColor="#06b6d4" />
                  <stop offset="50%" stopColor="#f59e0b" />
                  <stop offset="100%" stopColor="#10b981" />
                </linearGradient>

                <filter id="pulseGlow" x="-30%" y="-30%" width="160%" height="160%">
                  <feGaussianBlur stdDeviation="5" result="glow" />
                  <feComposite in="SourceGraphic" in2="glow" operator="over" />
                </filter>

                {/* Motion Path 1: Feature Flow (main -> develop -> feature/auth -> develop merge -> release PR -> deploy) */}
                <path
                  id="featureFlowPath"
                  d="M 160 55 C 190 55, 200 125, 230 125 L 340 125 C 375 125, 385 195, 420 195 L 530 195 C 570 195, 585 125, 610 125 L 710 125 C 745 125, 765 55, 810 55"
                  fill="none"
                />

                {/* Motion Path 2: Continuous Trunk Flow on main */}
                <path
                  id="mainDirectPath"
                  d="M 50 55 L 810 55"
                  fill="none"
                />
              </defs>

              {/* 1. MAIN BRANCH RAIL */}
              <line x1="50" y1="55" x2="840" y2="55" stroke="url(#mainRail)" strokeWidth="4" strokeLinecap="round" opacity="0.9" />
              {/* Main Fiber Stream Pulse */}
              <line x1="50" y1="55" x2="840" y2="55" stroke="#34d399" strokeWidth="2" strokeDasharray="8 12" opacity="0.6">
                <animate attributeName="stroke-dashoffset" from="0" to="-40" dur="2s" repeatCount="indefinite" />
              </line>

              {/* Main Branch Pill Badge */}
              <rect x="65" y="15" width="186" height="22" rx="5" fill="#06090e" stroke="rgba(16, 185, 129, 0.45)" strokeWidth="1" />
              <circle cx="77" cy="26" r="3.5" fill="#10b981" />
              <text x="88" y="30" fill="#10b981" fontSize="10.5" fontFamily="var(--font-mono)" fontWeight="700">
                main (v1.0.0 → branchlab.me)
              </text>

              {/* 2. DEVELOP BRANCH RAIL & CONNECTION */}
              {/* Branch curve from main to develop */}
              <path
                d="M 160 55 C 190 55, 200 125, 230 125"
                fill="none"
                stroke="url(#developRail)"
                strokeWidth="3"
                strokeDasharray="5 3"
              />
              {/* Develop horizontal line */}
              <line x1="230" y1="125" x2="710" y2="125" stroke="url(#developRail)" strokeWidth="3" strokeDasharray="5 3" opacity="0.85" />
              {/* Develop Fiber Stream */}
              <line x1="230" y1="125" x2="710" y2="125" stroke="#38bdf8" strokeWidth="1.5" strokeDasharray="6 8" opacity="0.7">
                <animate attributeName="stroke-dashoffset" from="0" to="-28" dur="2.5s" repeatCount="indefinite" />
              </line>

              {/* Develop Branch Pill Badge */}
              <rect x="210" y="86" width="140" height="20" rx="4" fill="#06090e" stroke="rgba(6, 182, 212, 0.4)" strokeWidth="1" />
              <circle cx="221" cy="96" r="3" fill="#06b6d4" />
              <text x="230" y="100" fill="#38bdf8" fontSize="10" fontFamily="var(--font-mono)" fontWeight="600">
                develop (staging)
              </text>

              {/* 3. FEATURE/AUTH BRANCH RAIL & CURVES */}
              {/* Curve down from develop to feature */}
              <path
                d="M 340 125 C 375 125, 385 195, 420 195"
                fill="none"
                stroke="url(#featureRail)"
                strokeWidth="3.5"
              />
              {/* Feature horizontal track */}
              <line x1="420" y1="195" x2="530" y2="195" stroke="url(#featureRail)" strokeWidth="3.5" />
              {/* Curve back up into develop merge node */}
              <path
                d="M 530 195 C 570 195, 585 125, 610 125"
                fill="none"
                stroke="url(#featureRail)"
                strokeWidth="3.5"
              />

              {/* Feature Branch Pill Badge (Placed cleanly above the feature rail to prevent text collision) */}
              <rect x="385" y="156" width="175" height="20" rx="4" fill="#06090e" stroke="rgba(168, 85, 247, 0.4)" strokeWidth="1" />
              <circle cx="396" cy="166" r="3" fill="#a855f7" />
              <text x="405" y="170" fill="#c084fc" fontSize="10" fontFamily="var(--font-mono)" fontWeight="600">
                feature/auth (student SSO)
              </text>

              {/* 4. RELEASE PULL REQUEST PROMOTION CURVE */}
              <path
                d="M 710 125 C 745 125, 765 55, 810 55"
                fill="none"
                stroke="url(#prRail)"
                strokeWidth="3.5"
              />
              <path
                d="M 710 125 C 745 125, 765 55, 810 55"
                fill="none"
                stroke="#f59e0b"
                strokeWidth="2"
                strokeDasharray="4 4"
              >
                <animate attributeName="stroke-dashoffset" from="0" to="-32" dur="1.8s" repeatCount="indefinite" />
              </path>

              {/* PR Release Badge */}
              <rect x="715" y="70" width="88" height="18" rx="4" fill="#06090e" stroke="rgba(245, 158, 11, 0.4)" strokeWidth="1" />
              <text x="722" y="83" fill="#f59e0b" fontSize="9" fontFamily="var(--font-mono)" fontWeight="600">
                PR #42 (Release)
              </text>

              {/* 5. STATIC COMMITS (Each in its own vertical lane without overlap) */}
              {[
                { cx: 90, cy: 55, color: '#10b981', sha: 'v0.9.0' },
                { cx: 270, cy: 125, color: '#06b6d4', sha: '4d5e6f' },
                { cx: 460, cy: 195, color: '#a855f7', sha: '7g8h9i' },
                { cx: 530, cy: 195, color: '#a855f7', sha: '0j1k2l' },
                { cx: 610, cy: 125, color: '#06b6d4', sha: '3m4n5o', isMerge: true },
                { cx: 810, cy: 55, color: '#10b981', sha: 'deploy', isMerge: true },
              ].map((node, idx) => (
                <g key={`hero-node-${idx}`}>
                  {/* Outer ring */}
                  <circle cx={node.cx} cy={node.cy} r={node.isMerge ? '11' : '9'} fill="#06090e" stroke={node.color} strokeWidth="3" />
                  {/* Inner center */}
                  <circle cx={node.cx} cy={node.cy} r="3.5" fill={node.color} />
                  {/* SHA label placed cleanly below */}
                  <text
                    x={node.cx}
                    y={node.cy + 20}
                    fill="var(--text-muted)"
                    fontSize="10"
                    fontFamily="var(--font-mono)"
                    textAnchor="middle"
                  >
                    {node.sha}
                  </text>
                </g>
              ))}

              {/* Deploy Radar Beacon Ping (Pulses outward from the deploy node) */}
              <circle cx="810" cy="55" r="14" fill="none" stroke="#10b981" strokeWidth="2" opacity="0.8">
                <animate attributeName="r" values="11;24" dur="2.2s" repeatCount="indefinite" />
                <animate attributeName="opacity" values="0.85;0" dur="2.2s" repeatCount="indefinite" />
              </circle>

              {/* 6. TRAVELING PULSE ORBS ALONG THE REAL CURVES */}
              {/* Orb 1: Flows along Feature Flow (main -> develop -> feature -> merge -> deploy) */}
              <g>
                <circle r="7" fill="#ffffff" filter="url(#pulseGlow)">
                  <animateMotion dur="6s" repeatCount="indefinite" rotate="auto">
                    <mpath href="#featureFlowPath" />
                  </animateMotion>
                </circle>
                <circle r="4" fill="#38bdf8">
                  <animateMotion dur="6s" repeatCount="indefinite" rotate="auto">
                    <mpath href="#featureFlowPath" />
                  </animateMotion>
                </circle>
              </g>

              {/* Orb 2: Continuous Trunk Stream on main */}
              <g>
                <circle r="6" fill="#34d399" opacity="0.95" filter="url(#pulseGlow)">
                  <animateMotion dur="4.2s" begin="2.1s" repeatCount="indefinite">
                    <mpath href="#mainDirectPath" />
                  </animateMotion>
                </circle>
                <circle r="3" fill="#ffffff">
                  <animateMotion dur="4.2s" begin="2.1s" repeatCount="indefinite">
                    <mpath href="#mainDirectPath" />
                  </animateMotion>
                </circle>
              </g>
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
