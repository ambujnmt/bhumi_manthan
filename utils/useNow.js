import { useEffect, useState } from "react";

/**
 * Current time (ms), updated every `intervalMs`.
 * null on the server and first render -> no hydration mismatch for time based UI (LIVE badge).
 */
export default function useNow(intervalMs = 30000) {
    const [now, setNow] = useState(null);

    useEffect(() => {
        setNow(Date.now());

        const timer = setInterval(() => setNow(Date.now()), intervalMs);

        return () => clearInterval(timer);
    }, [intervalMs]);

    return now;
}
