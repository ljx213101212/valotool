import assert from 'node:assert/strict';
import { normalizeOfficialMatch } from './officialMatchAdapter';

// 官方 VAL-MATCH-V1 形态的最小 fixture：puuid / timeSince* / 无顶层 kills（击杀在 playerStats 内）
const officialRaw = {
  matchInfo: {
    matchId: 'M1',
    mapId: '/Game/Maps/Ascent/Ascent',
    queueId: 'competitive',
    isRanked: true,
    gameStartMillis: 1000,
  },
  players: [
    { puuid: 'P-AAA', gameName: 'Atk', tagLine: '0001', teamId: 'Red', characterId: 'C1', competitiveTier: 20 },
    { puuid: 'P-BBB', gameName: 'Def', tagLine: '0002', teamId: 'Blue', characterId: 'C2', competitiveTier: 21 },
  ],
  roundResults: [
    {
      roundNum: 0,
      roundResult: 'Eliminated',
      winningTeam: 'Red',
      plantSite: 'A',
      plantLocation: { x: 100, y: 200 },
      plantPlayerLocations: [{ puuid: 'P-AAA', viewRadians: 1.5, location: { x: 90, y: 190 } }],
      defusePlayerLocations: null,
      playerStats: [
        {
          puuid: 'P-AAA',
          kills: [
            {
              killer: 'P-AAA',
              victim: 'P-BBB',
              victimLocation: { x: 300, y: 400 },
              assistants: [],
              playerLocations: [{ puuid: 'P-AAA', viewRadians: 0.5, location: { x: 310, y: 405 } }],
              finishingDamage: { damageType: 'Weapon', damageItem: 'W1', isSecondaryFireMode: false },
              timeSinceGameStartMillis: 12000,
              timeSinceRoundStartMillis: 8000,
            },
          ],
        },
        { puuid: 'P-BBB', kills: [] },
      ],
    },
  ],
};

const m = normalizeOfficialMatch(officialRaw);

// puuid → subject
assert.equal(m.players[0].subject, 'P-AAA', 'player puuid 应映射为 subject');
assert.equal(m.players[1].subject, 'P-BBB');

// 顶层 kills 从 roundResults 重建，带 round
assert.equal(m.kills?.length, 1, '应从 playerStats 重建出 1 个顶层 kill');
const k = m.kills![0];
assert.equal(k.round, 0, 'kill 应带回合号');

// timeSince* → gameTime/roundTime
assert.equal(k.gameTime, 12000, 'timeSinceGameStartMillis → gameTime');
assert.equal(k.roundTime, 8000, 'timeSinceRoundStartMillis → roundTime');

// playerLocations 内 puuid → subject
assert.equal(k.playerLocations[0].subject, 'P-AAA', 'playerLocations puuid → subject');

// 装置点与下包快照
const r0 = m.roundResults![0];
assert.equal(r0.plantSite, 'A');
assert.deepEqual(r0.plantLocation, { x: 100, y: 200 });
assert.equal(r0.plantPlayerLocations?.[0].subject, 'P-AAA', 'plantPlayerLocations puuid → subject');
assert.equal(r0.defusePlayerLocations, null);

// 本地形态（subject/gameTime）也应被宽松接受（幂等性）
const localRaw = {
  matchInfo: { matchId: 'M2', mapId: '/Game/Maps/Ascent/Ascent', queueID: 'competitive', isRanked: true },
  players: [{ subject: 'L-AAA', gameName: 'X', tagLine: '1', teamId: 'Red', characterId: 'C' }],
  roundResults: [
    {
      roundNum: 0,
      playerStats: [
        {
          subject: 'L-AAA',
          kills: [
            {
              killer: 'L-AAA',
              victim: 'L-BBB',
              victimLocation: { x: 1, y: 2 },
              playerLocations: [{ subject: 'L-AAA', viewRadians: 0, location: { x: 1, y: 1 } }],
              gameTime: 5000,
              roundTime: 3000,
            },
          ],
        },
      ],
    },
  ],
};
const m2 = normalizeOfficialMatch(localRaw);
assert.equal(m2.players[0].subject, 'L-AAA', '本地 subject 应保留');
assert.equal(m2.kills![0].roundTime, 3000, '本地 roundTime 应保留');

console.log('officialMatchAdapter.test.ts ✓');
