/**
 * Genera un hash criptográfico anónimo del dispositivo/navegador
 * sin requerir permisos ni almacenar datos personales o identificables.
 */
export async function getDeviceFingerprint(): Promise<string> {
  if (typeof window === "undefined") return "server-side";

  try {
    const components = [
      navigator.userAgent,
      navigator.language,
      screen.width + "x" + screen.height + "x" + screen.colorDepth,
      new Intl.DateTimeFormat().resolvedOptions().timeZone,
      navigator.hardwareConcurrency || 0,
    ];

    const dataString = components.join("###");
    const msgUint8 = new TextEncoder().encode(dataString);
    const hashBuffer = await crypto.subtle.digest("SHA-256", msgUint8);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
  } catch {
    // Fallback aleatorio persistido si WebCrypto falla
    const key = "_anon_dev_id";
    let stored = localStorage.getItem(key);
    if (!stored) {
      stored = Math.random().toString(36).substring(2) + Date.now().toString(36);
      localStorage.setItem(key, stored);
    }
    return stored;
  }
}
