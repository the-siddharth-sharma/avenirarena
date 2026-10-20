import type { CodeHouseMode, FloorId, NpcCharacter } from './types';

export const NPC_CHARACTERS: Record<string, NpcCharacter> = {
  'npc-duck': {
    id: 'npc-duck',
    name: 'Quacky',
    title: 'Senior Rubber Duck Debugger',
    avatar: '🦆',
    color: '#FACC15',
    personality: 'duck',
    dialogues: {
      intro:
        'Squeak! Don\'t panic. I have absorbed millions of lines of code. Explain your logic out loud to me line by line, and you will find your answer.',
      hints: [
        'Level 1 (Nudge): Look at what values change across iterations. Are you modifying the collection while looping over it?',
        'Level 2 (Syntax): In C++, remember vector indexing is 0-based. Did you check boundaries with i < vec.size()?',
        'Level 3 (Pseudo-code): Use two pointers: left = 0, right = n-1. While left < right, swap(arr[left++], arr[right--]).',
      ],
      solvedCongrats:
        'A magnificent deduction! See? Talking it out with an inanimate waterfowl works every single time. Squeak!',
    },
  },
  'npc-sysadmin': {
    id: 'npc-sysadmin',
    name: 'Viktor',
    title: 'Paranoid Kernel SysAdmin',
    avatar: '🕶️',
    color: '#06B6D4',
    personality: 'sysadmin',
    dialogues: {
      intro:
        'Keep your voice down. The kernel is listening, and there\'s an uninitialized pointer hovering around 0x00A0. Watch your stack frames.',
      hints: [
        'Level 1 (Nudge): CPU cycles are precious. An O(n²) nested loop here will thermal-throttle the whole wing.',
        'Level 2 (Syntax): Always free what you allocate! Check if every `new Node()` has a corresponding delete or unique_ptr.',
        'Level 3 (Pseudo-code): For BFS traversal, push the root to std::queue<Node*>, then while(!q.empty()): pop front, visit children.',
      ],
      solvedCongrats:
        'Kernel alarms silenced! Memory address space stabilized at zero leaks. You have avoided the Segfault Void... for now.',
    },
  },
  'npc-designer': {
    id: 'npc-designer',
    name: 'Chloe',
    title: 'Lead Design Architect',
    avatar: '🎨',
    color: '#EC4899',
    personality: 'designer',
    dialogues: {
      intro:
        'The aesthetic balance of this chamber is completely shattered. Misaligned flex items and missing padding are giving me a migraine.',
      hints: [
        'Level 1 (Nudge): Never use static absolute positioning when a fluid layout container will naturally distribute the items.',
        'Level 2 (Syntax): Set `display: flex;` on the parent container, then use `justify-content: space-between;` for even distribution.',
        'Level 3 (Pseudo-code): .room-container { display: flex; flex-direction: row; justify-content: center; align-items: center; gap: 1.5rem; }',
      ],
      solvedCongrats:
        'Finally! Golden ratio proportions restored. The room flows like pure visual poetry. Well done!',
    },
  },
};

/** Get context-aware hints tailored to the current floor and mode */
export function getContextualNpcHint(
  npcId: string,
  mode: CodeHouseMode,
  floorId: FloorId,
  hintLevel: 1 | 2 | 3
): string {
  const npc = NPC_CHARACTERS[npcId] || NPC_CHARACTERS['npc-duck'];

  if (mode === 'dsa') {
    if (floorId === 1) {
      if (hintLevel === 1) return 'Quack! Notice the furniture slots array [0..n-1]. If item values are unordered, you need an ascending sort.';
      if (hintLevel === 2) return 'In C++, std::sort(slots.begin(), slots.end()) sorts contiguous elements in O(n log n).';
      return 'Solution blueprint: std::sort(slots.begin(), slots.end()); for(int i=0; i<slots.size(); i++) { slots[i] = i+1; }';
    }
    if (floorId === 2) {
      if (hintLevel === 1) return 'Watch the memory addresses! A dangling pointer points to deallocated RAM and will trigger a SIGSEGV.';
      if (hintLevel === 2) return 'Traverse linked list nodes using `Node* curr = head; while(curr != nullptr) { ... curr = curr->next; }`';
      return 'To reverse links: ListNode *prev = nullptr, *curr = head; while(curr) { auto next = curr->next; curr->next = prev; prev = curr; curr = next; } return prev;';
    }
    if (floorId === 3) {
      if (hintLevel === 1) return 'Plates follow LIFO (Last In First Out); pantry orders follow FIFO (First In First Out). Match the container!';
      if (hintLevel === 2) return 'Use std::stack<int> for plates (push/pop top) and std::queue<int> for conveyors (push back/pop front).';
      return 'Check matching brackets: for char c in str: if opening push to stack; if closing, check if !stack.empty() && stack.top() matches, then pop.';
    }
    if (floorId === 4) {
      if (hintLevel === 1) return 'Breadth-First Search (BFS) explores level-by-level using a queue. Depth-First Search (DFS) uses recursion or a stack.';
      if (hintLevel === 2) return 'Track visited nodes with std::unordered_set<int> visited to prevent endless circular loops.';
      return 'q.push(start); visited.insert(start); while(!q.empty()) { auto u = q.front(); q.pop(); for(auto v : adj[u]) if(!visited.count(v)) { visited.insert(v); q.push(v); } }';
    }
    if (floorId === 5) {
      if (hintLevel === 1) return 'Overlapping subproblems mean recalculating fib(n) takes exponential O(2^n) time without caching!';
      if (hintLevel === 2) return 'Create a memo table `std::vector<int> memo(n + 1, -1);` or an iterative bottom-up table `dp[i] = dp[i-1] + dp[i-2]`.';
      return 'int climbStairs(int n) { if(n <= 2) return n; int a = 1, b = 2; for(int i = 3; i <= n; i++) { int c = a + b; a = b; b = c; } return b; }';
    }
  } else {
    // Web Dev Mode
    if (floorId === 1) {
      if (hintLevel === 1) return 'Replace those generic <div> elements with semantic HTML: <header>, <main>, <nav>, and <section>.';
      if (hintLevel === 2) return 'A card component should have a distinct <article> wrapper with a header and paragraph description.';
      return '<article class="estate-card"><header><h2>Chamber 1</h2></header><p>The cardboard foyer is restored.</p></article>';
    }
    if (floorId === 2) {
      if (hintLevel === 1) return 'Items are falling on top of each other! Turn the disarray into a flexbox or CSS grid container.';
      if (hintLevel === 2) return 'Use `display: flex; justify-content: space-between; align-items: center;` to spread props evenly across the room.';
      return '.living-room { display: flex; flex-direction: row; justify-content: space-around; align-items: center; }';
    }
    if (floorId === 3) {
      if (hintLevel === 1) return 'The collision boxes are suffocating because padding and margins are 0px! Remember: content -> padding -> border -> margin.';
      if (hintLevel === 2) return 'Set `box-sizing: border-box;` so padding doesn\'t blow up your specified width dimensions.';
      return '* { box-sizing: border-box; } .wardrobe { padding: 1.5rem; margin: 1rem auto; border: 2px solid #38bdf8; }';
    }
    if (floorId === 4) {
      if (hintLevel === 1) return 'Use @keyframes to animate the rippling fountain and pulse effect, and add a media query for mobile screens.';
      if (hintLevel === 2) return '@keyframes ripple { 0% { transform: scale(1); opacity: 1; } 100% { transform: scale(1.4); opacity: 0; } }';
      return '@media (max-width: 640px) { .backyard-patio { flex-direction: column; } } @keyframes pulse { 50% { opacity: 0.6; } }';
    }
  }

  return npc.dialogues.hints[hintLevel - 1];
}
