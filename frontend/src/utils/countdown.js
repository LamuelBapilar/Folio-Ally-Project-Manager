// 272 -> "4:32", 9 -> "0:09", 3725 -> "1:02:05"
export function formatCountdown(totalSeconds) {
    const seconds = Math.max(0, Math.ceil(totalSeconds));
  
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
  
    const pad = (n) => String(n).padStart(2, "0");
  
    return h > 0 ? `${h}:${pad(m)}:${pad(s)}` : `${m}:${pad(s)}`;
  }