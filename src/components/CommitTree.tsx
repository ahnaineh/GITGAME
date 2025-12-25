import { motion } from 'framer-motion'
import { useMemo } from 'react'
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

    const computedWidth = Math.max(640, 220 + orderedBranches.length * 160)
    const laneSpacing = Math.min(190, computedWidth / (orderedBranches.length + 1))
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
      return {
        ...commit,
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
                lane: node.lane
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
        const labelWidth = Math.max(110, name.length * 7 + 24)
        return {
          name,
          x: node.x + 24,
          y: node.y - 36,
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

  return (
    <section className="panel tree-panel">
      <div className="panel-header compact">
        <h2>Timeline Current</h2>
        <p className="subtitle">Branch: {repo.headRef ?? 'main'} • HEAD: {repo.head ?? 'none'}</p>
      </div>

      <div className="tree-canvas">
        {commits.length === 0 ? (
          <div className="empty-tree">No commits yet. Your islands are still drifting.</div>
        ) : (
          <motion.svg
            width="100%"
            height={height}
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
                  className="tree-line"
                  stroke={getLaneColor(edge.lane)}
                />
              )
            })}

            {nodes.map((node) => (
              <g key={node.id}>
                <circle cx={node.x} cy={node.y} r={30} className="tree-node" />
                {repo.head === node.id ? (
                  <circle cx={node.x} cy={node.y} r={42} className="tree-node head-ring" />
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
    </section>
  )
}
