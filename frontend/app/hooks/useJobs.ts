import { useState, useEffect, useCallback, useLayoutEffect, useMemo, useRef } from "react";
import { useRouter } from "next/navigation";
import { Job, JobStatus } from "../types/job";
import { useWebsocket } from "./useWebsocket";
import { useAuth } from "../context/AuthContext";
// IMPORT FIX: Pull centralized workspace connection strings cleanly from your library module
import { API_BASE, WS_BASE } from "../lib/api";

export function useJobs() {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [displaySearch, setDisplaySearch] = useState(""); 
  const [searchQuery, setSearchQuery] = useState("");    
  
  // Engine Lifecycle State Signals
  const [isScanning, setIsScanning] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isActionLoading, setIsActionLoading] = useState(false); 

  const { authenticatedFetch, isAuthenticated } = useAuth();
  const router = useRouter();
  
  // Reference lock to prevent background triggers from executing states on dead unmounted pages
  const isMountedRef = useRef(true);

  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  // Redirect Guard: Lock out anonymous routing sessions instantly
  useLayoutEffect(() => {
    if (!isAuthenticated) {
      router.replace("/login");
    }
  }, [isAuthenticated, router]);

  // 1. LIFECYCLE BACKGROUND MONITOR: Poll independent background worker state
  useEffect(() => {
    if (!isAuthenticated) return;

    const syncScanStatus = async () => {
      try {
        const response = await authenticatedFetch(`${API_BASE}/scan/status`);
        if (!response.ok || !isMountedRef.current) {
          setIsScanning(false);
          return;
        }
        
        const data = await response.json().catch(() => ({}));
        setIsScanning(!!data.running);
      } catch (error) {
        if (isMountedRef.current) setIsScanning(false);
      }
    };

    syncScanStatus();
  }, [authenticatedFetch, isAuthenticated]);

  // Search Bar Input Debouncer Logic (300ms window)
  useEffect(() => {
    if (!isAuthenticated) return;
    const handler = setTimeout(() => {
      if (isMountedRef.current) setSearchQuery(displaySearch);
    }, 300); 

    return () => clearTimeout(handler);
  }, [displaySearch, isAuthenticated]);

  // 2. PRIMARY JOB LIST LOAD: Pulls the durable database-backed job records first
  const fetchRedisFeed = useCallback(async (search: string) => {
    if (!isAuthenticated) return;
    setIsLoading(true);
    try {
      const queryParams = new URLSearchParams({
        ...(search && { search }),
      });
      
      // Load the persisted referral job set first so the table is never blank when Redis is empty.
      const response = await authenticatedFetch(`${API_BASE}/jobs?${queryParams}`);
      if (!response.ok) throw new Error("Failed fetching current database job list");
      
      const rawData = await response.json().catch(() => null);
      
      if (!isMountedRef.current) return;

      // Crash-safe type guard boundaries for incoming cache drops
      if (Array.isArray(rawData)) {
        setJobs(rawData);
      } else if (rawData && typeof rawData === "object" && Array.isArray(rawData.items)) {
        setJobs(rawData.items); 
      } else {
        console.warn("⚠️ [Feed Sync] Received unrecognized data structure from job endpoint.");
        setJobs([]);
      }
    } catch (error) {
      console.error("❌ Error connecting to database-backed job storage:", error);
      if (isMountedRef.current) setJobs([]);
    } finally {
      if (isMountedRef.current) setIsLoading(false);
    }
  }, [authenticatedFetch, isAuthenticated]);

  // Re-synchronize feed when tokens or debounced filter metrics drift
  useEffect(() => {
    if (isAuthenticated) {
      fetchRedisFeed(searchQuery);
    }
  }, [searchQuery, fetchRedisFeed, isAuthenticated]);

  // Order-Independent Multi-Token "AND" Client UI Filter Map
  const filteredJobs = useMemo(() => {
    // Fortify filter loops from parsing crash failures if data sets drift into invalid structural configurations
    if (!Array.isArray(jobs)) return [];
    if (!searchQuery.trim()) return jobs;
    
    const tokens = searchQuery.toLowerCase().split(/\s+/).filter(Boolean);

    return jobs.filter((job) => {
      if (!job || typeof job !== "object") return false;
      
      const searchableText = [
        job.company || "",
        job.role || "",
        job.job_link || "",
        job.status || "",
        job.referral_message || "",
        job.notes || ""
      ].join(" ").toLowerCase();

      return tokens.every((token) => searchableText.includes(token));
    });
  }, [jobs, searchQuery]);

  // 3. REALTIME LIVE DROPS MERGE LAYER: Prepends stream events straight to index top [0]
  const handleIncomingLiveJob = useCallback((newJob: Job) => {
    if (!newJob || typeof newJob !== "object" || !newJob.job_hash) return;
    
    // Premium Console Visual telemetry formatting for incoming streaming notifications
    console.log(
      `%c📥 [Stream] Merging incoming packet pipeline element: ${newJob.company || "Unknown"}`,
      "color: #10b981; font-weight: bold; background: rgba(16,185,129,0.05); padding: 2px 4px; border-radius: 4px;"
    );

    setJobs((prevJobs) => {
      if (!Array.isArray(prevJobs)) return [newJob];
      // Prevent mutations to websocket state frames by generating an immutable copy slice block
      const cleanFreshJob = { ...newJob };
      const filtered = prevJobs.filter((j) => j && j.job_hash !== cleanFreshJob.job_hash);
      return [cleanFreshJob, ...filtered];
    });
  }, []);

  useWebsocket({
    url: `${WS_BASE}/ws/jobs`,
    onJobReceived: handleIncomingLiveJob,
  });

  // Toggle crawler loop execution states
  const toggleScan = async () => {
    if (!isAuthenticated || isActionLoading) return;
    setIsActionLoading(true);
    const action = isScanning ? "stop" : "start";
    
    try {
      const response = await authenticatedFetch(`${API_BASE}/scan/${action}`, { method: "POST" });
      const resData = await response.json().catch(() => ({}));
      
      if (!isMountedRef.current) return;

      if (resData.status === "started" || resData.status === "already_running") {
        setIsScanning(true);
      } else if (resData.status === "stopped") {
        setIsScanning(false);
      }
    } catch (error) {
      console.error("❌ Crawler command state dispatch fault handler:", error);
    } finally {
      if (isMountedRef.current) setIsActionLoading(false); 
    }
  };

  // 4. PERSISTENT TRANSACTION ENGINE: Commits patches to DB + Redis and applies optimistic local overrides
  const updateJobMutator = useCallback(async (hash: string, updates: { status?: JobStatus; notes?: string | null }) => {
    if (!isAuthenticated || !hash) return;
    
    // Telemetry trace log for transactional state audits
    console.log(
      `%c🔄 [Mutation] Deploying optimistic tracking metrics block for hash: ${hash.substring(0, 8)}...`,
      "color: #3b82f6; font-style: italic;"
    );

    // OPTIMISTIC LOCAL HUD RENDER OVERRIDE: Update local data array states immediately without triggering a page flash
    setJobs((prevJobs) => {
      if (!Array.isArray(prevJobs)) return [];
      return prevJobs.map((job) => (job && job.job_hash === hash ? { ...job, ...updates } : job));
    });

    try {
      // PATCH updates straight to your server container parameters mapping
      const response = await authenticatedFetch(`${API_BASE}/jobs/${hash}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updates),
      });

      if (!response.ok) throw new Error("Remote storage adjustment synchronization fault exception");

      if (!isMountedRef.current) return;

      // Clean rows out of viewport frame if closed criteria conditions are reached
      if (updates.status === "closed") {
        setJobs((prev) => {
          if (!Array.isArray(prev)) return [];
          return prev.filter((job) => job && job.job_hash !== hash);
        });
      }
    } catch (error) {
      console.error("❌ Failed executing sync update against persistent server endpoints:", error);
      // Fail-safe roll back to ensure state consistency if connection drops out mid-flight
      if (isMountedRef.current) {
        fetchRedisFeed(searchQuery);
      }
    }
  }, [authenticatedFetch, isAuthenticated, fetchRedisFeed, searchQuery]);

  return {
    jobs: filteredJobs,
    displaySearch,
    setDisplaySearch,
    isScanning,
    toggleScan,
    isLoading,
    isActionLoading,
    updateJobMutator,
  };
}