import { describe, expect, it } from 'vitest';
import { generateDailyMissions, MISSION_CATALOG, missionComplete } from './missions';

describe('generateDailyMissions', () => {
  it('picks exactly 3 missions', () => {
    expect(generateDailyMissions('2026-07-24')).toHaveLength(3);
  });

  it('is deterministic for the same date', () => {
    const a = generateDailyMissions('2026-07-24');
    const b = generateDailyMissions('2026-07-24');
    expect(a.map((m) => m.id)).toEqual(b.map((m) => m.id));
  });

  it('varies across different dates (not always the same set)', () => {
    const days = Array.from({ length: 10 }, (_, i) => generateDailyMissions(`2026-01-${String(i + 1).padStart(2, '0')}`));
    const uniqueSets = new Set(days.map((d) => d.map((m) => m.id).join(',')));
    expect(uniqueSets.size).toBeGreaterThan(1);
  });

  it('only draws from the catalog', () => {
    const ids = new Set(MISSION_CATALOG.map((m) => m.id));
    for (const mission of generateDailyMissions('2026-03-15')) {
      expect(ids.has(mission.id)).toBe(true);
    }
  });
});

describe('missionComplete', () => {
  it('is false under target and true at/over target', () => {
    const mission = MISSION_CATALOG[0];
    expect(missionComplete(mission.target - 1, mission)).toBe(false);
    expect(missionComplete(mission.target, mission)).toBe(true);
    expect(missionComplete(mission.target + 5, mission)).toBe(true);
  });
});
