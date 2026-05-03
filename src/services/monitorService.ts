/**
 * STUB: Iterates through existing events to check for ticket status changes.
 * Returns a zeroed stats object to satisfy build requirements.
 */
export async function runMonitoring(limit: number = 20) {
  console.log(
    `[monitorService] Stub: runMonitoring called with limit ${limit}`,
  );
  return {
    checked: 0,
    updated: 0,
    changed: 0,
    errors: 0,
  };
}

/**
 * STUB: Generates a hash of event content to detect visual or data changes.
 */
export function generateContentHash(data: any): string {
  return "stub-hash";
}
