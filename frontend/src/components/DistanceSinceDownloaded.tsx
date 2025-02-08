import { formatDistanceToNow } from "date-fns";
import { useState, useEffect } from "react";

export function DistanceSinceDownloaded({
  lastDownloaded,
}: {
  lastDownloaded: number | null;
}) {
  const [text, setText] = useState("");

  useEffect(() => {
    if (!lastDownloaded) return;

    const lastDownloadedDate = new Date(lastDownloaded);

    function updateText() {
      setText(formatDistanceToNow(lastDownloadedDate));
    }

    updateText();

    const interval = setInterval(() => updateText(), 60000);
    return () => clearInterval(interval);
  }, [lastDownloaded]);

  return <>{lastDownloaded ? text + " ago" : "Never"}</>;
}
