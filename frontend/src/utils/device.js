// "Mozilla/5.0 (Windows NT 10.0...) Chrome/120..." becomes { label: "Chrome on Windows", mobile: false }
export function describeDevice(ua) {
    if (!ua) return { label: "Unknown device", mobile: false };
  
    // the order matters: Edge and Chrome also say "Safari", Android also says "Linux"
    const browser = /Edg\//.test(ua)
      ? "Edge"
      : /OPR\/|Opera/.test(ua)
        ? "Opera"
        : /Firefox\//.test(ua)
          ? "Firefox"
          : /Chrome\//.test(ua)
            ? "Chrome"
            : /Safari\//.test(ua)
              ? "Safari"
              : "Browser";
  
    const system = /Windows/.test(ua)
      ? "Windows"
      : /Android/.test(ua)
        ? "Android"
        : /iPhone|iPad|iPod/.test(ua)
          ? "iOS"
          : /Mac OS X|Macintosh/.test(ua)
            ? "macOS"
            : /CrOS/.test(ua)
              ? "ChromeOS"
              : /Linux/.test(ua)
                ? "Linux"
                : "an unknown system";
  
    return {
      label: `${browser} on ${system}`,
      mobile: /Android|iPhone|iPad|iPod|Mobile/.test(ua),
    };
  }