import test from 'node:test'
import assert from 'node:assert/strict'
import { spawnSync } from 'node:child_process'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const repoRoot = path.resolve(__dirname, '..', '..')
const scriptPath = path.join(repoRoot, 'scripts', 'start-local.sh')

test('start-local dry-run prints the startup command', () => {
  const result = spawnSync('bash', [scriptPath], {
    cwd: repoRoot,
    encoding: 'utf8',
    env: {
      ...process.env,
      SOCIAL_ANALYZER_DRY_RUN: '1'
    }
  })

  assert.equal(result.status, 0, result.stderr)
  assert.match(result.stdout, /npm start/)
})
