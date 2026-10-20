import "server-only";
import Anthropic from "@anthropic-ai/sdk";

let client: Anthropic | null = null;

/** The Anthropic client, or null when AI feedback is not configured. Secret key: server only. */
export function anthropicServer(): Anthropic | null {
  const key = process.env.ANTHROPIC_API_KEY;
  if (!key) return null;
  return (client ??= new Anthropic({
    apiKey: key,
    timeout: 60_000,
    maxRetries: 1,
  }));
}
