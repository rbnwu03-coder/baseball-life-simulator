/* Current browser cohort only. Historical integrity audit remains separate. */
const fs = require('fs');
const path = require('path');
const os = require('os');
const zlib = require('zlib');
const { createHarness, inspectGame, VERSION } = require('./match-authority-coverage-audit.cjs');
function runCohort(directory = path.join(os.tmpdir(), 'match-m0-f1cc66b-v2')) {
  fs.mkdirSync(directory, { recursive: true });
  const raw = path.join(directory, 'games.jsonl.gz');
  fs.writeFileSync(raw, '');
  const report = { auditVersion: VERSION, baseline: 'f1cc66b', attempted: 0, completed: 0,
    planned: 1400, requestedGroups: { bench: 1000, starter: 400 }, actualRoles: {}, games: [], failures: [], status: 'RUNNING' };
  const save = () => fs.writeFileSync(path.join(directory, 'cohort.json'), JSON.stringify(report, null, 2) + '\n');
  const h = createHarness();
  for (let index = 0; index < 1400; index++) {
    const role = index < 1000 ? 'bench' : 'starter';
    const seed = index < 1000 ? 22430000 + index : 22431000 + index - 1000;
    report.attempted++;
    try {
      const game = h.play(seed, role);
      const check = inspectGame(game);
      fs.appendFileSync(raw, zlib.gzipSync(JSON.stringify(game) + '\n'));
      report.games.push({ ...check, completed: game.result.completed,
        actualRole: game.match.playerLineupStatus, noProgress: game.result.noProgress,
        orphan: game.result.orphan, decisions: game.decisions.length });
      if (check.failures.length) {
        report.failures.push({ seed, role, failures: check.failures });
        fs.writeFileSync(path.join(directory, 'blocked-game.json'), JSON.stringify(game, null, 2));
        break;
      }
      report.completed++;
      report.actualRoles[game.match.playerLineupStatus] = (report.actualRoles[game.match.playerLineupStatus] || 0) + 1;
    } catch (error) {
      report.failures.push({ seed, role, code: 'CURRENT_PRODUCTION_EXCEPTION', error: error.stack });
      fs.writeFileSync(path.join(directory, 'blocked-player.json'), h.run('JSON.stringify(player, null, 2)'));
      break;
    }
    if (report.completed % 50 === 0) { save(); console.log('Current production ' + report.completed + '/1400'); }
  }
  report.status = report.failures.length ? 'STOP' : 'PASS';
  save();
  console.log(JSON.stringify({ directory, attempted: report.attempted, completed: report.completed, status: report.status, failures: report.failures }));
  return report;
}
module.exports = { runCohort };
if (require.main === module) { const r = runCohort(process.argv[2]); if (r.failures.length) process.exitCode = 1; }
