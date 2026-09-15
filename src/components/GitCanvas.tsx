import React from 'react'
import type { Commit, GitGraphState } from '../types/git'

interface GitCanvasProps {
  state: GitGraphState
  selectedCommitId: string | null
  onSelectCommit: (commit: Commit) => void
}

interface NodePosition {
  x: number
  y: number
  commit: Commit
  branchIndex: number
}

export const GitCanvas: React.FC<GitCanvasProps> = ({
  state,
  selectedCommitId,
  onSelectCommit,
}) => {
  // Map branch names to fixed vertical lanes (lanes sorted logically)
  const branchNames = Object.keys(state.branches)
  const sortedBranches = ['main', 'develop', ...branchNames.filter((b) => b !== 'main' && b !== 'develop')]
  const branchLaneMap: Record<string, number> = {}
  sortedBranches.forEach((name, index) => {
    branchLaneMap[name] = index
  })

  // Calculate coordinates
  const nodePositions: Record<string, NodePosition> = {}
  const LANE_HEIGHT = 65
  const STEP_WIDTH = 90
  const PADDING_X = 60
  const PADDING_Y = 50

  state.commits.forEach((commit, index) => {
    const lane = branchLaneMap[commit.branch] ?? 0
    nodePositions[commit.id] = {
      x: PADDING_X + index * STEP_WIDTH,
      y: PADDING_Y + lane * LANE_HEIGHT,
      commit,
      branchIndex: lane,
    }
  })

  const totalWidth = Math.max(700, PADDING_X * 2 + state.commits.length * STEP_WIDTH)
  const totalHeight = Math.max(340, PADDING_Y * 2 + sortedBranches.length * LANE_HEIGHT)

  return (
    <div className="canvas-wrapper">
      <div style={{ flex: 1, overflow: 'auto', position: 'relative' }}>
        <svg
          className="canvas-svg"
          viewBox={`0 0 ${totalWidth} ${totalHeight}`}
          style={{ minWidth: `${totalWidth}px`, minHeight: `${totalHeight}px` }}
        >
          <defs>
            <linearGradient id="lineGlow" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#38bdf8" stopOpacity="0.8" />
              <stop offset="100%" stopColor="#a855f7" stopOpacity="0.8" />
            </linearGradient>
            <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="3" result="glow" />
              <feComposite in="SourceGraphic" in2="glow" operator="over" />
            </filter>
          </defs>

          {/* Lane Background Tracks */}
          {sortedBranches.map((branchName, idx) => {
            const laneY = PADDING_Y + idx * LANE_HEIGHT
            const branchColor = state.branches[branchName]?.color || '#38bdf8'
            return (
              <g key={`lane-${branchName}`}>
                <line
                  x1={30}
                  y1={laneY}
                  x2={totalWidth - 30}
                  y2={laneY}
                  stroke={branchColor}
                  strokeOpacity="0.12"
                  strokeWidth="2"
                  strokeDasharray="4 4"
                />
                <text
                  x={32}
                  y={laneY - 10}
                  fill={branchColor}
                  fontSize="11"
                  fontFamily="var(--font-mono)"
                  fontWeight="600"
                  opacity="0.85"
                >
                  {branchName}
                  {state.activeBranch === branchName ? ' (HEAD)' : ''}
                </text>
              </g>
            )
          })}

          {/* Commit Connection Edges (Bézier curves) */}
          {state.commits.map((commit) => {
            const targetPos = nodePositions[commit.id]
            if (!targetPos) return null

            return commit.parents.map((parentId) => {
              const parentPos = nodePositions[parentId]
              if (!parentPos) return null

              const branchColor = state.branches[commit.branch]?.color || '#38bdf8'
              const isCrossLane = parentPos.y !== targetPos.y

              if (!isCrossLane) {
                return (
                  <line
                    key={`edge-${parentId}-${commit.id}`}
                    x1={parentPos.x}
                    y1={parentPos.y}
                    x2={targetPos.x}
                    y2={targetPos.y}
                    stroke={branchColor}
                    strokeWidth="3"
                    opacity="0.75"
                  />
                )
              }

              // Smooth curved cubic bezier for branch/merge lines
              const midX = (parentPos.x + targetPos.x) / 2
              const pathD = `M ${parentPos.x} ${parentPos.y} C ${midX} ${parentPos.y}, ${midX} ${targetPos.y}, ${targetPos.x} ${targetPos.y}`

              return (
                <path
                  key={`curve-${parentId}-${commit.id}`}
                  d={pathD}
                  fill="none"
                  stroke={commit.isMerge ? '#38bdf8' : branchColor}
                  strokeWidth="3"
                  strokeDasharray={commit.isMerge ? '4 2' : undefined}
                  opacity="0.8"
                />
              )
            })
          })}

          {/* Commit Nodes */}
          {state.commits.map((commit) => {
            const pos = nodePositions[commit.id]
            if (!pos) return null

            const isSelected = selectedCommitId === commit.id
            const isHead = state.headCommitId === commit.id
            const branchColor = state.branches[commit.branch]?.color || '#38bdf8'

            return (
              <g
                key={`node-${commit.id}`}
                style={{ cursor: 'pointer' }}
                onClick={() => onSelectCommit(commit)}
              >
                {/* Selection halo */}
                {isSelected && (
                  <circle
                    cx={pos.x}
                    cy={pos.y}
                    r="19"
                    fill="none"
                    stroke="#38bdf8"
                    strokeWidth="2.5"
                    strokeDasharray="3 3"
                    filter="url(#glow)"
                  />
                )}

                {/* Head pulse */}
                {isHead && !isSelected && (
                  <circle
                    cx={pos.x}
                    cy={pos.y}
                    r="16"
                    fill="none"
                    stroke={branchColor}
                    strokeWidth="1.5"
                    opacity="0.6"
                  />
                )}

                {/* Main Node Circle */}
                <circle
                  cx={pos.x}
                  cy={pos.y}
                  r="12"
                  fill="#0c121e"
                  stroke={branchColor}
                  strokeWidth="3.5"
                />

                {/* Inner dot */}
                <circle
                  cx={pos.x}
                  cy={pos.y}
                  r="4"
                  fill={isHead ? branchColor : '#f8fafc'}
                />

                {/* Short SHA label */}
                <text
                  x={pos.x}
                  y={pos.y + 26}
                  textAnchor="middle"
                  fill="#94a3b8"
                  fontSize="11"
                  fontFamily="var(--font-mono)"
                  fontWeight="600"
                >
                  {commit.hash}
                </text>

                {/* Tag badge if present */}
                {commit.tag && (
                  <g transform={`translate(${pos.x - 22}, ${pos.y - 28})`}>
                    <rect
                      x="0"
                      y="0"
                      width="44"
                      height="15"
                      rx="7"
                      fill="#f43f5e"
                      opacity="0.9"
                    />
                    <text
                      x="22"
                      y="11"
                      textAnchor="middle"
                      fill="#ffffff"
                      fontSize="9"
                      fontWeight="bold"
                      fontFamily="var(--font-mono)"
                    >
                      {commit.tag}
                    </text>
                  </g>
                )}
              </g>
            )
          })}
        </svg>
      </div>

      {/* Legend & Branch Indicators */}
      <div className="canvas-legend">
        {sortedBranches.map((branchName) => {
          const color = state.branches[branchName]?.color || '#38bdf8'
          const isCurrent = state.activeBranch === branchName
          return (
            <div
              key={`legend-${branchName}`}
              className="legend-item"
              style={{
                fontWeight: isCurrent ? 'bold' : 'normal',
                color: isCurrent ? '#f8fafc' : 'var(--text-secondary)',
              }}
            >
              <span className="legend-dot" style={{ backgroundColor: color }} />
              <span>{branchName}</span>
              {isCurrent && <span style={{ color: '#38bdf8', fontSize: '10px' }}>★</span>}
            </div>
          )
        })}
      </div>
    </div>
  )
}
