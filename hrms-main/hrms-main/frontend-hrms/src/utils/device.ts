export async function getPublicIp(): Promise<string | null> {
  try {
    const res = await fetch('https://api.ipify.org?format=json');
    const data = await res.json();
    return data.ip || null;
  } catch {
    return null;
  }
}

export function getBrowserSignature() {
  try {
    const ua = navigator.userAgent;
    const lang = navigator.language;
    const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
    const screenRes = `${window.screen.width}x${window.screen.height}`;
    return `${ua}|${lang}|${tz}|${screenRes}`.slice(0, 512);
  } catch {
    return 'unknown';
  }
}


