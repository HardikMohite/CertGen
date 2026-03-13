import { useEffect, useState } from "react";
import { createSession } from "../services/api";

const STORAGE_KEY = "certgen_session_id";

export const useSession = () => {
  const [sessionId, setSessionId] = useState(() =>
    localStorage.getItem(STORAGE_KEY)
  );
  const [loading, setLoading] = useState(!sessionId);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (sessionId) return;
    let cancelled = false;

    setLoading(true);
    createSession()
      .then((res) => {
        if (cancelled) return;
        const id = res.data.session_id;
        localStorage.setItem(STORAGE_KEY, id);
        setSessionId(id);
      })
      .catch(() => {
        if (cancelled) return;
        setError("Failed to create session. Is the backend running?");
      })
      .finally(() => {
        if (cancelled) return;
        setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [sessionId]);

  const resetSession = () => {
    localStorage.removeItem(STORAGE_KEY);
    setSessionId(null);
    setError(null);
    setLoading(true);
  };

  return { sessionId, loading, error, resetSession };
};
