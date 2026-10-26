/** Run each statistics query at a bounded rate, never concurrently with itself.
 * The delay starts AFTER completion to prevent query backlog under load.
 */
const runningTasks = new Set<string>();

export function startPeriodicStats(
  name: string,
  intervalMs: number,
  update: () => Promise<void>,
): void {
  if (runningTasks.has(name)) return;
  runningTasks.add(name);

  const run = async (): Promise<void> => {
    try {
      await update();
    } catch (error) {
      console.error(`[stats:${name}] refresh failed:`, error);
    } finally {
      setTimeout(() => { void run(); }, intervalMs);
    }
  };
  // Run the first update without waiting for the initial interval.
  void run();
  console.log(`[stats:${name}] scheduled every ${intervalMs}ms (after completion)`);
}
