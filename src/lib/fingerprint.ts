/**
 * Genera una identificación híbrida anónima del dispositivo:
 * 1. UUID persistente único por navegador (almacenado en localStorage).
 * 2. Hash criptográfico de características de hardware (pantalla, OS, etc.).
 * Retorna formato compuesto: `${clientUuid}:::${hardwareHash}`
 */
export async function getDeviceFingerprint(): Promise<string> {
  if (typeof window === "undefined") return "server-side";

  // 1. Obtener o generar UUID único persistente por navegador
  const uuidKey = "_unne_anon_device_uid";
  let clientUuid = "";
  try {
    clientUuid = localStorage.getItem(uuidKey) || "";
    if (!clientUuid || clientUuid.length < 10) {
      clientUuid =
        typeof crypto !== "undefined" && typeof crypto.randomUUID === "function"
          ? crypto.randomUUID()
          : Math.random().toString(36).substring(2) + Date.now().toString(36);
      localStorage.setItem(uuidKey, clientUuid);
    }
  } catch {
    clientUuid = Math.random().toString(36).substring(2) + Date.now().toString(36);
  }

  // 2. Generar hash de hardware (características físicas del dispositivo)
  let hardwareHash = "";
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
    hardwareHash = hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
  } catch {
    hardwareHash = "hw-" + (screen.width || 0) + "x" + (screen.height || 0);
  }

  return `${clientUuid}:::${hardwareHash}`;
}
