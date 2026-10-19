import type { QuizQuestion } from '@/types';

export interface AcademicTopic {
  id: string;
  name: string;
  description: string;
  difficulty: 'Beginner' | 'Intermediate' | 'Advanced';
  questions: QuizQuestion[];
}

export interface AcademicSubject {
  id: string;
  name: string;
  code: string;
  syllabus: string;
  iconName: string;
  accentColor: string;
  description: string;
  topics: AcademicTopic[];
}

export const ACADEMIC_SUBJECTS: AcademicSubject[] = [
  // 1. C++ Programming
  {
    id: 'cpp',
    name: 'C++ Systems Programming',
    code: 'CSE-101',
    syllabus: 'First-Year B.Tech Core Computer Science',
    iconName: 'Cpu',
    accentColor: '#38BDF8', // Cyan
    description: 'Memory models, pointers, object lifecycles, and low-level system performance.',
    topics: [
      {
        id: 'pointers',
        name: 'Pointers & Memory Architecture',
        description: 'Pointer arithmetic, dereferencing, dynamic heap allocation, and memory leaks.',
        difficulty: 'Intermediate',
        questions: [
          {
            id: 'cpp-ptr-01',
            topic: 'Pointers',
            difficulty: 'Intermediate',
            prompt: 'In C++, what does the expression *(ptr + 2) do if ptr is of type int*?',
            options: [
              'Adds 2 to the value pointed to by ptr',
              'Accesses the element 2 integer memory positions ahead of ptr',
              'Multiplies the address in ptr by 2 bytes',
              'Causes a compilation error because pointer addition is invalid',
            ],
            correctOptionIndex: 1,
            explanation: 'In C++, pointer arithmetic scales automatically by sizeof(T). Thus, *(ptr + 2) accesses the memory address at ptr + 2 * sizeof(int).',
          },
          {
            id: 'cpp-ptr-02',
            topic: 'Pointers',
            difficulty: 'Advanced',
            prompt: 'Which operator is required in C++ to release an array allocated with int* arr = new int[50];?',
            options: [
              'free(arr);',
              'delete arr;',
              'delete[] arr;',
              'arr.release();',
            ],
            correctOptionIndex: 2,
            explanation: 'Memory allocated using new[] MUST be released with delete[] to ensure all destructors and runtime array bounds are cleaned up properly.',
          },
          {
            id: 'cpp-ptr-03',
            topic: 'Pointers',
            difficulty: 'Beginner',
            prompt: 'What value is held by a nullptr in modern C++ (C++11 and beyond)?',
            options: [
              'A void pointer pointing to physical address 0x01',
              'A type-safe null pointer literal of type std::nullptr_t',
              'An integer with binary representation 0xFFFF',
              'A macro alias for (void*)1',
            ],
            correctOptionIndex: 1,
            explanation: 'nullptr is a keyword and prvalue of type std::nullptr_t, eliminating ambiguities with integer 0 in function overloads.',
          },
        ],
      },
      {
        id: 'arrays',
        name: 'Arrays & Contiguous Memory',
        description: '1D/2D arrays, cache locality, vector comparison, and index boundaries.',
        difficulty: 'Beginner',
        questions: [
          {
            id: 'cpp-arr-01',
            topic: 'Arrays',
            difficulty: 'Beginner',
            prompt: 'What happens when an array name is passed directly as a function argument in C++?',
            options: [
              'The entire array is deep-copied onto the stack',
              'It decays into a pointer to its first element',
              'It passes a immutable std::vector reference',
              'It throws a compile-time pass-by-value exception',
            ],
            correctOptionIndex: 1,
            explanation: 'In C++, arrays decay to a pointer to their first element (T*) when passed to functions, unless passed by explicit reference.',
          },
          {
            id: 'cpp-arr-02',
            topic: 'Arrays',
            difficulty: 'Intermediate',
            prompt: 'For a 2D array int mat[3][4], how is data organized in memory by standard C++ compilers?',
            options: [
              'Column-major order (columns stored consecutively)',
              'Row-major order (rows stored consecutively)',
              'Segmented tree structure with hash lookups',
              'Non-contiguous randomized heap pointers',
            ],
            correctOptionIndex: 1,
            explanation: 'C and C++ organize multidimensional arrays in contiguous Row-Major order.',
          },
        ],
      },
      {
        id: 'oops',
        name: 'OOPs & Polymorphism',
        description: 'Classes, vtables, inheritance, virtual destructors, and access specifiers.',
        difficulty: 'Advanced',
        questions: [
          {
            id: 'cpp-oop-01',
            topic: 'OOPs',
            difficulty: 'Advanced',
            prompt: 'Why should a base class destructor almost always be marked virtual in C++?',
            options: [
              'To allow the base class to instantiate without a constructor',
              'To prevent undefined behavior when deleting a derived object via a base pointer',
              'To force all child classes to declare private destructors',
              'To increase cache performance during stack allocation',
            ],
            correctOptionIndex: 1,
            explanation: 'Deleting a derived instance through a Base* without a virtual destructor invokes only the base destructor, leaking derived resources.',
          },
          {
            id: 'cpp-oop-02',
            topic: 'OOPs',
            difficulty: 'Intermediate',
            prompt: 'What is a pure virtual function in C++?',
            options: [
              'A function defined inside a struct with zero parameters',
              'A virtual function assigned = 0 that makes the class abstract',
              'A static member function that cannot access private variables',
              'A function written in assembly language inline',
            ],
            correctOptionIndex: 1,
            explanation: 'A virtual function declared with = 0 is pure virtual and requires derived classes to implement it, making the containing class abstract.',
          },
        ],
      },
    ],
  },

  // 2. HTML5 Web Architecture
  {
    id: 'html',
    name: 'HTML5 & Web Architecture',
    code: 'WEB-102',
    syllabus: 'Internet & Web Technologies Module',
    iconName: 'Globe',
    accentColor: '#F97316', // Orange
    description: 'Semantic markup, accessibility hierarchy, form controls, and modern DOM elements.',
    topics: [
      {
        id: 'semantics',
        name: 'Semantic Elements & Structure',
        description: 'Semantic tags, document landmarks, header/nav hierarchies, and SEO.',
        difficulty: 'Beginner',
        questions: [
          {
            id: 'html-sem-01',
            topic: 'Semantic HTML',
            difficulty: 'Beginner',
            prompt: 'Which HTML5 element represents standalone, independently distributable content?',
            options: ['<section>', '<article>', '<aside>', '<main>'],
            correctOptionIndex: 1,
            explanation: '<article> represents self-contained content that could be syndicated independently (e.g. blog post, news article, forum comment).',
          },
          {
            id: 'html-sem-02',
            topic: 'Semantic HTML',
            difficulty: 'Intermediate',
            prompt: 'What is the purpose of the <meta name="viewport" content="width=device-width, initial-scale=1.0"> tag?',
            options: [
              'It enables WebGL hardware acceleration',
              'It matches page width to screen width for responsive mobile rendering',
              'It encrypts HTTP headers for mobile browsing',
              'It forces desktop browser zoom to 150%',
            ],
            correctOptionIndex: 1,
            explanation: 'The viewport meta tag instructs mobile browsers to render the document viewport matching device physical pixels.',
          },
        ],
      },
      {
        id: 'forms',
        name: 'Forms & Client Validation',
        description: 'Input types, form patterns, required constraints, and accessible labels.',
        difficulty: 'Intermediate',
        questions: [
          {
            id: 'html-frm-01',
            topic: 'Forms',
            difficulty: 'Intermediate',
            prompt: 'Which HTML attribute binds an <input> element to its corresponding <label> for screen readers and click targets?',
            options: [
              'The label’s "for" attribute matching the input’s "id"',
              'The input’s "name" attribute matching the label’s "class"',
              'The "aria-bind" attribute on the surrounding form',
              'The "rel" attribute on the input',
            ],
            correctOptionIndex: 0,
            explanation: 'A <label for="userId"> associates with <input id="userId">, enabling assistive tech announcement and enlarged click targets.',
          },
        ],
      },
    ],
  },

  // 3. CSS3 & Responsive Systems
  {
    id: 'css',
    name: 'CSS3 & Responsive Design',
    code: 'WEB-103',
    syllabus: 'Frontend Styling & UI Systems',
    iconName: 'Palette',
    accentColor: '#3B82F6', // Blue
    description: 'Flexbox, CSS Grid, Box Model calculations, specificity, and hardware transforms.',
    topics: [
      {
        id: 'flexbox-grid',
        name: 'Flexbox & CSS Grid',
        description: '1D vs 2D layout paradigms, alignment axes, grid template areas, and fractions.',
        difficulty: 'Intermediate',
        questions: [
          {
            id: 'css-flx-01',
            topic: 'Flexbox',
            difficulty: 'Beginner',
            prompt: 'When flex-direction is "column", which property controls cross-axis alignment?',
            options: [
              'justify-content',
              'align-items',
              'flex-grow',
              'order',
            ],
            correctOptionIndex: 1,
            explanation: 'In flex column orientation, the main axis is vertical (justify-content) and the cross axis is horizontal (align-items).',
          },
          {
            id: 'css-grd-02',
            topic: 'CSS Grid',
            difficulty: 'Intermediate',
            prompt: 'What does the CSS grid value "repeat(auto-fit, minmax(200px, 1fr))" achieve?',
            options: [
              'Creates a static 200px column fixed across all screens',
              'Automatically generates columns that wrap and expand to fill available container space',
              'Shrinks all items to exactly 1 pixel width',
              'Disables responsive wrap on mobile devices',
            ],
            correctOptionIndex: 1,
            explanation: 'repeat(auto-fit, minmax(200px, 1fr)) is the modern responsive grid standard that automatically computes optimal columns without media queries.',
          },
        ],
      },
      {
        id: 'box-model',
        name: 'Box Model & Specificity',
        description: 'box-sizing: border-box, margin collapse, and CSS specificity cascade rules.',
        difficulty: 'Intermediate',
        questions: [
          {
            id: 'css-box-01',
            topic: 'Box Model',
            difficulty: 'Beginner',
            prompt: 'How does "box-sizing: border-box" alter width calculation for an HTML element?',
            options: [
              'Padding and border are included inside the specified width and height',
              'Padding is doubled and added outside the margin',
              'Borders are removed completely on smaller viewports',
              'Width only applies to margins, leaving padding automatic',
            ],
            correctOptionIndex: 0,
            explanation: 'With border-box, the declared width covers content + padding + border, preventing elements from expanding beyond their containers.',
          },
        ],
      },
    ],
  },

  // 4. Python for Engineers
  {
    id: 'python',
    name: 'Python for Engineers',
    code: 'CSE-104',
    syllabus: 'Computational Problem Solving & Scripting',
    iconName: 'Terminal',
    accentColor: '#10B981', // Emerald
    description: 'Data structures, list comprehensions, decorators, and engineering libraries.',
    topics: [
      {
        id: 'data-structures',
        name: 'Data Structures & Mutability',
        description: 'Lists vs Tuples, Dictionary hash lookups, Set operations, and memory references.',
        difficulty: 'Beginner',
        questions: [
          {
            id: 'py-ds-01',
            topic: 'Data Structures',
            difficulty: 'Beginner',
            prompt: 'Which Python data structure is immutable and can be used as a dictionary key?',
            options: ['list', 'tuple', 'set', 'dict'],
            correctOptionIndex: 1,
            explanation: 'Tuples are immutable sequences in Python; provided their elements are hashable, they can serve as dictionary keys.',
          },
          {
            id: 'py-ds-02',
            topic: 'Data Structures',
            difficulty: 'Intermediate',
            prompt: 'What is the average time complexity of checking membership (x in s) for a Python set?',
            options: ['O(n)', 'O(1)', 'O(log n)', 'O(n²)'],
            correctOptionIndex: 1,
            explanation: 'Python sets are implemented using hash tables with average O(1) constant time membership lookups.',
          },
        ],
      },
      {
        id: 'functions-generators',
        name: 'Functions, Lambdas & Generators',
        description: 'Closures, *args/**kwargs, lazy generator evaluation with yield, and memory efficiency.',
        difficulty: 'Advanced',
        questions: [
          {
            id: 'py-gen-01',
            topic: 'Generators',
            difficulty: 'Advanced',
            prompt: 'What is the primary memory advantage of a generator function using "yield" over a function returning a list?',
            options: [
              'It compiles directly to native C x86 assembly',
              'It evaluates values lazily one at a time without allocating memory for the entire sequence',
              'It automatically distributes computation across multiple CPU threads',
              'It bypasses Python’s Global Interpreter Lock (GIL)',
            ],
            correctOptionIndex: 1,
            explanation: 'Generators produce items on demand (lazy evaluation), maintaining internal state with minimal memory footprint.',
          },
        ],
      },
    ],
  },

  // 5. Engineering Mathematics
  {
    id: 'math',
    name: 'Engineering Mathematics',
    code: 'MTH-101',
    syllabus: 'First-Year Engineering Mathematics Syllabus',
    iconName: 'Sigma',
    accentColor: '#D0B477', // Gold
    description: 'Linear algebra, matrix eigenvalues, calculus, differential equations, and vectors.',
    topics: [
      {
        id: 'matrices',
        name: 'Linear Algebra & Matrices',
        description: 'Determinants, matrix rank, Eigenvalues, Eigenvectors, and Cayley-Hamilton theorem.',
        difficulty: 'Intermediate',
        questions: [
          {
            id: 'mth-mat-01',
            topic: 'Matrices',
            difficulty: 'Intermediate',
            prompt: 'If a square matrix A has an eigenvalue λ = 0, what does this imply about the matrix?',
            options: [
              'Matrix A is an identity matrix',
              'The determinant of A is zero (A is singular / non-invertible)',
              'Matrix A must be symmetric',
              'The trace of A must be equal to 1',
            ],
            correctOptionIndex: 1,
            explanation: 'The determinant of a matrix equals the product of its eigenvalues. If any λ = 0, det(A) = 0, meaning A is singular.',
          },
          {
            id: 'mth-mat-02',
            topic: 'Matrices',
            difficulty: 'Advanced',
            prompt: 'According to the Cayley-Hamilton Theorem, every square matrix satisfies what?',
            options: [
              'Its own characteristic polynomial equation',
              'The Laplace expansion along its main diagonal',
              'The Cauchy-Riemann conditions',
              'A zero determinant under all row transformations',
            ],
            correctOptionIndex: 0,
            explanation: 'The Cayley-Hamilton theorem states that if p(λ) = det(λI - A) is the characteristic polynomial of A, then p(A) = 0.',
          },
        ],
      },
      {
        id: 'calculus',
        name: 'Calculus & Partial Derivatives',
        description: 'Taylor expansions, maxima/minima, gradient vector fields, and multiple integrals.',
        difficulty: 'Intermediate',
        questions: [
          {
            id: 'mth-calc-01',
            topic: 'Calculus',
            difficulty: 'Intermediate',
            prompt: 'What does the gradient (∇f) of a scalar multivariable function f(x, y, z) represent physically?',
            options: [
              'The total volume under the surface',
              'The direction of maximum rate of increase of the function and its magnitude',
              'The point where the second derivative vanishes',
              'The curvature of the tangent plane at the origin',
            ],
            correctOptionIndex: 1,
            explanation: 'The gradient vector points in the direction of the greatest rate of increase of the function, with magnitude equal to that rate.',
          },
        ],
      },
    ],
  },

  // 6. Engineering Physics
  {
    id: 'physics',
    name: 'Engineering Physics',
    code: 'PHY-101',
    syllabus: 'Standard Indian B.Tech Applied Physics Curriculum',
    iconName: 'Atom',
    accentColor: '#A855F7', // Purple
    description: 'Quantum mechanics, wave optics, semiconductor band theory, and electromagnetism.',
    topics: [
      {
        id: 'optics-quantum',
        name: 'Wave Optics & Quantum Physics',
        description: 'Interference, diffraction, De Broglie matter waves, and Heisenberg uncertainty.',
        difficulty: 'Intermediate',
        questions: [
          {
            id: 'phy-opt-01',
            topic: 'Quantum Physics',
            difficulty: 'Beginner',
            prompt: 'What is the De Broglie wavelength λ associated with a particle having momentum p?',
            options: [
              'λ = h * p',
              'λ = h / p',
              'λ = p / h',
              'λ = h * c / p²',
            ],
            correctOptionIndex: 1,
            explanation: 'According to the de Broglie hypothesis, matter has wave-like properties with wavelength λ = h / p (where h is Planck’s constant).',
          },
          {
            id: 'phy-opt-02',
            topic: 'Wave Optics',
            difficulty: 'Intermediate',
            prompt: 'In Young’s Double Slit Experiment, what happens to fringe width if the distance between the two slits is halved?',
            options: [
              'Fringe width is halved',
              'Fringe width is doubled',
              'Fringe width remains unchanged',
              'Fringes disappear completely',
            ],
            correctOptionIndex: 1,
            explanation: 'Fringe width β = (λ * D) / d. Since fringe width is inversely proportional to slit distance d, halving d doubles the fringe width.',
          },
        ],
      },
      {
        id: 'semiconductors',
        name: 'Semiconductors & Solid State',
        description: 'Intrinsic/extrinsic bands, Fermi energy level, and p-n junction depletion zones.',
        difficulty: 'Intermediate',
        questions: [
          {
            id: 'phy-semi-01',
            topic: 'Semiconductors',
            difficulty: 'Intermediate',
            prompt: 'Where is the Fermi energy level located in an intrinsic semiconductor at absolute zero (0 K)?',
            options: [
              'At the bottom of the conduction band',
              'Exactly midway between the valence band and conduction band',
              'At the top of the valence band',
              'Above the vacuum energy level',
            ],
            correctOptionIndex: 1,
            explanation: 'In pure (intrinsic) semiconductors, electron and hole concentrations are identical, positioning the Fermi level exactly in the center of the forbidden energy gap.',
          },
        ],
      },
    ],
  },
];
