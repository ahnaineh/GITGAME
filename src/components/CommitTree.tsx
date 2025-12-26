import { motion } from 'framer-motion'
import { useEffect, useMemo, useRef, useState } from 'react'
import type { MouseEvent } from 'react'
import { useGameStore } from '../store/gameStore'

const laneColors = ['#3f6a60', '#d47054', '#4b8a7a', '#b9813a', '#5b7d91']

const getLaneColor = (lane: number) => {
  if (lane === 0) {
    return laneColors[0]
  }
  const index = Math.abs(lane) % (laneColors.length - 1)
  return laneColors[index + 1]
}

export const CommitTree = () => {
  const repo = useGameStore((state) => state.repo)
  const commits = repo.commits
  const canvasRef = useRef<HTMLDivElement | null>(null)
  const panState = useRef({ active: false, startX: 0, startY: 0, scrollLeft: 0, scrollTop: 0 })
  const [zoom, setZoom] = useState(1)
  const [viewport, setViewport] = useState({ x: 0, y: 0, width: 0, height: 0 })
  const minimapWidth = 180
  const minimapHeight = 140

  const { nodes, edges, branchLabels, width, height } = useMemo(() => {
    const commitMap = new Map(commits.map((commit) => [commit.id, commit]))
    const sorted = [...commits].sort((a, b) => a.timestamp - b.timestamp)

    const localBranches = Object.keys(repo.branches)
    const remoteBranches = Object.keys(repo.remote.branches).map((name) => `origin/${name}`)
    const uniqueBranches = Array.from(new Set([...localBranches, ...remoteBranches]))
    const orderedBranches = [
      ...uniqueBranches.filter((name) => name === 'main'),
      ...uniqueBranches.filter((name) => name !== 'main').sort()
    ]

    const offsets = orderedBranches.map((_, index) => {
      if (index === 0) {
        return 0
      }
      const step = Math.ceil(index / 2)
      return index % 2 === 1 ? step : -step
    })

    const computedWidth = Math.max(720, 260 + orderedBranches.length * 180)
    const laneSpacing = Math.min(210, computedWidth / (orderedBranches.length + 1))
    const centerX = computedWidth / 2

    const branchOffsets = new Map<string, number>()
    orderedBranches.forEach((name, index) => {
      branchOffsets.set(name, offsets[index])
    })

    const commitLane = new Map<string, number>()
    const assignLane = (startId: string | null, offset: number) => {
      if (!startId) {
        return
      }
      const stack = [startId]
      while (stack.length > 0) {
        const current = stack.pop()
        if (!current || commitLane.has(current)) {
          continue
        }
        const commit = commitMap.get(current)
        if (!commit) {
          continue
        }
        commitLane.set(current, offset)
        commit.parents.forEach((parent) => stack.push(parent))
      }
    }

    orderedBranches.forEach((name) => {
      const offset = branchOffsets.get(name) ?? 0
      const headId = name.startsWith('origin/')
        ? repo.remote.branches[name.replace('origin/', '')] ?? null
        : repo.branches[name] ?? null
      assignLane(headId, offset)
    })

    const rowSpacing = 130
    const computedHeight = Math.max(380, 170 + sorted.length * rowSpacing)

    const nodeList = sorted.map((commit, index) => {
      const offset = commitLane.get(commit.id) ?? 0
      const trimmedMessage =
        commit.message.length > 22 ? `${commit.message.slice(0, 22).trim()}...` : commit.message
      return {
        ...commit,
        message: trimmedMessage,
        fullMessage: commit.message,
        isMerge: commit.parents.length > 1,
        x: centerX + offset * laneSpacing,
        y: 90 + index * rowSpacing,
        lane: offset
      }
    })

    const nodeMap = new Map(nodeList.map((node) => [node.id, node]))
    const edgeList = nodeList
      .flatMap((node) =>
        node.parents.map((parent) => {
          const parentNode = nodeMap.get(parent)
          return parentNode
            ? {
                id: `${node.id}-${parent}`,
                x1: node.x,
                y1: node.y,
                x2: parentNode.x,
                y2: parentNode.y,
                lane: node.lane,
                isMerge: node.parents.length > 1
              }
            : null
        })
      )
      .filter((edge) => edge !== null)

    const labelList = orderedBranches
      .map((name) => {
        const headId = name.startsWith('origin/')
          ? repo.remote.branches[name.replace('origin/', '')] ?? null
          : repo.branches[name] ?? null
        if (!headId) {
          return null
        }
        const node = nodeMap.get(headId)
        if (!node) {
          return null
        }
        const labelWidth = Math.max(130, name.length * 8 + 28)
        return {
          name,
          x: node.x + 30,
          y: node.y - 40,
          width: labelWidth,
          isRemote: name.startsWith('origin/')
        }
      })
      .filter((label) => label !== null)

    return {
      nodes: nodeList,
      edges: edgeList,
      branchLabels: labelList,
      width: computedWidth,
      height: computedHeight
    }
  }, [commits, repo.branches, repo.remote.branches])

  useEffect(() => {
    const container = canvasRef.current
    if (!container) {
      return
    }
    const updateViewport = () => {
      const rawWidth = container.clientWidth / zoom
      const rawHeight = container.clientHeight / zoom
      const viewWidth = Math.min(width, rawWidth)
      const viewHeight = Math.min(height, rawHeight)
      const maxX = Math.max(0, width - viewWidth)
      const maxY = Math.max(0, height - viewHeight)
      const x = Math.min(maxX, Math.max(0, container.scrollLeft / zoom))
      const y = Math.min(maxY, Math.max(0, container.scrollTop / zoom))
      setViewport({ x, y, width: viewWidth, height: viewHeight })
    }
    updateViewport()
    container.addEventListener('scroll', updateViewport)
    window.addEventListener('resize', updateViewport)
    return () => {
      container.removeEventListener('scroll', updateViewport)
      window.removeEventListener('resize', updateViewport)
    }
  }, [zoom, nodes.length, width, height])

  useEffect(() => {
    if (!canvasRef.current || nodes.length === 0) {
      return
    }
    const headNode = nodes.find((node) => node.id === repo.head)
    if (!headNode) {
      return
    }
    const container = canvasRef.current
    const targetTop = Math.max(0, headNode.y - container.clientHeight * 0.4)
    const targetLeft = Math.max(0, headNode.x - container.clientWidth * 0.5)
    container.scrollTo({ top: targetTop, left: targetLeft, behavior: 'smooth' })
  }, [nodes, repo.head])

  const handleMouseDown = (event: MouseEvent<HTMLDivElement>) => {
    if (!canvasRef.current || event.button !== 0) {
      return
    }
    panState.current = {
      active: true,
      startX: event.clientX,
      startY: event.clientY,
      scrollLeft: canvasRef.current.scrollLeft,
      scrollTop: canvasRef.current.scrollTop
    }
  }

  const handleMouseMove = (event: MouseEvent<HTMLDivElement>) => {
    if (!canvasRef.current || !panState.current.active) {
      return
    }
    const deltaX = event.clientX - panState.current.startX
    const deltaY = event.clientY - panState.current.startY
    canvasRef.current.scrollLeft = panState.current.scrollLeft - deltaX
    canvasRef.current.scrollTop = panState.current.scrollTop - deltaY
  }

  const handleMouseUp = () => {
    panState.current.active = false
  }

  const handleZoomChange = (value: number) => {
    const clamped = Math.min(1.6, Math.max(0.7, value))
    setZoom(clamped)
  }

  const scaledWidth = width * zoom
  const scaledHeight = height * zoom

  return (
    <section className="panel tree-panel">
      <div className="panel-header compact">
        <div>
          <h2>Timeline Current</h2>
          <p className="subtitle">Branch: {repo.headRef ?? 'main'} • HEAD: {repo.head ?? 'none'}</p>
        </div>
        <div className="tree-controls">
          <button className="secondary" type="button" onClick={() => handleZoomChange(zoom - 0.1)}>
            -
          </button>
          <input
            type="range"
            min={0.7}
            max={1.6}
            step={0.05}
            value={zoom}
            onChange={(event) => handleZoomChange(Number(event.target.value))}
            aria-label="Zoom timeline"
          />
          <button className="secondary" type="button" onClick={() => handleZoomChange(zoom + 0.1)}>
            +
          </button>
          <button className="secondary" type="button" onClick={() => handleZoomChange(1)}>
            Reset
          </button>
        </div>
      </div>

      <div className="tree-wrap">
        <div
          className="tree-canvas"
          ref={canvasRef}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
        >
          {commits.length === 0 ? (
            <div className="empty-tree">No commits yet. Your islands are still drifting.</div>
          ) : (
            <motion.svg
              width={scaledWidth}
              height={scaledHeight}
              viewBox={`0 0 ${width} ${height}`}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.6 }}
            >
              {edges.map((edge) => {
                if (!edge) {
                  return null
                }
                const midY = (edge.y1 + edge.y2) / 2
                return (
                  <path
                    key={edge.id}
                    d={`M ${edge.x1} ${edge.y1} C ${edge.x1} ${midY}, ${edge.x2} ${midY}, ${edge.x2} ${edge.y2}`}
                    className={`tree-line ${edge.isMerge ? 'merge' : ''}`}
                    stroke={getLaneColor(edge.lane)}
                  />
                )
              })}

              {nodes.map((node) => (
                <g key={node.id}>
                  <title>{node.fullMessage}</title>
                  <circle cx={node.x} cy={node.y} r={30} className="tree-node" />
                  {repo.head === node.id ? (
                    <circle cx={node.x} cy={node.y} r={42} className="tree-node head-ring" />
                  ) : null}
                  {node.isMerge ? (
                    <text x={node.x - 6} y={node.y + 5} className="merge-tag">
                      M
                    </text>
                  ) : null}
                  <text x={node.x + 50} y={node.y + 8} className="tree-label">
                    {node.message}
                  </text>
                  <text x={node.x - 98} y={node.y + 8} className="tree-id">
                    {node.id}
                  </text>
                </g>
              ))}

              {branchLabels.map((label) => {
                if (!label) {
                  return null
                }
                return (
                  <g key={label.name} className={`branch-label ${label.isRemote ? 'remote' : ''}`}>
                    <rect x={label.x} y={label.y} rx={10} ry={10} width={label.width} height={26} />
                    <text x={label.x + 10} y={label.y + 17}>
                      {label.name}
                    </text>
                  </g>
                )
              })}
            </motion.svg>
          )}
        </div>
        {commits.length > 0 ? (
          <div className="tree-minimap" aria-hidden="true">
            <svg width={minimapWidth} height={minimapHeight} viewBox={`0 0 ${width} ${height}`}>
              {edges.map((edge) => {
                if (!edge) {
                  return null
                }
                const midY = (edge.y1 + edge.y2) / 2
                return (
                  <path
                    key={`mini-${edge.id}`}
                    d={`M ${edge.x1} ${edge.y1} C ${edge.x1} ${midY}, ${edge.x2} ${midY}, ${edge.x2} ${edge.y2}`}
                    className="minimap-line"
                  />
                )
              })}
              {nodes.map((node) => (
                <circle key={`mini-node-${node.id}`} cx={node.x} cy={node.y} r={8} className="minimap-node" />
              ))}
              <rect
                className="minimap-viewport"
                x={viewport.x}
                y={viewport.y}
                width={viewport.width}
                height={viewport.height}
              />
            </svg>
          </div>
        ) : null}
      </div>
    </section>
  )
}
