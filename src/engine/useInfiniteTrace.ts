import { useEffect, useState } from 'react';
import { traceEngine, type TraceState } from './infiniteTrace';

/**
 * React hook to consume throttled Infinite Trace telemetry metrics.
 * Optionally accepts a targetStudentId to guarantee subscription to that specific student account.
 */
export function useInfiniteTrace(targetStudentId?: string): TraceState {
  const [state, setState] = useState<TraceState>(() => {
    if (targetStudentId && targetStudentId !== traceEngine.getActiveStudentId()) {
      traceEngine.setActiveStudent(targetStudentId);
    }
    return traceEngine.getState();
  });

  useEffect(() => {
    if (targetStudentId && targetStudentId !== traceEngine.getActiveStudentId()) {
      traceEngine.setActiveStudent(targetStudentId);
    }
    setState(traceEngine.getState());

    return traceEngine.subscribe((next) => {
      if (!targetStudentId || next.studentId === targetStudentId) {
        setState(next);
      }
    });
  }, [targetStudentId]);

  return state;
}
