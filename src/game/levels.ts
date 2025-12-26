import { Level, RepoState } from './types'

const createBaseRepo = (overrides: Partial<RepoState>): RepoState => ({
  isInitialized: false,
  branches: {},
  headRef: null,
  head: null,
  commits: [],
  workingTree: {},
  index: {},
  conflicts: {},
  merge: { inProgress: false, target: null, targetBranch: null },
  remote: { branches: {}, commits: [] },
  ...overrides
})

const levelOne: Level = {
  id: 1,
  title: 'First Commit Island',
  chapter: 'Chapter 1: Boot Camp',
  story: [
    'You arrive at the Archipelago with a blank chart and a crew that trusts you.',
    'To stop the islands drifting, you must anchor the first timeline.',
    'Initialize the repo, read the shoreline, stage the map, and set your first beacon.'
  ],
  completion: ['The island locks into place.', 'New currents appear beyond the horizon.'],
  steps: [
    {
      id: 'init',
      text: 'Initialize the timeline with git init.',
      success: 'The anchor drops. The timeline is alive.',
      check: (state) => state.actions.includes('init')
    },
    {
      id: 'status',
      text: 'Inspect the shoreline with git status.',
      success: 'You read the tide report.',
      check: (state) => state.actions.includes('status')
    },
    {
      id: 'add-map',
      text: 'Stage map.txt using git add.',
      success: 'The map is secured in the staging cove.',
      check: (state) => state.actions.includes('add:map.txt')
    },
    {
      id: 'commit',
      text: 'Record your first repair with git commit -m "message".',
      success: 'First beacon lit. The island steadies.',
      check: (state) => state.actions.includes('commit')
    }
  ],
  hints: [
    'Try: git init',
    'git status shows what is staged, modified, or untracked.',
    'Use git add map.txt to stage the map.',
    'Commit with git commit -m "your message".'
  ],
  suggestedCommands: [
    'git init',
    'git status',
    'git add map.txt',
    'git commit -m "Anchor the island"'
  ],
  referenceCommands: ['git init', 'git status', 'git add <file>', 'git commit -m "message"', 'git log'],
  xpReward: 100,
  initialRepo: createBaseRepo({
    isInitialized: false,
    workingTree: {
      'map.txt': 'A rough chart of currents and islands.'
    }
  })
}

const levelTwo: Level = {
  id: 2,
  title: 'Tide Notes',
  chapter: 'Chapter 1: Boot Camp',
  story: [
    'The first beacon holds, but the map is still rough.',
    'Refine the chart, verify your status, and commit the update.'
  ],
  completion: ['The chart sharpens. The currents obey the new record.', 'You are ready to explore branching routes.'],
  steps: [
    {
      id: 'edit-map',
      text: 'Update map.txt in the working directory.',
      success: 'Your notes deepen the chart.',
      check: (state) => state.actions.includes('worktree:update:map.txt')
    },
    {
      id: 'status',
      text: 'Check git status after editing.',
      success: 'You confirm the changes are real.',
      check: (state) => state.actions.includes('status')
    },
    {
      id: 'add-map',
      text: 'Stage the updated map.txt.',
      success: 'The refined chart is staged.',
      check: (state) => state.actions.includes('add:map.txt')
    },
    {
      id: 'commit',
      text: 'Commit the updated map.',
      success: 'A second beacon locks the detail in place.',
      check: (state) => state.actions.includes('commit')
    }
  ],
  hints: [
    'Edit map.txt in the Working Directory panel.',
    'Use git status to confirm the file is modified.',
    'Stage with git add map.txt.',
    'Commit with git commit -m "message".'
  ],
  suggestedCommands: ['', 'git status', 'git add map.txt', 'git commit -m "Refine the currents"'],
  referenceCommands: ['git status', 'git add <file>', 'git commit -m "message"', 'git log'],
  xpReward: 100,
  initialRepo: createBaseRepo({
    isInitialized: true,
    branches: { main: 'c001' },
    headRef: 'main',
    head: 'c001',
    commits: [
      {
        id: 'c001',
        message: 'Anchor the island',
        tree: { 'map.txt': 'A rough chart of currents and islands.' },
        timestamp: 1710000000000,
        parents: []
      }
    ],
    workingTree: { 'map.txt': 'A rough chart of currents and islands.' }
  })
}

const levelThree: Level = {
  id: 3,
  title: 'Branch Canyon',
  chapter: 'Chapter 2: Forked Paths',
  story: [
    'Two currents split around a jagged canyon. You need a safer route for new work.',
    'Create a branch called "feature" and chart a fresh path.',
    'Record a logbook entry before you return.'
  ],
  completion: [
    'A new route is secured. The feature branch holds its own history.',
    'Now return to the main current and set your next beacon.'
  ],
  steps: [
    {
      id: 'branch',
      text: 'Create a new branch named feature.',
      success: 'A side current opens for safe exploration.',
      check: (state) => Object.prototype.hasOwnProperty.call(state.repo.branches, 'feature')
    },
    {
      id: 'switch',
      text: 'Switch to the feature branch.',
      success: 'You ride the new current.',
      check: (state) => state.repo.headRef === 'feature'
    },
    {
      id: 'logbook',
      text: 'Create logbook.md in the working directory.',
      success: 'A new logbook appears in your pack.',
      check: (state) => Object.prototype.hasOwnProperty.call(state.repo.workingTree, 'logbook.md')
    },
    {
      id: 'add-logbook',
      text: 'Stage logbook.md with git add.',
      success: 'The logbook is secured for record.',
      check: (state) => state.actions.includes('add:logbook.md')
    },
    {
      id: 'commit-logbook',
      text: 'Commit your logbook entry on the feature branch.',
      success: 'The new route is officially recorded.',
      check: (state) => state.actions.includes('commit') && state.repo.headRef === 'feature'
    }
  ],
  hints: [
    'Use git branch feature to create a new branch.',
    'Switch branches with git switch feature.',
    'Create a file in the Working Directory panel, then stage it.',
    'Commit with git commit -m "message".'
  ],
  suggestedCommands: [
    'git branch feature',
    'git switch feature',
    '',
    'git add logbook.md',
    'git commit -m "Map the canyon"'
  ],
  referenceCommands: [
    'git branch <name>',
    'git switch <name>',
    'git checkout -b <name>',
    'git status',
    'git log'
  ],
  xpReward: 100,
  initialRepo: createBaseRepo({
    isInitialized: true,
    branches: { main: 'c002' },
    headRef: 'main',
    head: 'c002',
    commits: [
      {
        id: 'c001',
        message: 'Chart the shoals',
        tree: { 'map.txt': 'Currents marked with charcoal strokes.' },
        timestamp: 1710000000000,
        parents: []
      },
      {
        id: 'c002',
        message: 'Reinforce the harbor',
        tree: { 'map.txt': 'Currents marked with charcoal strokes. New anchor points added.' },
        timestamp: 1710003600000,
        parents: ['c001']
      }
    ],
    workingTree: { 'map.txt': 'Currents marked with charcoal strokes. New anchor points added.' }
  })
}

const levelFour: Level = {
  id: 4,
  title: 'Return to Mainline',
  chapter: 'Chapter 2: Forked Paths',
  story: [
    'The canyon route is mapped. Return to the main current.',
    'Drop a new beacon on main to guide the fleet.'
  ],
  completion: ['Main is fortified with a fresh beacon.', 'You are ready to learn how currents converge.'],
  steps: [
    {
      id: 'switch-main',
      text: 'Switch back to the main branch.',
      success: 'You are back on the primary route.',
      check: (state) => state.repo.headRef === 'main'
    },
    {
      id: 'beacon-file',
      text: 'Create beacon.txt in the working directory.',
      success: 'A new beacon file is ready to light.',
      check: (state) => Object.prototype.hasOwnProperty.call(state.repo.workingTree, 'beacon.txt')
    },
    {
      id: 'add-beacon',
      text: 'Stage beacon.txt.',
      success: 'The beacon is prepared for record.',
      check: (state) => state.actions.includes('add:beacon.txt')
    },
    {
      id: 'commit-beacon',
      text: 'Commit the beacon on main.',
      success: 'Mainline guidance is secured.',
      check: (state) => state.actions.includes('commit') && state.repo.headRef === 'main'
    }
  ],
  hints: [
    'Use git switch main to return to the main branch.',
    'Create a new file called beacon.txt.',
    'Stage it with git add beacon.txt.',
    'Commit with git commit -m "message".'
  ],
  suggestedCommands: ['git switch main', '', 'git add beacon.txt', 'git commit -m "Light the beacon"'],
  referenceCommands: ['git switch <name>', 'git add <file>', 'git commit -m "message"', 'git log'],
  xpReward: 100,
  initialRepo: createBaseRepo({
    isInitialized: true,
    branches: { main: 'c002', feature: 'c003' },
    headRef: 'feature',
    head: 'c003',
    commits: [
      {
        id: 'c001',
        message: 'Chart the shoals',
        tree: { 'map.txt': 'Currents marked with charcoal strokes.' },
        timestamp: 1710000000000,
        parents: []
      },
      {
        id: 'c002',
        message: 'Reinforce the harbor',
        tree: { 'map.txt': 'Currents marked with charcoal strokes. New anchor points added.' },
        timestamp: 1710003600000,
        parents: ['c001']
      },
      {
        id: 'c003',
        message: 'Map the canyon',
        tree: {
          'map.txt': 'Currents marked with charcoal strokes. New anchor points added.',
          'logbook.md': 'Feature route notes and tide warnings.'
        },
        timestamp: 1710007200000,
        parents: ['c002']
      }
    ],
    workingTree: {
      'map.txt': 'Currents marked with charcoal strokes. New anchor points added.',
      'logbook.md': 'Feature route notes and tide warnings.'
    }
  })
}

const levelFive: Level = {
  id: 5,
  title: 'Confluence Gate',
  chapter: 'Chapter 3: Convergence',
  story: [
    'The feature route is safe. Bring it into the main current.',
    'A fast-forward merge should carry main forward.'
  ],
  completion: ['The currents converge cleanly.', 'Your crew is ready for tougher merges.'],
  steps: [
    {
      id: 'merge-feature',
      text: 'Merge feature into main with git merge feature.',
      success: 'Main advances to meet the feature route.',
      check: (state) => state.actions.includes('merge:ff')
    },
    {
      id: 'log',
      text: 'Inspect the updated history with git log.',
      success: 'You confirm the merged timeline.',
      check: (state) => state.actions.includes('log')
    }
  ],
  hints: ['Switch to main if needed, then run git merge feature.', 'Use git log to confirm the merge.'],
  suggestedCommands: ['git merge feature', 'git log'],
  referenceCommands: ['git merge <branch>', 'git switch <name>', 'git log'],
  xpReward: 120,
  initialRepo: createBaseRepo({
    isInitialized: true,
    branches: { main: 'c002', feature: 'c003' },
    headRef: 'main',
    head: 'c002',
    commits: [
      {
        id: 'c001',
        message: 'Anchor the mainline',
        tree: { 'map.txt': 'Mainline routes marked.' },
        timestamp: 1710010000000,
        parents: []
      },
      {
        id: 'c002',
        message: 'Add supply drops',
        tree: { 'map.txt': 'Mainline routes marked. Supply drops added.' },
        timestamp: 1710013600000,
        parents: ['c001']
      },
      {
        id: 'c003',
        message: 'Feature scouting',
        tree: { 'map.txt': 'Mainline routes marked. Supply drops added. Feature scouting.' },
        timestamp: 1710017200000,
        parents: ['c002']
      }
    ],
    workingTree: { 'map.txt': 'Mainline routes marked. Supply drops added.' }
  })
}

const levelSix: Level = {
  id: 6,
  title: 'Stormy Merge',
  chapter: 'Chapter 3: Convergence',
  story: [
    'Two crews updated the same map in different ways.',
    'Merge the branches, resolve the conflict, and commit the fix.'
  ],
  completion: ['The storm passes. A single, clean record remains.', 'Your crew trusts you with harder timelines.'],
  steps: [
    {
      id: 'merge',
      text: 'Attempt to merge feature into main.',
      success: 'The merge starts, but the storm breaks.',
      check: (state) => state.actions.includes('merge:conflict')
    },
    {
      id: 'resolve',
      text: 'Resolve the conflict in map.txt and stage it.',
      success: 'You calm the clash and stage the fix.',
      check: (state) => state.actions.includes('add:map.txt') && state.repo.conflicts['map.txt'] === undefined
    },
    {
      id: 'commit',
      text: 'Commit the merge resolution.',
      success: 'The timeline is whole again.',
      check: (state) => state.actions.includes('commit')
    }
  ],
  hints: [
    'Run git merge feature and look for conflict markers.',
    'Edit map.txt to keep the best parts of both changes.',
    'Stage the resolved file with git add map.txt.',
    'Commit the merge with git commit -m "message".'
  ],
  suggestedCommands: ['git merge feature', 'git add map.txt', 'git commit -m "Calm the storm"'],
  referenceCommands: ['git merge <branch>', 'git add <file>', 'git commit -m "message"', 'git merge --abort'],
  xpReward: 150,
  initialRepo: createBaseRepo({
    isInitialized: true,
    branches: { main: 'c002', feature: 'c003' },
    headRef: 'main',
    head: 'c002',
    commits: [
      {
        id: 'c001',
        message: 'Base chart',
        tree: { 'map.txt': 'Base currents and reefs.' },
        timestamp: 1710020000000,
        parents: []
      },
      {
        id: 'c002',
        message: 'Mainline adjustments',
        tree: { 'map.txt': 'Base currents and reefs. Mainline adjustments.' },
        timestamp: 1710023600000,
        parents: ['c001']
      },
      {
        id: 'c003',
        message: 'Feature adjustments',
        tree: { 'map.txt': 'Base currents and reefs. Feature adjustments.' },
        timestamp: 1710027200000,
        parents: ['c001']
      }
    ],
    workingTree: { 'map.txt': 'Base currents and reefs. Mainline adjustments.' }
  })
}

const levelSeven: Level = {
  id: 7,
  title: 'Signal Relay',
  chapter: 'Chapter 4: Distant Currents',
  story: [
    'A distant crew pushed updates to origin while you sailed.',
    'Fetch the signal, then pull to sync main.'
  ],
  completion: ['The relay is secure. You are in sync with the fleet.'],
  steps: [
    {
      id: 'fetch',
      text: 'Fetch the latest updates from origin.',
      success: 'The remote signals arrive.',
      check: (state) => state.actions.includes('fetch')
    },
    {
      id: 'pull',
      text: 'Pull to fast-forward main.',
      success: 'Your local chart matches the fleet.',
      check: (state) => state.actions.includes('pull') && state.repo.head === 'c003'
    }
  ],
  hints: ['Use git fetch to update remote tracking.', 'Use git pull to fast-forward main.'],
  suggestedCommands: ['git fetch', 'git pull'],
  referenceCommands: ['git fetch', 'git pull', 'git log'],
  xpReward: 120,
  initialRepo: createBaseRepo({
    isInitialized: true,
    branches: { main: 'c002' },
    headRef: 'main',
    head: 'c002',
    commits: [
      {
        id: 'c001',
        message: 'Initial relay',
        tree: { 'signal.txt': 'Relay established.' },
        timestamp: 1710030000000,
        parents: []
      },
      {
        id: 'c002',
        message: 'Local adjustments',
        tree: { 'signal.txt': 'Relay established. Local adjustments.' },
        timestamp: 1710033600000,
        parents: ['c001']
      }
    ],
    workingTree: { 'signal.txt': 'Relay established. Local adjustments.' },
    remote: {
      branches: { main: 'c003' },
      commits: [
        {
          id: 'c001',
          message: 'Initial relay',
          tree: { 'signal.txt': 'Relay established.' },
          timestamp: 1710030000000,
          parents: []
        },
        {
          id: 'c002',
          message: 'Local adjustments',
          tree: { 'signal.txt': 'Relay established. Local adjustments.' },
          timestamp: 1710033600000,
          parents: ['c001']
        },
        {
          id: 'c003',
          message: 'Remote update',
          tree: { 'signal.txt': 'Relay established. Local adjustments. Remote update.' },
          timestamp: 1710037200000,
          parents: ['c002']
        }
      ]
    }
  })
}

const levelEight: Level = {
  id: 8,
  title: 'Push the Beacon',
  chapter: 'Chapter 4: Distant Currents',
  story: [
    'You have local changes ready for the fleet.',
    'Push your commits so origin stays aligned.'
  ],
  completion: ['Beacon pushed. The fleet sees your work.'],
  steps: [
    {
      id: 'push',
      text: 'Push your local commits to origin.',
      success: 'The fleet receives your beacon.',
      check: (state) => state.actions.includes('push') && state.repo.remote.branches.main === state.repo.head
    }
  ],
  hints: ['Use git push to send your commits to origin.'],
  suggestedCommands: ['git push'],
  referenceCommands: ['git push', 'git log'],
  xpReward: 120,
  initialRepo: createBaseRepo({
    isInitialized: true,
    branches: { main: 'c004' },
    headRef: 'main',
    head: 'c004',
    commits: [
      {
        id: 'c001',
        message: 'Initial relay',
        tree: { 'signal.txt': 'Relay established.' },
        timestamp: 1710040000000,
        parents: []
      },
      {
        id: 'c002',
        message: 'Local adjustments',
        tree: { 'signal.txt': 'Relay established. Local adjustments.' },
        timestamp: 1710043600000,
        parents: ['c001']
      },
      {
        id: 'c003',
        message: 'Remote update',
        tree: { 'signal.txt': 'Relay established. Local adjustments. Remote update.' },
        timestamp: 1710047200000,
        parents: ['c002']
      },
      {
        id: 'c004',
        message: 'Beacon calibration',
        tree: { 'signal.txt': 'Relay established. Local adjustments. Remote update. Beacon calibration.' },
        timestamp: 1710050800000,
        parents: ['c003']
      }
    ],
    workingTree: { 'signal.txt': 'Relay established. Local adjustments. Remote update. Beacon calibration.' },
    remote: {
      branches: { main: 'c003' },
      commits: [
        {
          id: 'c001',
          message: 'Initial relay',
          tree: { 'signal.txt': 'Relay established.' },
          timestamp: 1710040000000,
          parents: []
        },
        {
          id: 'c002',
          message: 'Local adjustments',
          tree: { 'signal.txt': 'Relay established. Local adjustments.' },
          timestamp: 1710043600000,
          parents: ['c001']
        },
        {
          id: 'c003',
          message: 'Remote update',
          tree: { 'signal.txt': 'Relay established. Local adjustments. Remote update.' },
          timestamp: 1710047200000,
          parents: ['c002']
        }
      ]
    }
  })
}

const levelNine: Level = {
  id: 9,
  title: 'False Beacon',
  chapter: 'Chapter 5: Rescue Operations',
  story: [
    'A rushed commit logged the wrong coordinates.',
    'Inspect the history, then rewind to the last safe beacon.'
  ],
  completion: ['The timeline rolls back to safety.', 'Your crew trusts your recovery call.'],
  steps: [
    {
      id: 'log',
      text: 'Review the recent commits with git log.',
      success: 'You spot the faulty beacon.',
      check: (state) => state.actions.includes('log')
    },
    {
      id: 'reset',
      text: 'Hard reset main to commit c002.',
      success: 'The bad record is gone from the active timeline.',
      check: (state) => state.actions.includes('reset') && state.repo.head === 'c002'
    },
    {
      id: 'status',
      text: 'Confirm the reset with git status.',
      success: 'The deck is clear again.',
      check: (state) => state.actions.includes('status')
    }
  ],
  hints: [
    'Use git log to find the commit id before the mistake.',
    'Reset with git reset --hard c002.',
    'git status should show a clean working tree.'
  ],
  suggestedCommands: ['git log', 'git reset --hard c002', 'git status'],
  referenceCommands: ['git log', 'git reset --hard <commit>', 'git status'],
  xpReward: 140,
  initialRepo: createBaseRepo({
    isInitialized: true,
    branches: { main: 'c003' },
    headRef: 'main',
    head: 'c003',
    commits: [
      {
        id: 'c001',
        message: 'Set base camp',
        tree: { 'log.txt': 'Base camp established.' },
        timestamp: 1710060000000,
        parents: []
      },
      {
        id: 'c002',
        message: 'Supply run',
        tree: { 'log.txt': 'Base camp established. Supplies stocked.' },
        timestamp: 1710063600000,
        parents: ['c001']
      },
      {
        id: 'c003',
        message: 'Wrong coordinates',
        tree: { 'log.txt': 'Base camp established. Supplies stocked. Wrong coordinates logged.' },
        timestamp: 1710067200000,
        parents: ['c002']
      }
    ],
    workingTree: {
      'log.txt': 'Base camp established. Supplies stocked. Wrong coordinates logged.'
    }
  })
}

const levelTen: Level = {
  id: 10,
  title: 'Selective Rescue',
  chapter: 'Chapter 5: Rescue Operations',
  story: [
    'A teammate fixed the harbor on a feature branch.',
    'Bring only that fix into main without merging the entire branch.'
  ],
  completion: ['The harbor fix arrives without extra baggage.', 'You can now move single commits across currents.'],
  steps: [
    {
      id: 'log',
      text: 'Use git log to identify the fix commit.',
      success: 'The fix commit is marked.',
      check: (state) => state.actions.includes('log')
    },
    {
      id: 'cherry-pick',
      text: 'Cherry-pick commit c003 onto main.',
      success: 'The fix is applied to main.',
      check: (state) => state.actions.includes('cherry-pick')
    },
    {
      id: 'verify-fix',
      text: 'Confirm fix.txt appears in the working directory.',
      success: 'The harbor checklist is ready.',
      check: (state) => Object.prototype.hasOwnProperty.call(state.repo.workingTree, 'fix.txt')
    }
  ],
  hints: [
    'Run git log to see commit ids.',
    'Use git cherry-pick c003 while on main.',
    'Check the Working Directory panel for fix.txt.'
  ],
  suggestedCommands: ['git log', 'git cherry-pick c003', ''],
  referenceCommands: ['git cherry-pick <commit>', 'git log', 'git status'],
  xpReward: 150,
  initialRepo: createBaseRepo({
    isInitialized: true,
    branches: { main: 'c002', feature: 'c003' },
    headRef: 'main',
    head: 'c002',
    commits: [
      {
        id: 'c001',
        message: 'Base chart',
        tree: { 'map.txt': 'Base chart.' },
        timestamp: 1710070000000,
        parents: []
      },
      {
        id: 'c002',
        message: 'Mainline supplies',
        tree: { 'map.txt': 'Base chart. Mainline supplies.' },
        timestamp: 1710073600000,
        parents: ['c001']
      },
      {
        id: 'c003',
        message: 'Harbor fix',
        tree: {
          'map.txt': 'Base chart. Mainline supplies.',
          'fix.txt': 'Harbor fix checklist.'
        },
        timestamp: 1710077200000,
        parents: ['c002']
      }
    ],
    workingTree: { 'map.txt': 'Base chart. Mainline supplies.' }
  })
}

const levelEleven: Level = {
  id: 11,
  title: 'Reverse the Tide',
  chapter: 'Chapter 6: Patch & Rollback',
  story: [
    'A public commit introduced a dangerous route.',
    'Create a revert commit so the timeline remains honest.'
  ],
  completion: ['The harmful change is safely undone.', 'Your log stays transparent and trusted.'],
  steps: [
    {
      id: 'log',
      text: 'Inspect the history with git log.',
      success: 'You locate the bad commit.',
      check: (state) => state.actions.includes('log')
    },
    {
      id: 'revert',
      text: 'Revert commit c003.',
      success: 'A new commit reverses the mistake.',
      check: (state) => state.actions.includes('revert')
    },
    {
      id: 'status',
      text: 'Confirm the working tree is clean.',
      success: 'The waters settle again.',
      check: (state) => state.actions.includes('status')
    }
  ],
  hints: [
    'Use git log to confirm the bad commit id.',
    'Run git revert c003 to create a new undo commit.',
    'git status should show no pending changes.'
  ],
  suggestedCommands: ['git log', 'git revert c003', 'git status'],
  referenceCommands: ['git revert <commit>', 'git log', 'git status'],
  xpReward: 160,
  initialRepo: createBaseRepo({
    isInitialized: true,
    branches: { main: 'c003' },
    headRef: 'main',
    head: 'c003',
    commits: [
      {
        id: 'c001',
        message: 'Safe route',
        tree: { 'route.txt': 'Safe route marked.' },
        timestamp: 1710080000000,
        parents: []
      },
      {
        id: 'c002',
        message: 'Add checkpoints',
        tree: { 'route.txt': 'Safe route marked. Checkpoints added.' },
        timestamp: 1710083600000,
        parents: ['c001']
      },
      {
        id: 'c003',
        message: 'Dangerous shortcut',
        tree: { 'route.txt': 'Safe route marked. Checkpoints added. Dangerous shortcut.' },
        timestamp: 1710087200000,
        parents: ['c002']
      }
    ],
    workingTree: { 'route.txt': 'Safe route marked. Checkpoints added. Dangerous shortcut.' }
  })
}

const levelTwelve: Level = {
  id: 12,
  title: 'Public Patch',
  chapter: 'Chapter 6: Patch & Rollback',
  story: [
    'The fleet already pulled a bad commit.',
    'Revert it locally and push the fix to origin.'
  ],
  completion: ['The fleet receives the corrective patch.', 'You can now repair mistakes without rewriting history.'],
  steps: [
    {
      id: 'revert',
      text: 'Revert commit c003 on main.',
      success: 'A corrective commit is ready.',
      check: (state) => state.actions.includes('revert')
    },
    {
      id: 'push',
      text: 'Push the revert to origin.',
      success: 'The fleet aligns with the fix.',
      check: (state) => state.actions.includes('push') && state.repo.remote.branches.main === state.repo.head
    }
  ],
  hints: [
    'Use git revert c003 to create a new commit.',
    'Push with git push so origin updates.'
  ],
  suggestedCommands: ['git revert c003', 'git push'],
  referenceCommands: ['git revert <commit>', 'git push', 'git log'],
  xpReward: 170,
  initialRepo: createBaseRepo({
    isInitialized: true,
    branches: { main: 'c003' },
    headRef: 'main',
    head: 'c003',
    commits: [
      {
        id: 'c001',
        message: 'Safe route',
        tree: { 'route.txt': 'Safe route marked.' },
        timestamp: 1710090000000,
        parents: []
      },
      {
        id: 'c002',
        message: 'Add checkpoints',
        tree: { 'route.txt': 'Safe route marked. Checkpoints added.' },
        timestamp: 1710093600000,
        parents: ['c001']
      },
      {
        id: 'c003',
        message: 'Dangerous shortcut',
        tree: { 'route.txt': 'Safe route marked. Checkpoints added. Dangerous shortcut.' },
        timestamp: 1710097200000,
        parents: ['c002']
      }
    ],
    workingTree: { 'route.txt': 'Safe route marked. Checkpoints added. Dangerous shortcut.' },
    remote: {
      branches: { main: 'c003' },
      commits: [
        {
          id: 'c001',
          message: 'Safe route',
          tree: { 'route.txt': 'Safe route marked.' },
          timestamp: 1710090000000,
          parents: []
        },
        {
          id: 'c002',
          message: 'Add checkpoints',
          tree: { 'route.txt': 'Safe route marked. Checkpoints added.' },
          timestamp: 1710093600000,
          parents: ['c001']
        },
        {
          id: 'c003',
          message: 'Dangerous shortcut',
          tree: { 'route.txt': 'Safe route marked. Checkpoints added. Dangerous shortcut.' },
          timestamp: 1710097200000,
          parents: ['c002']
        }
      ]
    }
  })
}

export const levels: Level[] = [
  levelOne,
  levelTwo,
  levelThree,
  levelFour,
  levelFive,
  levelSix,
  levelSeven,
  levelEight,
  levelNine,
  levelTen,
  levelEleven,
  levelTwelve
]

export const getLevelById = (levelId: number): Level => {
  return levels.find((level) => level.id === levelId) ?? levels[0]
}
