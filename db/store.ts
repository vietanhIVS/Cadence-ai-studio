import {initialState, withPresets, State} from '../lib/cadence';

// In-memory data store for training state per user in AI Studio
const memoryStore = new Map<string, { revision: number; data: string }>();

export function database() {
  return null;
}

export async function readState(userId: string): Promise<{ revision: number; state: State }> {
  let row = memoryStore.get(userId);
  if (!row) {
    const state = initialState();
    row = { revision: 0, data: JSON.stringify(state) };
    memoryStore.set(userId, row);
  }
  const previous = JSON.parse(row.data) as State;
  const needsCycleMigration = previous.schedules.some(
    schedule => schedule.status === 'ACTIVE' && !schedule.cycleState
  );
  const state = withPresets(previous);
  if (needsCycleMigration && state.schedules.some(schedule => schedule.status === 'ACTIVE' && schedule.cycleState)) {
    if (await writeState(userId, row.revision, state)) {
      return { revision: row.revision + 1, state };
    }
    return readState(userId);
  }
  return { revision: row.revision, state };
}

export async function writeState(userId: string, revision: number, state: State): Promise<boolean> {
  const current = memoryStore.get(userId);
  if (!current || current.revision !== revision) {
    return false;
  }
  current.revision += 1;
  current.data = JSON.stringify(state);
  return true;
}

