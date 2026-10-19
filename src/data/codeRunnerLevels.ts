import type { CodeChallenge } from '@/components/CodeRunner/challenges';

export type DSATopic = 'Basics' | 'Complexity' | 'Prefix Sum' | 'Trees' | 'Graphs';

export interface CodeRunnerTestCase {
  input: any[];
  expectedOutput: any;
  label?: string;
}

export interface CodeRunnerLevel {
  id: string;
  order: number;
  title: string;
  topic: DSATopic;
  description: string;
  detailedInstructions: string;
  initialCode: string;
  solutionCode: string;
  functionName: string;
  testCases: CodeRunnerTestCase[];
  xpReward: number;
  hints: string[];
  challenges: CodeChallenge[];
}

export interface CodeRunnerProgressionState {
  unlockedLevelIds: string[];
  completedLevelIds: string[];
  currentLevelId: string;
  levelHighScores: Record<string, number>;
  levelPassedAt: Record<string, string>;
}

export const codeRunnerLevels: CodeRunnerLevel[] = [
  // LEVEL 1: Fundamentals & Basic Operations
  {
    id: 'level-1',
    order: 1,
    title: 'Fundamentals & Basic Operations',
    topic: 'Basics',
    description: 'Array manipulation, string operations, and two-pointer basics.',
    detailedInstructions:
      'Given a 1-indexed sorted array of integers `numbers` and an integer `target`, return the 1-based indices [index1, index2] of the two numbers such that they add up to target. Use the optimal two-pointer technique in O(n) time and O(1) extra space.',
    functionName: 'twoSumSorted',
    initialCode: `function twoSumSorted(numbers, target) {
  // numbers is 1-indexed and sorted in non-decreasing order.
  // Find two numbers such that numbers[i] + numbers[j] === target.
  // Return their 1-based indices [index1, index2].
  let left = 0;
  let right = numbers.length - 1;

  while (left < right) {
    const sum = numbers[left] + numbers[right];
    if (sum === target) {
      return [left + 1, right + 1];
    } else if (sum < target) {
      left++;
    } else {
      right--;
    }
  }

  return [];
}`,
    solutionCode: `function twoSumSorted(numbers, target) {
  let left = 0;
  let right = numbers.length - 1;
  while (left < right) {
    const sum = numbers[left] + numbers[right];
    if (sum === target) {
      return [left + 1, right + 1];
    } else if (sum < target) {
      left++;
    } else {
      right--;
    }
  }
  return [];
}`,
    testCases: [
      {
        input: [[2, 7, 11, 15], 9],
        expectedOutput: [1, 2],
        label: 'Target 9 in [2, 7, 11, 15] -> [1, 2]',
      },
      {
        input: [[2, 3, 4], 6],
        expectedOutput: [1, 3],
        label: 'Target 6 in [2, 3, 4] -> [1, 3]',
      },
      {
        input: [[-1, 0], -1],
        expectedOutput: [1, 2],
        label: 'Target -1 in [-1, 0] -> [1, 2]',
      },
      {
        input: [[1, 3, 5, 8, 12, 19], 17],
        expectedOutput: [3, 5],
        label: 'Target 17 in [1, 3, 5, 8, 12, 19] -> [3, 5]',
      },
    ],
    xpReward: 100,
    hints: [
      'Since the array is already sorted, start with pointers at opposite ends (left = 0, right = length - 1).',
      'If numbers[left] + numbers[right] < target, increment left to increase the sum.',
      'If the sum is greater than target, decrement right to decrease the sum.',
      'Remember to return 1-based indices [left + 1, right + 1]!',
    ],
    challenges: [
      {
        id: 'lvl1-1',
        language: 'JavaScript',
        promptBefore: 'const lastEl = arr[arr.length - ',
        blank: '___',
        promptAfter: '];',
        fullCode: 'const lastEl = arr[arr.length - 1];',
        options: ['1', '0', '2'],
        correctIndex: 0,
        explanation: 'In 0-indexed arrays, the last element is at index arr.length - 1.',
      },
      {
        id: 'lvl1-2',
        language: 'Logic',
        promptBefore: 'Two-pointer array convergence: while (left ',
        blank: '___',
        promptAfter: ' right)',
        fullCode: 'while (left < right)',
        options: ['<', '==', '>'],
        correctIndex: 0,
        explanation: 'Two pointers moving towards each other meet when left >= right, so the loop runs while left < right.',
      },
      {
        id: 'lvl1-3',
        language: 'JavaScript',
        promptBefore: 'if (sum > target) { ',
        blank: '___',
        promptAfter: '; }',
        fullCode: 'if (sum > target) { right--; }',
        options: ['right--', 'right++', 'left--'],
        correctIndex: 0,
        explanation: 'In a sorted array, decrementing the right pointer reduces the current sum.',
      },
      {
        id: 'lvl1-4',
        language: 'JavaScript',
        promptBefore: 'const mid = Math.floor((left + right) / ',
        blank: '___',
        promptAfter: ');',
        fullCode: 'const mid = Math.floor((left + right) / 2);',
        options: ['3', '2', '4'],
        correctIndex: 1,
        explanation: 'The midpoint between two bounds is calculated by dividing their sum by 2.',
      },
      {
        id: 'lvl1-5',
        language: 'JavaScript',
        promptBefore: 'const reversed = str.split("").',
        blank: '___',
        promptAfter: '().join("");',
        fullCode: 'const reversed = str.split("").reverse().join("");',
        options: ['sort', 'reverse', 'slice'],
        correctIndex: 1,
        explanation: 'Array.prototype.reverse() inverts array element order in-place.',
      },
    ],
  },

  // LEVEL 2: Time & Space Complexity
  {
    id: 'level-2',
    order: 2,
    title: 'Time & Space Complexity',
    topic: 'Complexity',
    description: 'Identifying Big-O bottlenecks and replacing O(n²) nested loops with O(n) hash lookups.',
    detailedInstructions:
      'Given an unsorted array `nums` and an integer `target`, return the 0-based indices [index1, index2] of two numbers that add up to target. Avoid an O(n²) nested brute-force loop by using a Map or hash table to achieve optimal O(n) linear time complexity.',
    functionName: 'twoSumUnsorted',
    initialCode: `function twoSumUnsorted(nums, target) {
  // Avoid O(n^2) nested loops.
  // Store seen numbers in a Map with { value => index } for O(1) lookup.
  const seen = new Map();

  for (let i = 0; i < nums.length; i++) {
    const complement = target - nums[i];
    if (seen.has(complement)) {
      return [seen.get(complement), i];
    }
    seen.set(nums[i], i);
  }

  return [];
}`,
    solutionCode: `function twoSumUnsorted(nums, target) {
  const seen = new Map();
  for (let i = 0; i < nums.length; i++) {
    const complement = target - nums[i];
    if (seen.has(complement)) {
      return [seen.get(complement), i];
    }
    seen.set(nums[i], i);
  }
  return [];
}`,
    testCases: [
      {
        input: [[2, 7, 11, 15], 9],
        expectedOutput: [0, 1],
        label: '2 + 7 = 9 at indices [0, 1]',
      },
      {
        input: [[3, 2, 4], 6],
        expectedOutput: [1, 2],
        label: '2 + 4 = 6 at indices [1, 2]',
      },
      {
        input: [[3, 3], 6],
        expectedOutput: [0, 1],
        label: 'Duplicate elements [3, 3] at [0, 1]',
      },
      {
        input: [[1, 5, 8, 12, 14], 20],
        expectedOutput: [2, 3],
        label: '8 + 12 = 20 at indices [2, 3]',
      },
    ],
    xpReward: 150,
    hints: [
      'A nested loop checks every pair, taking O(n²) time. With n = 100,000, that requires 10 billion operations!',
      'By storing previous values in a Map, you can query whether the required complement exists in average O(1) time.',
      'Check if seen.has(target - nums[i]) before inserting nums[i] into the map to handle duplicate numbers correctly.',
    ],
    challenges: [
      {
        id: 'lvl2-1',
        language: 'Logic',
        promptBefore: 'Single linear iteration over n items runs in: O(',
        blank: '___',
        promptAfter: ')',
        fullCode: 'Single linear iteration runs in: O(n)',
        options: ['1', 'n', 'n^2'],
        correctIndex: 1,
        explanation: 'A loop visiting each of n items once has O(n) linear time complexity.',
      },
      {
        id: 'lvl2-2',
        language: 'Logic',
        promptBefore: 'Two nested loops from 0 to n has time complexity: O(',
        blank: '___',
        promptAfter: ')',
        fullCode: 'Two nested loops running n times: O(n^2)',
        options: ['n', 'n log n', 'n^2'],
        correctIndex: 2,
        explanation: 'Executing n iterations inside an outer n loop performs n * n operations, resulting in O(n²).',
      },
      {
        id: 'lvl2-3',
        language: 'JavaScript',
        promptBefore: 'const needed = target - ',
        blank: '___',
        promptAfter: '; if (map.has(needed)) return true;',
        fullCode: 'const needed = target - nums[i]; if (map.has(needed)) return true;',
        options: ['nums[i]', 'i', 'target'],
        correctIndex: 0,
        explanation: 'Complement equation is target - current element (nums[i]).',
      },
      {
        id: 'lvl2-4',
        language: 'Logic',
        promptBefore: 'Hash map average insertion & lookup complexity: O(',
        blank: '___',
        promptAfter: ')',
        fullCode: 'Hash map average lookup: O(1)',
        options: ['1', 'n', 'log n'],
        correctIndex: 0,
        explanation: 'Hash maps provide constant average time O(1) for key lookups and insertions.',
      },
      {
        id: 'lvl2-5',
        language: 'Logic',
        promptBefore: 'Binary search halving the search space runs in: O(',
        blank: '___',
        promptAfter: ')',
        fullCode: 'Binary search halving the search space: O(log n)',
        options: ['n', 'log n', '1'],
        correctIndex: 1,
        explanation: 'Dividing the problem size in half at each step produces logarithmic O(log n) time.',
      },
    ],
  },

  // LEVEL 3: Prefix Sums & Sliding Window
  {
    id: 'level-3',
    order: 3,
    title: 'Prefix Sums & Sliding Window',
    topic: 'Prefix Sum',
    description: 'Range sum queries and fixed/dynamic sliding window algorithms.',
    detailedInstructions:
      'Given an array of integers `nums` and an integer `k`, find the maximum contiguous subarray sum of fixed window size `k`. Optimize by sliding the window in O(n) time instead of recalculating window totals from scratch.',
    functionName: 'maxSubarraySum',
    initialCode: `function maxSubarraySum(nums, k) {
  if (nums.length < k || k <= 0) return 0;

  // Initialize first window of size k
  let windowSum = 0;
  for (let i = 0; i < k; i++) {
    windowSum += nums[i];
  }

  let maxSum = windowSum;

  // Slide window across remaining array in O(n)
  for (let i = k; i < nums.length; i++) {
    windowSum += nums[i] - nums[i - k];
    if (windowSum > maxSum) {
      maxSum = windowSum;
    }
  }

  return maxSum;
}`,
    solutionCode: `function maxSubarraySum(nums, k) {
  if (nums.length < k || k <= 0) return 0;
  let windowSum = 0;
  for (let i = 0; i < k; i++) {
    windowSum += nums[i];
  }
  let maxSum = windowSum;
  for (let i = k; i < nums.length; i++) {
    windowSum += nums[i] - nums[i - k];
    if (windowSum > maxSum) {
      maxSum = windowSum;
    }
  }
  return maxSum;
}`,
    testCases: [
      {
        input: [[2, 1, 5, 1, 3, 2], 3],
        expectedOutput: 9,
        label: 'Window [5, 1, 3] has max sum 9',
      },
      {
        input: [[1, 4, 2, 10, 23, 3, 1, 0, 20], 4],
        expectedOutput: 39,
        label: 'Window [4, 2, 10, 23] has max sum 39',
      },
      {
        input: [[-1, -2, -3, -4], 2],
        expectedOutput: -3,
        label: 'Negative values [-1, -2] has max sum -3',
      },
      {
        input: [[100, 200, 300, 400], 2],
        expectedOutput: 700,
        label: 'Window [300, 400] has max sum 700',
      },
    ],
    xpReward: 200,
    hints: [
      'Instead of summing k numbers every time (O(n * k)), slide the window: add the incoming number and subtract the outgoing number.',
      'Incoming element is nums[i]; outgoing element that just left the window is nums[i - k].',
      'Keep track of maxSum = Math.max(maxSum, windowSum) after each slide.',
    ],
    challenges: [
      {
        id: 'lvl3-1',
        language: 'Logic',
        promptBefore: 'Prefix sum recurrence: prefix[i] = prefix[i - 1] + ',
        blank: '___',
        promptAfter: ';',
        fullCode: 'prefix[i] = prefix[i - 1] + nums[i];',
        options: ['nums[i]', 'nums[0]', 'i'],
        correctIndex: 0,
        explanation: 'Each prefix sum accumulates previous prefix sum plus the current array element nums[i].',
      },
      {
        id: 'lvl3-2',
        language: 'Logic',
        promptBefore: 'Range sum query for range [L, R]: prefix[R] - ',
        blank: '___',
        promptAfter: ';',
        fullCode: 'Range sum: prefix[R] - prefix[L - 1];',
        options: ['prefix[L]', 'prefix[L - 1]', 'nums[L]'],
        correctIndex: 1,
        explanation: 'To compute sum from index L to R in O(1), subtract prefix[L - 1] from prefix[R].',
      },
      {
        id: 'lvl3-3',
        language: 'JavaScript',
        promptBefore: 'windowSum += nums[i] - ',
        blank: '___',
        promptAfter: '; // slide window',
        fullCode: 'windowSum += nums[i] - nums[i - k];',
        options: ['nums[i - k]', 'nums[i + k]', 'nums[k]'],
        correctIndex: 0,
        explanation: 'nums[i - k] is the leftmost element that just fell outside the window of size k.',
      },
      {
        id: 'lvl3-4',
        language: 'Logic',
        promptBefore: 'Subarray length between indices left and right inclusive: ',
        blank: '___',
        promptAfter: ';',
        fullCode: 'Window size: right - left + 1;',
        options: ['right - left', 'right - left + 1', 'right + left'],
        correctIndex: 1,
        explanation: 'Number of elements from index left to right inclusive is (right - left + 1).',
      },
      {
        id: 'lvl3-5',
        language: 'Logic',
        promptBefore: 'Sliding window over array of length n runs in overall time: O(',
        blank: '___',
        promptAfter: ')',
        fullCode: 'Sliding window time complexity: O(n)',
        options: ['n * k', 'n', 'k^2'],
        correctIndex: 1,
        explanation: 'Each element enters and exits the window at most once, taking O(n) total linear time.',
      },
    ],
  },

  // LEVEL 4: Trees & Hierarchies
  {
    id: 'level-4',
    order: 4,
    title: 'Trees & Hierarchies',
    topic: 'Trees',
    description: 'Binary trees, BST search/insert, and BFS/DFS tree traversals.',
    detailedInstructions:
      'Given the root of a binary tree `{ val: number, left: TreeNode | null, right: TreeNode | null }`, return its maximum depth. A binary tree maximum depth is the number of nodes along the longest path from the root node down to the farthest leaf node.',
    functionName: 'maxDepth',
    initialCode: `function maxDepth(root) {
  // Base case: empty node has depth 0
  if (!root) return 0;

  // Recursively compute the depth of left and right subtrees
  const leftDepth = maxDepth(root.left);
  const rightDepth = maxDepth(root.right);

  // Current node adds 1 to the deeper subtree
  return 1 + Math.max(leftDepth, rightDepth);
}`,
    solutionCode: `function maxDepth(root) {
  if (!root) return 0;
  const leftDepth = maxDepth(root.left);
  const rightDepth = maxDepth(root.right);
  return 1 + Math.max(leftDepth, rightDepth);
}`,
    testCases: [
      {
        input: [
          {
            val: 3,
            left: { val: 9, left: null, right: null },
            right: {
              val: 20,
              left: { val: 15, left: null, right: null },
              right: { val: 7, left: null, right: null },
            },
          },
        ],
        expectedOutput: 3,
        label: 'Balanced tree [3, 9, 20, null, null, 15, 7] -> depth 3',
      },
      {
        input: [{ val: 1, left: null, right: { val: 2, left: null, right: null } }],
        expectedOutput: 2,
        label: 'Right-skewed tree [1, null, 2] -> depth 2',
      },
      {
        input: [null],
        expectedOutput: 0,
        label: 'Empty tree null -> depth 0',
      },
      {
        input: [
          {
            val: 1,
            left: {
              val: 2,
              left: {
                val: 3,
                left: { val: 4, left: null, right: null },
                right: null,
              },
              right: null,
            },
            right: null,
          },
        ],
        expectedOutput: 4,
        label: 'Linear left branch -> depth 4',
      },
    ],
    xpReward: 250,
    hints: [
      'Think recursively! The maximum depth of any tree is 1 (for the root itself) + the maximum depth between its left and right subtrees.',
      'Check the base condition first: if root is null, depth is 0.',
      'Return 1 + Math.max(maxDepth(root.left), maxDepth(root.right)).',
    ],
    challenges: [
      {
        id: 'lvl4-1',
        language: 'Logic',
        promptBefore: 'Binary Search Tree property: every node in left subtree has key ',
        blank: '___',
        promptAfter: ' root.key',
        fullCode: 'BST left child < root.key',
        options: ['<', '>', '=='],
        correctIndex: 0,
        explanation: 'In a BST, all keys in the left subtree are strictly less than the parent root node key.',
      },
      {
        id: 'lvl4-2',
        language: 'JavaScript',
        promptBefore: 'return 1 + Math.max(leftDepth, ',
        blank: '___',
        promptAfter: ');',
        fullCode: 'return 1 + Math.max(leftDepth, rightDepth);',
        options: ['rightDepth', '1', 'minDepth'],
        correctIndex: 0,
        explanation: 'The depth is 1 plus the larger of the two child subtree depths.',
      },
      {
        id: 'lvl4-3',
        language: 'Logic',
        promptBefore: 'In-order binary tree traversal order is: ',
        blank: '___',
        promptAfter: ' -> Root -> Right',
        fullCode: 'In-order traversal: Left -> Root -> Right',
        options: ['Left', 'Right', 'Parent'],
        correctIndex: 0,
        explanation: 'In-order traversal processes the Left subtree first, then Root, then Right subtree.',
      },
      {
        id: 'lvl4-4',
        language: 'Logic',
        promptBefore: 'Breadth-First Search (BFS) level-order traversal uses a: ',
        blank: '___',
        promptAfter: ';',
        fullCode: 'BFS level-order traversal uses a: Queue;',
        options: ['Stack', 'Queue', 'Heap'],
        correctIndex: 1,
        explanation: 'A FIFO Queue visits nodes level by level in Breadth-First Search.',
      },
      {
        id: 'lvl4-5',
        language: 'JavaScript',
        promptBefore: 'const temp = root.left; root.left = root.right; root.right = ',
        blank: '___',
        promptAfter: ';',
        fullCode: 'root.right = temp; // Swap pointers',
        options: ['temp', 'null', 'root.left'],
        correctIndex: 0,
        explanation: 'To invert/swap tree nodes, use the temporary variable holding the original left pointer.',
      },
    ],
  },

  // LEVEL 5: Graphs & Network Traversal
  {
    id: 'level-5',
    order: 5,
    title: 'Graphs & Network Traversal',
    topic: 'Graphs',
    description: 'Adjacency representations, cycle detection, and graph BFS/DFS traversals.',
    detailedInstructions:
      'Given a directed graph represented as an adjacency list `Record<string, string[]>` and two node keys `start` and `end`, determine if a valid path exists between `start` and `end`. Use BFS or DFS with a visited set to avoid infinite cycles.',
    functionName: 'hasPath',
    initialCode: `function hasPath(graph, start, end) {
  // graph is Record<string, string[]>: e.g. { "A": ["B", "C"], "B": ["D"] }
  if (start === end) return true;

  const visited = new Set();
  const queue = [start];
  visited.add(start);

  while (queue.length > 0) {
    const current = queue.shift();
    if (current === end) return true;

    const neighbors = graph[current] || [];
    for (const neighbor of neighbors) {
      if (!visited.has(neighbor)) {
        visited.add(neighbor);
        queue.push(neighbor);
      }
    }
  }

  return false;
}`,
    solutionCode: `function hasPath(graph, start, end) {
  if (start === end) return true;
  const visited = new Set();
  const queue = [start];
  visited.add(start);

  while (queue.length > 0) {
    const current = queue.shift();
    if (current === end) return true;

    const neighbors = graph[current] || [];
    for (const neighbor of neighbors) {
      if (!visited.has(neighbor)) {
        visited.add(neighbor);
        queue.push(neighbor);
      }
    }
  }

  return false;
}`,
    testCases: [
      {
        input: [
          { A: ['B', 'C'], B: ['D'], C: ['E'], D: ['F'], E: [], F: [] },
          'A',
          'F',
        ],
        expectedOutput: true,
        label: 'Path exists A -> B -> D -> F',
      },
      {
        input: [{ A: ['B'], B: ['C'], C: [], D: ['E'], E: [] }, 'A', 'E'],
        expectedOutput: false,
        label: 'Disconnected components: no path from A to E',
      },
      {
        input: [{ '1': ['2'], '2': ['3'], '3': ['1'] }, '1', '3'],
        expectedOutput: true,
        label: 'Handles directed cycles safely: 1 -> 2 -> 3',
      },
      {
        input: [{ A: ['B'], B: [] }, 'A', 'A'],
        expectedOutput: true,
        label: 'Start node equals end node',
      },
    ],
    xpReward: 300,
    hints: [
      'Graphs can contain cycles! Always keep a Set of visited nodes and check !visited.has(neighbor) before visiting.',
      'For Breadth-First Search (BFS), use a queue: shift() removes from front, push() adds to back.',
      'Check if start === end right at the beginning for immediate resolution.',
    ],
    challenges: [
      {
        id: 'lvl5-1',
        language: 'JavaScript',
        promptBefore: 'const neighbors = graph[',
        blank: '___',
        promptAfter: '] || [];',
        fullCode: 'const neighbors = graph[current] || [];',
        options: ['current', '0', 'visited'],
        correctIndex: 0,
        explanation: 'In an adjacency list, neighbors of node current are retrieved with graph[current].',
      },
      {
        id: 'lvl5-2',
        language: 'JavaScript',
        promptBefore: 'if (!visited.has(neighbor)) { ',
        blank: '___',
        promptAfter: '.add(neighbor); queue.push(neighbor); }',
        fullCode: 'visited.add(neighbor); queue.push(neighbor);',
        options: ['visited', 'queue', 'stack'],
        correctIndex: 0,
        explanation: 'Marking neighbor in visited immediately prevents re-adding the node to the queue.',
      },
      {
        id: 'lvl5-3',
        language: 'JavaScript',
        promptBefore: 'const current = queue.',
        blank: '___',
        promptAfter: '(); // FIFO dequeuing',
        fullCode: 'const current = queue.shift();',
        options: ['pop', 'shift', 'slice'],
        correctIndex: 1,
        explanation: 'Array.prototype.shift() removes and returns the first element, maintaining FIFO order.',
      },
      {
        id: 'lvl5-4',
        language: 'Logic',
        promptBefore: 'Linear ordering of vertices in Directed Acyclic Graph: ',
        blank: '___',
        promptAfter: ' Sort',
        fullCode: 'Topological Sort ordering',
        options: ['Topological', 'Quick', 'Bubble'],
        correctIndex: 0,
        explanation: 'Topological sorting orders vertices in a DAG such that for every directed edge u->v, u comes before v.',
      },
      {
        id: 'lvl5-5',
        language: 'Logic',
        promptBefore: 'Shortest path in an unweighted graph is guaranteed by: ',
        blank: '___',
        promptAfter: ';',
        fullCode: 'Shortest unweighted path: Breadth-First Search (BFS)',
        options: ['DFS', 'BFS', 'Preorder'],
        correctIndex: 1,
        explanation: 'BFS explores outward level-by-level, guaranteeing the fewest number of edges to any node.',
      },
    ],
  },
];

// Helper functions for progression persistence
const STORAGE_PREFIX = 'avenir_coderunner_progression_';

export function getSavedProgression(studentId: string): CodeRunnerProgressionState {
  const defaultState: CodeRunnerProgressionState = {
    unlockedLevelIds: ['level-1'],
    completedLevelIds: [],
    currentLevelId: 'level-1',
    levelHighScores: {},
    levelPassedAt: {},
  };

  if (typeof window === 'undefined') return defaultState;

  try {
    const raw = localStorage.getItem(`${STORAGE_PREFIX}${studentId || 'default'}`);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed.unlockedLevelIds) && parsed.unlockedLevelIds.length > 0) {
        return {
          unlockedLevelIds: parsed.unlockedLevelIds,
          completedLevelIds: parsed.completedLevelIds || [],
          currentLevelId: parsed.currentLevelId || 'level-1',
          levelHighScores: parsed.levelHighScores || {},
          levelPassedAt: parsed.levelPassedAt || {},
        };
      }
    }
  } catch {
    // Ignore fallback
  }

  return defaultState;
}

export function saveProgression(studentId: string, state: CodeRunnerProgressionState): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(`${STORAGE_PREFIX}${studentId || 'default'}`, JSON.stringify(state));
  } catch {
    // Ignore
  }
}

export function getNextLevel(currentLevelId: string): CodeRunnerLevel | null {
  const currentIndex = codeRunnerLevels.findIndex((l) => l.id === currentLevelId);
  if (currentIndex >= 0 && currentIndex < codeRunnerLevels.length - 1) {
    return codeRunnerLevels[currentIndex + 1];
  }
  return null;
}

export function getPreviousLevel(currentLevelId: string): CodeRunnerLevel | null {
  const currentIndex = codeRunnerLevels.findIndex((l) => l.id === currentLevelId);
  if (currentIndex > 0) {
    return codeRunnerLevels[currentIndex - 1];
  }
  return null;
}

function deepEqual(a: any, b: any): boolean {
  if (a === b) return true;
  if (typeof a !== typeof b) return false;
  if (typeof a !== 'object' || a === null || b === null) return false;
  try {
    return JSON.stringify(a) === JSON.stringify(b);
  } catch {
    return false;
  }
}

export interface EvaluationResult {
  allPassed: boolean;
  passedCount: number;
  totalCount: number;
  results: {
    testCase: CodeRunnerTestCase;
    passed: boolean;
    actualOutput?: any;
    error?: string;
    executionTimeMs: number;
  }[];
}

export function evaluateSolution(
  userCode: string,
  functionName: string,
  testCases: CodeRunnerTestCase[]
): EvaluationResult {
  try {
    // Wrap code and return target function
    const runner = new Function(`
      ${userCode}
      if (typeof ${functionName} !== 'function') {
        throw new Error('Function "${functionName}" is not defined or is not a function.');
      }
      return ${functionName};
    `);
    const fn = runner();

    const results = testCases.map((tc) => {
      const t0 = performance.now();
      try {
        const inputClone = JSON.parse(JSON.stringify(tc.input));
        const actual = fn(...inputClone);
        const t1 = performance.now();
        const passed = deepEqual(actual, tc.expectedOutput);
        return {
          testCase: tc,
          passed,
          actualOutput: actual,
          executionTimeMs: Math.round((t1 - t0) * 100) / 100,
        };
      } catch (err: any) {
        const t1 = performance.now();
        return {
          testCase: tc,
          passed: false,
          error: err?.message || String(err),
          executionTimeMs: Math.round((t1 - t0) * 100) / 100,
        };
      }
    });

    const passedCount = results.filter((r) => r.passed).length;
    return {
      allPassed: passedCount === testCases.length,
      passedCount,
      totalCount: testCases.length,
      results,
    };
  } catch (err: any) {
    return {
      allPassed: false,
      passedCount: 0,
      totalCount: testCases.length,
      results: testCases.map((tc) => ({
        testCase: tc,
        passed: false,
        error: err?.message || String(err),
        executionTimeMs: 0,
      })),
    };
  }
}
