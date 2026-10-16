import type { AssembledLine, FloorId, ValidationFeedback } from './types';
import { floorsData } from './floorsData';

/**
 * Transparent deterministic C++ educational validator.
 * Validates syntax, block nesting, line ordering, and tests execution against target output.
 */
export function validateCodeAssembly(
  floorId: FloorId,
  assembledLines: AssembledLine[]
): ValidationFeedback {
  const floor = floorsData[floorId];
  if (!floor) {
    return {
      isValid: false,
      title: 'Unknown Floor',
      message: 'Floor data could not be loaded.',
      isHeartLost: false,
    };
  }

  // 1. Check for empty assembly
  if (assembledLines.length === 0) {
    return {
      isValid: false,
      title: 'Empty Assembly Buffer',
      message:
        'You have not placed any code fragments in the assembly panel yet. Explore the rooms, collect fragments, and add them to your program.',
      isHeartLost: false,
    };
  }

  // 2. Check for distractor fragments
  for (let i = 0; i < assembledLines.length; i++) {
    const line = assembledLines[i];
    const frag = floor.fragments.find((f) => f.id === line.fragmentId);
    if (frag?.isDistractor) {
      return {
        isValid: false,
        title: 'Syntax / Dialect Error',
        message: `Line ${i + 1} contains an invalid fragment: "${line.code}". ${
          frag.distractorReason || 'This syntax is incompatible with valid C++.'
        }`,
        syntaxErrorLine: i + 1,
        isHeartLost: true,
        simulatedOutput: `[COMPILER ERROR]\nLine ${i + 1}: ${line.code}\n^ error: unrecognized token or invalid dialect.`,
      };
    }
  }

  // 3. Check for matching braces count
  let openBraces = 0;
  for (let i = 0; i < assembledLines.length; i++) {
    const code = assembledLines[i].code;
    for (const ch of code) {
      if (ch === '{') openBraces++;
      if (ch === '}') openBraces--;
    }
    if (openBraces < 0) {
      return {
        isValid: false,
        title: 'Mismatched Braces',
        message: `Line ${i + 1} closes a block with '}' before an opening brace '{' exists.`,
        syntaxErrorLine: i + 1,
        isHeartLost: true,
        simulatedOutput: `[SYNTAX ERROR]\nLine ${i + 1}: }\n^ error: extraneous closing brace '}'.`,
      };
    }
  }

  if (openBraces !== 0) {
    return {
      isValid: false,
      title: 'Unclosed Code Block',
      message: `Your program has ${openBraces} unclosed '{' brace(s). Every opening brace must have a corresponding closing brace '}'.`,
      isHeartLost: true,
      simulatedOutput: `[SYNTAX ERROR]\nEnd of file: error: expected '}' at end of input.`,
    };
  }

  // 4. Check for missing required fragments
  const currentIds = assembledLines.map((l) => l.fragmentId);
  const expectedIds = floor.quest.expectedOrder;

  for (const expectedId of expectedIds) {
    if (!currentIds.includes(expectedId)) {
      const missingFrag = floor.fragments.find((f) => f.id === expectedId);
      return {
        isValid: false,
        title: 'Incomplete Program',
        message: `Your program is missing a required statement: "${
          missingFrag?.label || expectedId
        }". Search the floor to find the remaining code parchment.`,
        isHeartLost: true,
        simulatedOutput: `[LINKER ERROR]\nUndefined reference or incomplete declaration: "${missingFrag?.code || expectedId}".`,
      };
    }
  }

  // 5. Check ordering constraints
  // Check that #include <iostream> is at the very top (first line)
  const includeIdx = currentIds.findIndex((id) => id.includes('include'));
  if (includeIdx !== 0) {
    return {
      isValid: false,
      title: 'Header Order Error',
      message: '#include <iostream> must appear at the very beginning of the program before any function or statement.',
      syntaxErrorLine: includeIdx + 1,
      isHeartLost: true,
      simulatedOutput: `[COMPILER WARNING]\nLine ${includeIdx + 1}: #include directive must precede function definitions.`,
    };
  }

  // Check exact order against expected solution
  const isExactOrder =
    currentIds.length === expectedIds.length &&
    currentIds.every((id, idx) => id === expectedIds[idx]);

  if (!isExactOrder) {
    // Find the first line where current deviates from expected
    let mismatchLine = 1;
    for (let i = 0; i < currentIds.length; i++) {
      if (currentIds[i] !== expectedIds[i]) {
        mismatchLine = i + 1;
        break;
      }
    }

    return {
      isValid: false,
      title: 'Logical Sequence Error',
      message: `The sequence of execution is incorrect starting around Line ${mismatchLine}. Re-examine the order of statements (e.g. declare variables before calculating or printing them).`,
      syntaxErrorLine: mismatchLine,
      isHeartLost: true,
      simulatedOutput: `[LOGIC ERROR]\nLine ${mismatchLine}: Statement out of chronological scope.`,
    };
  }

  // 6. Full Success! Generate simulated compilation and runtime output
  let runtimeSim = '';
  if (floorId === 1) {
    runtimeSim = `[SIMULATED C++ EXECUTION]\n> Compiling: g++ -std=c++17 entrance_hall.cpp -o main\n> Compilation successful (0 warnings, 0 errors)\n> Linking standard iostream runtime...\n> Running ./main\n------------------------------------\nHello World\n------------------------------------\nProcess finished with exit code 0`;
  } else if (floorId === 2) {
    runtimeSim = `[SIMULATED C++ EXECUTION]\n> Compiling: g++ -std=c++17 scholars_engine.cpp -o main\n> Variable 'a' initialized to 15\n> Variable 'b' initialized to 25\n> Expression: a + b evaluated to 40\n> Streaming output to stdout...\n------------------------------------\n40\n------------------------------------\nProcess finished with exit code 0`;
  } else if (floorId === 3) {
    runtimeSim = `[SIMULATED C++ EXECUTION]\n> Compiling: g++ -std=c++17 automaton_governor.cpp -o main\n> Condition evaluated: (120 >= 100) -> TRUE\n> Branch selected: TRUE clause (OPTIMAL)\n------------------------------------\nOPTIMAL\n------------------------------------\nProcess finished with exit code 0`;
  } else if (floorId === 4) {
    runtimeSim = `[SIMULATED C++ EXECUTION]\n> Compiling: g++ -std=c++17 matrix_accumulator.cpp -o main\n> Invoking calculateSum(arr = {10, 20, 30, 40}, size = 4)\n> Iteration [0]: total = 0 + 10 -> 10\n> Iteration [1]: total = 10 + 20 -> 30\n> Iteration [2]: total = 30 + 30 -> 60\n> Iteration [3]: total = 60 + 40 -> 100\n> Loop completed safely without buffer overflow.\n------------------------------------\n100\n------------------------------------\nProcess finished with exit code 0`;
  }

  return {
    isValid: true,
    title: 'Quest Completed: Valid C++ Program!',
    message: `All syntax checks passed. The program compiled and produced the expected target output: "${floor.quest.expectedOutput}".`,
    simulatedOutput: runtimeSim,
    isHeartLost: false,
  };
}
