export async function delay(ms: number): Promise<void> {
  await new Promise((resolve) => setTimeout(resolve, ms));
}

export async function withTimeout<T>(
  promise: Promise<T>,
  timeoutMs: number,
  timeoutMessage = "Operation timed out",
): Promise<T> {
  let timeoutRef: NodeJS.Timeout | undefined;

  const timeoutPromise = new Promise<T>((_, reject) => {
    timeoutRef = setTimeout(() => reject(new Error(timeoutMessage)), timeoutMs);
  });

  try {
    return await Promise.race([promise, timeoutPromise]);
  } finally {
    if (timeoutRef) {
      clearTimeout(timeoutRef);
    }
  }
}

export interface PollOptions {
  timeoutMs: number;
  intervalMs: number;
  quietPeriodMs: number;
}

export async function pollUntilStable<T>(
  fetchState: () => Promise<T>,
  isStable: (prev: T, next: T) => boolean,
  options: PollOptions,
): Promise<{ result: T; timedOut: boolean }> {
  const startedAt = Date.now();
  let previous = await fetchState();
  let stableSince = Date.now();

  while (Date.now() - startedAt <= options.timeoutMs) {
    await delay(options.intervalMs);
    const current = await fetchState();
    if (isStable(previous, current)) {
      if (Date.now() - stableSince >= options.quietPeriodMs) {
        return { result: current, timedOut: false };
      }
    } else {
      stableSince = Date.now();
    }
    previous = current;
  }

  return { result: previous, timedOut: true };
}
