import type { GameSnapshot } from './types'

export type Achievement = {
  id: string
  title: string
  description: string
  check: (state: GameSnapshot) => boolean
}

export const achievements: Achievement[] = [
  {
    id: 'first-anchor',
    title: 'First Anchor',
    description: 'Initialize your first timeline.',
    check: (state) => state.actions.includes('init')
  },
  {
    id: 'first-beacon',
    title: 'First Beacon',
    description: 'Make your first commit.',
    check: (state) => state.actions.includes('commit')
  },
  {
    id: 'branch-scout',
    title: 'Branch Scout',
    description: 'Create a second branch.',
    check: (state) => Object.keys(state.repo.branches).length >= 2
  },
  {
    id: 'storm-calmer',
    title: 'Storm Calmer',
    description: 'Resolve a merge conflict.',
    check: (state) => state.actions.some((action) => action.startsWith('resolve:'))
  },
  {
    id: 'signal-sent',
    title: 'Signal Sent',
    description: 'Push your work to origin.',
    check: (state) => state.actions.includes('push')
  },
  {
    id: 'timeline-rescuer',
    title: 'Timeline Rescuer',
    description: 'Recover from a bad commit with reset.',
    check: (state) => state.actions.includes('reset')
  },
  {
    id: 'selective-savior',
    title: 'Selective Savior',
    description: 'Cherry-pick a single fix across branches.',
    check: (state) => state.actions.includes('cherry-pick')
  },
  {
    id: 'public-healer',
    title: 'Public Healer',
    description: 'Revert a commit without rewriting history.',
    check: (state) => state.actions.includes('revert')
  }
]
