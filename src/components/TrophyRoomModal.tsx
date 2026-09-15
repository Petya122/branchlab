import React from 'react'
import {
  Trophy as TrophyIcon,
  X,
  Award,
  ShieldCheck,
  Flame,
  GitMerge,
  GitPullRequest,
  Zap,
  Lock,
} from 'lucide-react'
import {
  INITIAL_TROPHIES,
  calculateDevOpsLevel,
  type TrophyState,
} from '../utils/trophies'

interface TrophyRoomModalProps {
  isOpen: boolean
  trophyState: TrophyState
  onClose: () => void
}

export const TrophyRoomModal: React.FC<TrophyRoomModalProps> = ({
  isOpen,
  trophyState,
  onClose,
}) => {
  if (!isOpen) return null

  const levelInfo = calculateDevOpsLevel(trophyState.xp)

  const getTrophyIcon = (iconName: string, isUnlocked: boolean) => {
    const color = isUnlocked ? '#38bdf8' : '#64748b'
    const size = 20
    switch (iconName) {
      case 'ShieldCheck':
        return <ShieldCheck size={size} color={isUnlocked ? '#34d399' : color} />
      case 'Flame':
        return <Flame size={size} color={isUnlocked ? '#f59e0b' : color} />
      case 'GitMerge':
        return <GitMerge size={size} color={isUnlocked ? '#a855f7' : color} />
      case 'GitPullRequest':
        return <GitPullRequest size={size} color={isUnlocked ? '#ec4899' : color} />
      case 'Zap':
        return <Zap size={size} color={isUnlocked ? '#eab308' : color} />
      default:
        return <Award size={size} color={color} />
    }
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" style={{ maxWidth: '640px' }} onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div
              style={{
                width: '36px',
                height: '36px',
                borderRadius: '10px',
                background: 'linear-gradient(135deg, #f59e0b, #ef4444)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#ffffff',
                boxShadow: '0 0 16px rgba(245, 158, 11, 0.4)',
              }}
            >
              <TrophyIcon size={20} />
            </div>
            <div>
              <div style={{ fontSize: '16px', fontWeight: '700', color: 'var(--text-primary)' }}>
                DevOps Trophy Room
              </div>
              <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                Personal browser achievements ({trophyState.unlockedIds.length} / {INITIAL_TROPHIES.length} unlocked)
              </div>
            </div>
          </div>
          <button onClick={onClose} style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}>
            <X size={18} />
          </button>
        </div>

        {/* Level & Rank Card */}
        <div
          style={{
            background: 'linear-gradient(135deg, rgba(14, 165, 233, 0.12), rgba(168, 85, 247, 0.12))',
            border: '1px solid rgba(56, 189, 248, 0.25)',
            borderRadius: 'var(--radius-md)',
            padding: '14px',
            marginBottom: '16px',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
            <div>
              <span style={{ fontSize: '11px', color: '#38bdf8', fontWeight: 'bold', textTransform: 'uppercase' }}>
                Level {levelInfo.level}
              </span>
              <div style={{ fontSize: '15px', fontWeight: '700', color: '#f8fafc' }}>
                {levelInfo.rank}
              </div>
            </div>
            <div style={{ textAlign: 'right' }}>
              <span style={{ fontSize: '16px', fontWeight: '800', color: '#34d399' }}>
                {trophyState.xp}
              </span>
              <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}> Total XP</span>
            </div>
          </div>

          {/* XP Progress Bar */}
          <div
            style={{
              width: '100%',
              height: '8px',
              background: 'rgba(255, 255, 255, 0.08)',
              borderRadius: '4px',
              overflow: 'hidden',
            }}
          >
            <div
              style={{
                width: `${levelInfo.progressPct}%`,
                height: '100%',
                background: 'linear-gradient(to right, #38bdf8, #a855f7)',
                transition: 'width 0.4s ease',
              }}
            />
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '6px', fontSize: '11px', color: 'var(--text-muted)' }}>
            <span>{levelInfo.currentXp} XP in level</span>
            <span>{levelInfo.nextLevelXp} XP to next level</span>
          </div>
        </div>

        {/* Trophies Grid */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '320px', overflowY: 'auto' }}>
          {INITIAL_TROPHIES.map((trophy) => {
            const isUnlocked = trophyState.unlockedIds.includes(trophy.id)
            return (
              <div
                key={trophy.id}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '12px 14px',
                  borderRadius: 'var(--radius-md)',
                  background: isUnlocked ? 'var(--bg-surface-elevated)' : 'rgba(255, 255, 255, 0.02)',
                  border: `1px solid ${isUnlocked ? 'rgba(56, 189, 248, 0.3)' : 'var(--border-subtle)'}`,
                  opacity: isUnlocked ? 1 : 0.65,
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <div
                    style={{
                      width: '36px',
                      height: '36px',
                      borderRadius: '8px',
                      background: isUnlocked ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0,0,0,0.2)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    {isUnlocked ? (
                      getTrophyIcon(trophy.icon, true)
                    ) : (
                      <Lock size={16} color="var(--text-muted)" />
                    )}
                  </div>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <span style={{ fontSize: '13px', fontWeight: '600', color: isUnlocked ? 'var(--text-primary)' : 'var(--text-secondary)' }}>
                        {trophy.title}
                      </span>
                      {isUnlocked && (
                        <span
                          style={{
                            fontSize: '9px',
                            background: 'rgba(52, 211, 153, 0.15)',
                            color: '#34d399',
                            padding: '1px 6px',
                            borderRadius: '10px',
                            fontWeight: 'bold',
                          }}
                        >
                          UNLOCKED
                        </span>
                      )}
                    </div>
                    <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                      {trophy.description}
                    </div>
                  </div>
                </div>

                <div style={{ textAlign: 'right' }}>
                  <span
                    style={{
                      fontSize: '12px',
                      fontWeight: '700',
                      color: isUnlocked ? '#38bdf8' : 'var(--text-muted)',
                    }}
                  >
                    +{trophy.xp} XP
                  </span>
                </div>
              </div>
            )
          })}
        </div>

        {/* Footer */}
        <div className="modal-actions" style={{ marginTop: '16px' }}>
          <button type="button" className="action-btn btn-ghost" onClick={onClose}>
            Close
          </button>
        </div>
      </div>
    </div>
  )
}
