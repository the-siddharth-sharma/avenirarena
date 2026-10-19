import type { DsaChallenge } from '../types';

export const DSA_CHALLENGES: Record<string, DsaChallenge> = {
  'dsa-arrays': {
    id: 'dsa-arrays',
    roomId: 'living-room',
    title: 'The Living Room: Array & Vector Reordering',
    topic: 'Arrays & Vectors',
    difficulty: 'Beginner',
    deviceLore:
      'The automated room conveyor has jammed. Furniture items are assigned integer index tags [0] to [n-1]. Currently, out-of-order slots cause the motorized track to spark and halt. Fix the C++ vector sort algorithm to arrange the slots sequentially.',
    timeComplexityTarget: 'O(n log n) or O(n)',
    spaceComplexityTarget: 'O(1) auxiliary',
    description:
      'Given a std::vector<int> representing the unordered furniture indices, implement or fix the rearrangement logic so that all indices are sorted in ascending order.',
    starterCode: `// Fix the vector rearrangement function
#include <vector>
#include <algorithm>

std::vector<int> arrangeFurnitureSlots(std::vector<int> slots) {
    // BUG: This loop stops early and fails to swap adjacent elements correctly
    for (size_t i = 0; i < slots.size(); i++) {
        for (size_t j = i + 1; j < slots.size(); j++) {
            if (slots[i] > slots[j]) {
                // Perform correct in-place swap
                std::swap(slots[i], slots[j]);
            }
        }
    }
    return slots;
}`,
    solutionCode: `#include <vector>
#include <algorithm>

std::vector<int> arrangeFurnitureSlots(std::vector<int> slots) {
    std::sort(slots.begin(), slots.end());
    return slots;
}`,
    testCases: [
      {
        id: 'tc-1',
        input: '[4, 0, 1, 3, 2]',
        expectedOutput: '[0, 1, 2, 3, 4]',
        explanation: 'Sorts 5 unordered room slots into sequential order.',
      },
      {
        id: 'tc-2',
        input: '[9, 1, 5]',
        expectedOutput: '[1, 5, 9]',
        explanation: 'Correctly orders furniture pieces with arbitrary values.',
      },
      {
        id: 'tc-3',
        input: '[100, 20, 50, 10]',
        expectedOutput: '[10, 20, 50, 100]',
        explanation: 'Multi-digit indices sorted without memory corruption.',
      },
    ],
    hints: [
      'You can use std::sort(slots.begin(), slots.end()) for clean O(n log n) complexity.',
      'Alternatively, a two-pointer selection or two-way swap loop works if loop bounds check size() accurately.',
    ],
    xpReward: 150,
  },

  'dsa-pointers': {
    id: 'dsa-pointers',
    roomId: 'staircase',
    title: 'The Grand Staircase: Memory Pointers & Segfault Reversal',
    topic: 'Pointers & Linked Lists',
    difficulty: 'Intermediate',
    deviceLore:
      'The ascending staircase is governed by a chain of memory address pointers. A broken pointer at landing 0x4F dereferences nullptr, causing a fatal segmentation fault that locks the stair treads. Reverse the list pointers safely so scholars can descend to safety.',
    timeComplexityTarget: 'O(n) linear scan',
    spaceComplexityTarget: 'O(1) in-place pointers',
    description:
      'Given the head pointer of a singly linked list representing the stair landings, reverse the pointer links in-place and return the new head pointer.',
    starterCode: `// Complete in-place linked list reversal
struct LandingNode {
    int address;
    LandingNode* next;
    LandingNode(int val) : address(val), next(nullptr) {}
};

LandingNode* reverseStaircasePointers(LandingNode* head) {
    LandingNode* prev = nullptr;
    LandingNode* curr = head;

    while (curr != nullptr) {
        // BUG: Memory leak and broken traversal - missing next pointer store
        LandingNode* nextNode = curr->next;
        curr->next = prev;
        prev = curr;
        curr = nextNode;
    }
    return prev;
}`,
    solutionCode: `LandingNode* reverseStaircasePointers(LandingNode* head) {
    LandingNode* prev = nullptr;
    LandingNode* curr = head;
    while (curr != nullptr) {
        LandingNode* nextNode = curr->next;
        curr->next = prev;
        prev = curr;
        curr = nextNode;
    }
    return prev;
}`,
    testCases: [
      {
        id: 'tc-1',
        input: '0x10 -> 0x20 -> 0x30 -> nullptr',
        expectedOutput: '0x30 -> 0x20 -> 0x10 -> nullptr',
        explanation: 'Three-landing pointer sequence inverted without null-pointer dereference.',
      },
      {
        id: 'tc-2',
        input: '0x4F -> nullptr',
        expectedOutput: '0x4F -> nullptr',
        explanation: 'Single-node staircase correctly terminates.',
      },
      {
        id: 'tc-3',
        input: 'nullptr (Empty Staircase)',
        expectedOutput: 'nullptr',
        explanation: 'Base case handled cleanly without crash.',
      },
    ],
    hints: [
      'Store curr->next in a temporary pointer before reassigning curr->next to prev.',
      'Always advance prev = curr and curr = nextNode.',
    ],
    xpReward: 200,
  },

  'dsa-stacks': {
    id: 'dsa-stacks',
    roomId: 'kitchen-attic',
    title: 'The Kitchen & Attic: LIFO Stack & FIFO Conveyor',
    topic: 'Stacks & Queues',
    difficulty: 'Intermediate',
    deviceLore:
      'The spring-loaded dish dispenser operates strictly on LIFO (Last-In, First-Out) while the pantry delivery belt operates on FIFO (First-In, First-Out). Unbalanced syntax tokens in the dispatch controller cause dishes to shatter. Write a balanced bracket validator.',
    timeComplexityTarget: 'O(n) single pass',
    spaceComplexityTarget: 'O(n) auxiliary stack',
    description:
      'Given a string consisting of bracket characters "()", "{}", and "[]", verify that every opening bracket is closed by the corresponding bracket type in the correct LIFO order.',
    starterCode: `#include <string>
#include <stack>

bool validateDispenserBrackets(const std::string& tokens) {
    std::stack<char> s;

    for (char ch : tokens) {
        if (ch == '(' || ch == '{' || ch == '[') {
            s.push(ch);
        } else {
            // Check stack underflow and matching pair
            if (s.empty()) return false;
            char top = s.top();
            if ((ch == ')' && top != '(') ||
                (ch == '}' && top != '{') ||
                (ch == ']' && top != '[')) {
                return false;
            }
            s.pop();
        }
    }
    return s.empty();
}`,
    solutionCode: `#include <string>
#include <stack>

bool validateDispenserBrackets(const std::string& tokens) {
    std::stack<char> s;
    for (char ch : tokens) {
        if (ch == '(' || ch == '{' || ch == '[') {
            s.push(ch);
        } else {
            if (s.empty()) return false;
            char top = s.top();
            if ((ch == ')' && top != '(') ||
                (ch == '}' && top != '{') ||
                (ch == ']' && top != '[')) {
                return false;
            }
            s.pop();
        }
    }
    return s.empty();
}`,
    testCases: [
      {
        id: 'tc-1',
        input: '"{[()]}"',
        expectedOutput: 'true (VALID_ORDER)',
        explanation: 'All nested brackets close in proper LIFO sequence.',
      },
      {
        id: 'tc-2',
        input: '"{[(])}"',
        expectedOutput: 'false (MISMATCH)',
        explanation: 'Square bracket closes before inner parenthesis pops.',
      },
      {
        id: 'tc-3',
        input: '"(()]"',
        expectedOutput: 'false (UNBALANCED)',
        explanation: 'Parenthesis closed by square bracket.',
      },
    ],
    hints: [
      'Push opening brackets onto std::stack<char>.',
      'When an opening bracket matches the top of the stack, pop it off. Ensure stack is empty at the end.',
    ],
    xpReward: 200,
  },

  'dsa-graphs': {
    id: 'dsa-graphs',
    roomId: 'garden-maze',
    title: 'The Garden Maze: Hedge Traversal & Shortest Path',
    topic: 'Trees & Graphs',
    difficulty: 'Advanced',
    deviceLore:
      'The hedge maze branches into an intricate graph of stone plazas and archway nodes. Without a Breadth-First Search (BFS) shortest-path navigator, scholars wander into cyclic dead ends. Program the BFS exit calculator.',
    timeComplexityTarget: 'O(V + E) BFS queue',
    spaceComplexityTarget: 'O(V) visited array',
    description:
      'Given an unweighted adjacency list representing hedge connections between numbered plazas, calculate the minimum number of steps to traverse from the entrance (node 0) to the garden exit (node target).',
    starterCode: `#include <vector>
#include <queue>

int findShortestMazePath(int target, const std::vector<std::vector<int>>& adj) {
    if (target == 0) return 0;
    std::vector<bool> visited(adj.size(), false);
    std::queue<std::pair<int, int>> q; // {node, distance}

    q.push({0, 0});
    visited[0] = true;

    while (!q.empty()) {
        auto [curr, dist] = q.front();
        q.pop();

        if (curr == target) return dist;

        for (int neighbor : adj[curr]) {
            if (!visited[neighbor]) {
                visited[neighbor] = true;
                q.push({neighbor, dist + 1});
            }
        }
    }
    return -1; // Path not found
}`,
    solutionCode: `#include <vector>
#include <queue>

int findShortestMazePath(int target, const std::vector<std::vector<int>>& adj) {
    if (target == 0) return 0;
    std::vector<bool> visited(adj.size(), false);
    std::queue<std::pair<int, int>> q;

    q.push({0, 0});
    visited[0] = true;

    while (!q.empty()) {
        auto [curr, dist] = q.front();
        q.pop();

        if (curr == target) return dist;

        for (int neighbor : adj[curr]) {
            if (!visited[neighbor]) {
                visited[neighbor] = true;
                q.push({neighbor, dist + 1});
            }
        }
    }
    return -1;
}`,
    testCases: [
      {
        id: 'tc-1',
        input: 'Target: 5, Adj: [[1,3],[0,2],[1,5],[0,5],[5],[]]',
        expectedOutput: '2 steps (0 -> 3 -> 5)',
        explanation: 'BFS discovers the optimal 2-hop path over the longer 3-hop alternative.',
      },
      {
        id: 'tc-2',
        input: 'Target: 4, Adj: [[1],[0,2],[1,4],[4],[2,3]]',
        expectedOutput: '3 steps (0 -> 1 -> 2 -> 4)',
        explanation: 'Traverses linear hedge segment safely.',
      },
    ],
    hints: [
      'Use a FIFO std::queue to explore nodes level-by-level.',
      'Mark each plaza visited immediately upon enqueueing to prevent infinite cycles.',
    ],
    xpReward: 250,
  },

  'dsa-dp': {
    id: 'dsa-dp',
    roomId: 'server-basement',
    title: 'The Server Basement: Dynamic Programming & Thermal Memoization',
    topic: 'Dynamic Programming',
    difficulty: 'Expert',
    deviceLore:
      'The mansion mainframe is overheating. The cooling circuit computes power grid states using an unmemoized recursive function running in catastrophic O(2^n) exponential time. Implement memoization to drop computation to O(n) linear time before the core melts down.',
    timeComplexityTarget: 'O(n) linear time',
    spaceComplexityTarget: 'O(n) cache table',
    description:
      'Implement an optimized C++ function that calculates the nth power allocation coefficient using dynamic programming (memoization or 1D tabulation) instead of brute-force recursion.',
    starterCode: `#include <vector>

long long allocateCoolantEnergy(int n) {
    // BUG: Naive recursion takes 2^n operations and overheats at n > 30!
    // Implement memoization or 1D tabulation to achieve O(n)
    if (n <= 1) return n;

    std::vector<long long> dp(n + 1);
    dp[0] = 0;
    dp[1] = 1;

    for (int i = 2; i <= n; i++) {
        dp[i] = dp[i - 1] + dp[i - 2];
    }
    return dp[n];
}`,
    solutionCode: `#include <vector>

long long allocateCoolantEnergy(int n) {
    if (n <= 1) return n;
    std::vector<long long> dp(n + 1);
    dp[0] = 0;
    dp[1] = 1;
    for (int i = 2; i <= n; i++) {
        dp[i] = dp[i - 1] + dp[i - 2];
    }
    return dp[n];
}`,
    testCases: [
      {
        id: 'tc-1',
        input: 'n = 10',
        expectedOutput: '55 MW (0.01ms)',
        explanation: 'Base computation resolves instantly.',
      },
      {
        id: 'tc-2',
        input: 'n = 35',
        expectedOutput: '9227465 MW (0.02ms)',
        explanation: 'Avoids 9.2 million redundant recursive calls through DP.',
      },
      {
        id: 'tc-3',
        input: 'n = 50',
        expectedOutput: '12586269025 MW (0.03ms)',
        explanation: 'Linear time complexity handles large grid demands safely.',
      },
    ],
    hints: [
      'Create a std::vector<long long> dp(n + 1) to cache subproblem answers.',
      'Initialize dp[0] = 0 and dp[1] = 1, then iterate from 2 up to n.',
    ],
    xpReward: 300,
  },
};
