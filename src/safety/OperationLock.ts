type Unlock = () => void;

export class OperationLock {
  private readonly queues = new Map<string, Promise<void>>();

  async acquire(key: string): Promise<Unlock> {
    const current = this.queues.get(key) ?? Promise.resolve();
    let release!: () => void;
    const next = new Promise<void>((resolve) => {
      release = resolve;
    });
    this.queues.set(
      key,
      current.finally(() => next),
    );

    await current;

    let unlocked = false;
    return () => {
      if (unlocked) {
        return;
      }
      unlocked = true;
      release();
      const queued = this.queues.get(key);
      if (queued === next) {
        this.queues.delete(key);
      }
    };
  }
}
