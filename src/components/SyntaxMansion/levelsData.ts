import type { MansionLevel } from './types';

export const mansionLevels: MansionLevel[] = [
  // ========================================================
  // LEVEL 1 (BASIC): Variable Declaration & Printing
  // ========================================================
  {
    id: 1,
    floorTitle: 'Floor 1: The Syntax Cellar',
    subtitle: 'Foundation Variables & Standard Output',
    prompt: 'Write a C++ program to declare an integer variable "a" initialized to 10, print its value to cout, and return 0.',
    playerSpawn: { x: 1, y: 1 },
    walls: [
      // Outer border partitions
      { x: 0, y: 4 },
      { x: 1, y: 4 },
      { x: 2, y: 4 },
      { x: 4, y: 0 },
      { x: 4, y: 1 },
      { x: 4, y: 2 },
      // Central pillars
      { x: 6, y: 4 },
      { x: 7, y: 4 },
      { x: 8, y: 4 },
      { x: 4, y: 6 },
      { x: 4, y: 7 },
      { x: 4, y: 8 },
    ],
    furniture: [
      { x: 2, y: 1, name: "Scholar's Oak Desk", iconName: 'desk', isWalkable: false },
      { x: 7, y: 1, name: 'Ancient Bookshelf', iconName: 'bookshelf', isWalkable: false },
      { x: 1, y: 7, name: 'Mainframe Server', iconName: 'server', isWalkable: false },
      { x: 8, y: 7, name: 'Grand Hearth', iconName: 'hearth', isWalkable: false },
    ],
    clues: [
      {
        id: 'c1_1',
        x: 2,
        y: 2,
        name: 'Torn Manuscript',
        snippet: {
          id: 's1_main',
          text: 'int main() {',
          label: 'Entry Point',
          category: 'function',
        },
        collected: false,
      },
      {
        id: 'c1_2',
        x: 7,
        y: 2,
        name: 'Engraved Parchment',
        snippet: {
          id: 's1_var',
          text: 'int a = 10;',
          label: 'Variable Declaration',
          category: 'variable',
        },
        collected: false,
      },
      {
        id: 'c1_3',
        x: 2,
        y: 7,
        name: 'Glowing Silicon Fragment',
        snippet: {
          id: 's1_print',
          text: 'std::cout << a << std::endl;',
          label: 'Stream Output',
          category: 'statement',
        },
        collected: false,
      },
      {
        id: 'c1_4',
        x: 7,
        y: 7,
        name: 'Hearth Charred Token',
        snippet: {
          id: 's1_ret',
          text: 'return 0; }',
          label: 'Exit & Closing Scope',
          category: 'bracket',
        },
        collected: false,
      },
    ],
    correctOrder: ['s1_main', 's1_var', 's1_print', 's1_ret'],
    expectedOutput: '10',
    xpReward: 40,
  },

  // ========================================================
  // LEVEL 2 (LOOPS): For Loop Printing 1 to 5
  // ========================================================
  {
    id: 2,
    floorTitle: 'Floor 2: The Loop Lounge',
    subtitle: 'Iterative Counting & Scoped Loops',
    prompt: 'Write a C++ program containing a for-loop that prints numbers from 1 to 5 separated by a space.',
    playerSpawn: { x: 1, y: 8 },
    walls: [
      // Dividing corridor walls
      { x: 3, y: 2 },
      { x: 3, y: 3 },
      { x: 3, y: 4 },
      { x: 3, y: 5 },
      { x: 6, y: 4 },
      { x: 6, y: 5 },
      { x: 6, y: 6 },
      { x: 6, y: 7 },
    ],
    furniture: [
      { x: 1, y: 2, name: 'Cipher Terminal', iconName: 'terminal', isWalkable: false },
      { x: 8, y: 2, name: 'Library Shelf', iconName: 'bookshelf', isWalkable: false },
      { x: 8, y: 8, name: 'Lab Safe', iconName: 'safe', isWalkable: false },
    ],
    clues: [
      {
        id: 'c2_1',
        x: 1,
        y: 3,
        name: 'Terminal Card',
        snippet: {
          id: 's2_main',
          text: 'int main() {',
          label: 'Program Start',
          category: 'function',
        },
        collected: false,
      },
      {
        id: 'c2_2',
        x: 4,
        y: 3,
        name: 'Clockwork Gear Note',
        snippet: {
          id: 's2_loop',
          text: 'for (int i = 1; i <= 5; i++) {',
          label: 'For Loop Header',
          category: 'loop',
        },
        collected: false,
      },
      {
        id: 'c2_3',
        x: 7,
        y: 3,
        name: 'Book Spine Parchment',
        snippet: {
          id: 's2_print',
          text: 'std::cout << i << " ";',
          label: 'Output Step',
          category: 'statement',
        },
        collected: false,
      },
      {
        id: 'c2_4',
        x: 5,
        y: 7,
        name: 'Brass Bracket Token',
        snippet: {
          id: 's2_close',
          text: '}',
          label: 'End Loop Block',
          category: 'bracket',
        },
        collected: false,
      },
      {
        id: 'c2_5',
        x: 7,
        y: 8,
        name: 'Safe Keycard Slip',
        snippet: {
          id: 's2_ret',
          text: 'return 0; }',
          label: 'Exit Function',
          category: 'bracket',
        },
        collected: false,
      },
    ],
    correctOrder: ['s2_main', 's2_loop', 's2_print', 's2_close', 's2_ret'],
    expectedOutput: '1 2 3 4 5 ',
    xpReward: 40,
  },

  // ========================================================
  // LEVEL 3 (POINTERS/ADVANCED): Swapping Variables via Pointers
  // ========================================================
  {
    id: 3,
    floorTitle: 'Floor 3: The Pointer Laboratory',
    subtitle: 'Direct Memory Manipulation & Pointer Dereference',
    prompt: 'Construct a C++ function "void swap(int* x, int* y)" that swaps the values of two integers using memory dereference.',
    playerSpawn: { x: 5, y: 5 },
    walls: [
      { x: 2, y: 2 },
      { x: 3, y: 2 },
      { x: 6, y: 2 },
      { x: 7, y: 2 },
      { x: 2, y: 7 },
      { x: 3, y: 7 },
      { x: 6, y: 7 },
      { x: 7, y: 7 },
    ],
    furniture: [
      { x: 0, y: 0, name: 'Cryo Container', iconName: 'server', isWalkable: false },
      { x: 9, y: 0, name: 'Chemical Hood', iconName: 'terminal', isWalkable: false },
      { x: 0, y: 9, name: 'Research Console', iconName: 'desk', isWalkable: false },
      { x: 9, y: 9, name: 'Magnetic Vault', iconName: 'safe', isWalkable: false },
    ],
    clues: [
      {
        id: 'c3_1',
        x: 1,
        y: 1,
        name: 'Function Blueprint',
        snippet: {
          id: 's3_sig',
          text: 'void swap(int* x, int* y) {',
          label: 'Function Signature',
          category: 'function',
        },
        collected: false,
      },
      {
        id: 'c3_2',
        x: 8,
        y: 1,
        name: 'Memory Cache Voucher',
        snippet: {
          id: 's3_temp',
          text: 'int temp = *x;',
          label: 'Store Dereferenced *x',
          category: 'pointer',
        },
        collected: false,
      },
      {
        id: 'c3_3',
        x: 1,
        y: 8,
        name: 'Bus Transfer Note',
        snippet: {
          id: 's3_assign',
          text: '*x = *y;',
          label: 'Assign *y into *x',
          category: 'pointer',
        },
        collected: false,
      },
      {
        id: 'c3_4',
        x: 8,
        y: 8,
        name: 'Restore Cache Token',
        snippet: {
          id: 's3_restore',
          text: '*y = temp;',
          label: 'Assign temp into *y',
          category: 'pointer',
        },
        collected: false,
      },
      {
        id: 'c3_5',
        x: 5,
        y: 8,
        name: 'Function Seal Stone',
        snippet: {
          id: 's3_end',
          text: '}',
          label: 'Closing Scope',
          category: 'bracket',
        },
        collected: false,
      },
    ],
    correctOrder: ['s3_sig', 's3_temp', 's3_assign', 's3_restore', 's3_end'],
    expectedOutput: 'Values Swapped Successfully',
    xpReward: 40,
  },

  // ========================================================
  // LEVEL 4 (BONUS): Recursive Factorial
  // ========================================================
  {
    id: 4,
    floorTitle: 'Floor 4: The Recursion Chamber',
    subtitle: 'Call Stack & Base Case Induction',
    prompt: 'Assemble a recursive function "int factorial(int n)" that computes the factorial of n using base and inductive steps.',
    playerSpawn: { x: 0, y: 0 },
    walls: [
      { x: 4, y: 3 },
      { x: 4, y: 4 },
      { x: 5, y: 3 },
      { x: 5, y: 4 },
      { x: 2, y: 7 },
      { x: 7, y: 7 },
    ],
    furniture: [
      { x: 4, y: 0, name: 'Archival Pedestal', iconName: 'bookshelf', isWalkable: false },
      { x: 0, y: 5, name: 'Automaton Terminal', iconName: 'terminal', isWalkable: false },
      { x: 9, y: 5, name: 'Core Server', iconName: 'server', isWalkable: false },
    ],
    clues: [
      {
        id: 'c4_1',
        x: 2,
        y: 1,
        name: 'Stack Frame Note',
        snippet: {
          id: 's4_sig',
          text: 'int factorial(int n) {',
          label: 'Recursive Signature',
          category: 'function',
        },
        collected: false,
      },
      {
        id: 'c4_2',
        x: 7,
        y: 2,
        name: 'Base Case Parchment',
        snippet: {
          id: 's4_base',
          text: 'if (n <= 1) return 1;',
          label: 'Base Condition',
          category: 'statement',
        },
        collected: false,
      },
      {
        id: 'c4_3',
        x: 2,
        y: 8,
        name: 'Induction Step Scroll',
        snippet: {
          id: 's4_rec',
          text: 'return n * factorial(n - 1);',
          label: 'Recursive Step',
          category: 'statement',
        },
        collected: false,
      },
      {
        id: 'c4_4',
        x: 8,
        y: 8,
        name: 'Terminal Bracket Key',
        snippet: {
          id: 's4_end',
          text: '}',
          label: 'Close Block',
          category: 'bracket',
        },
        collected: false,
      },
    ],
    correctOrder: ['s4_sig', 's4_base', 's4_rec', 's4_end'],
    expectedOutput: 'factorial(5) = 120',
    xpReward: 40,
  },
];
