/**
 * Agent API client — Calls the FastAPI agent server from BFF routes.
 */

const AGENT_URL = process.env.ADK_AGENT_URL || "http://localhost:8080";
const AGENT_API_KEY = process.env.AGENT_API_KEY || "";
const AGENT_TIMEOUT = 90_000; // 90 seconds – image analysis can take longer

function getHeaders(): Record<string, string> {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };
  if (AGENT_API_KEY) {
    headers["X-API-Key"] = AGENT_API_KEY;
  }
  return headers;
}

/**
 * Call agent endpoint and return JSON response.
 */
export async function callAgent(
  endpoint: string,
  body: Record<string, unknown>
): Promise<Record<string, unknown>> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), AGENT_TIMEOUT);

  try {
    const res = await fetch(`${AGENT_URL}${endpoint}`, {
      method: "POST",
      headers: getHeaders(),
      body: JSON.stringify(body),
      signal: controller.signal,
    });

    if (!res.ok) {
      const text = await res.text().catch(() => "");
      throw new Error(`Agent responded with ${res.status}: ${text}`);
    }

    return await res.json();
  } finally {
    clearTimeout(timeout);
  }
}

/**
 * Call agent endpoint and return a streaming response body.
 */
export async function callAgentStream(
  endpoint: string,
  body: Record<string, unknown>
): Promise<ReadableStream<Uint8Array> | null> {
  const controller = new AbortController();
  // Longer timeout for streaming — agent server has its own 90s deadline
  const timeout = setTimeout(() => controller.abort(), 150_000);

  try {
    const res = await fetch(`${AGENT_URL}${endpoint}`, {
      method: "POST",
      headers: getHeaders(),
      body: JSON.stringify(body),
      signal: controller.signal,
    });

    if (!res.ok) {
      clearTimeout(timeout);
      const text = await res.text().catch(() => "");
      throw new Error(`Agent responded with ${res.status}: ${text}`);
    }

    // Clear timeout when stream starts (individual chunks have their own timing)
    clearTimeout(timeout);
    return res.body;
  } catch (err) {
    clearTimeout(timeout);
    throw err;
  }
}
