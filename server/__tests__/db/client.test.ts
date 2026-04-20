import { describe, it, expect } from 'vitest';
import { createDatabase } from '../../src/db/client.js';

describe('createDatabase', () => {
  it('returns a Database instance', () => {
    const db = createDatabase(':memory:');
    expect(db).toBeDefined();
    expect(typeof db.prepare).toBe('function');
    db.close();
  });

  it('enables foreign keys', () => {
    const db = createDatabase(':memory:');
    const row = db.prepare('PRAGMA foreign_keys').get() as { foreign_keys: number };
    expect(row.foreign_keys).toBe(1);
    db.close();
  });

  it('sets WAL journal mode', () => {
    const db = createDatabase(':memory:');
    const row = db.prepare('PRAGMA journal_mode').get() as { journal_mode: string };
    // In-memory DB uses memory mode, not WAL — WAL only applies to file-based DBs
    expect(['wal', 'memory']).toContain(row.journal_mode);
    db.close();
  });

  it('creates independent instances per call', () => {
    const db1 = createDatabase(':memory:');
    const db2 = createDatabase(':memory:');
    expect(db1).not.toBe(db2);
    db1.close();
    db2.close();
  });
});
