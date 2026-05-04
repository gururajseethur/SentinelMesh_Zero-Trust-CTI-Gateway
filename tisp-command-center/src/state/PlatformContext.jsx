import React, { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import { platformAPI } from '../lib/platformAPI';

const PlatformContext = createContext(null);

const MAX_BACKOFF_MS = 300_000; // cap at 5 minutes on sustained failure

export function PlatformProvider({ children }) {
  const [stats, setStats] = useState(null);
  const [mispEvents, setMispEvents] = useState([]);
  const [thehiveCases, setThehiveCases] = useState([]);
  const [openctiEntities, setOpenctiEntities] = useState([]);
  const [workflows, setWorkflows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState(null);
  const [error, setError] = useState(null);
  const mountedRef = useRef(true);
  const failCountRef = useRef(0);

  const refresh = useCallback(async () => {
    try {
      const [data, events, cases, entities, workflowData] = await Promise.all([
        platformAPI.getAllStats(),
        platformAPI.getMISPEvents(),
        platformAPI.getTheHiveCases(),
        platformAPI.getOpenCTIEntities(),
        platformAPI.getAutomationWorkflows(),
      ]);
      if (!mountedRef.current) return;
      failCountRef.current = 0;
      setStats(data);
      setMispEvents(events);
      setThehiveCases(cases);
      setOpenctiEntities(entities);
      setWorkflows(workflowData);
      setLastUpdated(new Date());
      setError(null);
    } catch (err) {
      if (!mountedRef.current) return;
      failCountRef.current = Math.min(failCountRef.current + 1, 5);
      setError(err.message ?? 'Unknown error');
    } finally {
      if (mountedRef.current) setLoading(false);
    }
  }, []);

  useEffect(() => {
    mountedRef.current = true;
    let timerId;

    const scheduleNext = (delayMs) => {
      timerId = setTimeout(async () => {
        if (!mountedRef.current) return;
        await refresh();
        if (!mountedRef.current) return;
        // Exponential backoff: pollInterval * 2^failures, capped at MAX_BACKOFF_MS
        const nextDelay = failCountRef.current > 0
          ? Math.min(platformAPI.pollInterval * 2 ** failCountRef.current, MAX_BACKOFF_MS)
          : platformAPI.pollInterval;
        scheduleNext(nextDelay);
      }, delayMs);
    };

    scheduleNext(0);

    return () => {
      mountedRef.current = false;
      clearTimeout(timerId);
    };
  }, [refresh]);

  return (
    <PlatformContext.Provider value={{ stats, mispEvents, thehiveCases, openctiEntities, workflows, loading, lastUpdated, error, refresh }}>
      {children}
    </PlatformContext.Provider>
  );
}

export function usePlatform() {
  const ctx = useContext(PlatformContext);
  if (!ctx) throw new Error('usePlatform must be used inside <PlatformProvider>');
  return ctx;
}
