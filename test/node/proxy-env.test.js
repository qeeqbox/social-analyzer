import test from 'node:test'
import assert from 'node:assert/strict'
import { spawnSync } from 'node:child_process'
import path from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const repoRoot = path.resolve(__dirname, '..', '..')
const helperModuleUrl = pathToFileURL(path.join(repoRoot, 'modules', 'helper.js')).href

test('helper uses https_proxy from the environment', () => {
  const proxyUrl = 'http://127.0.0.1:7897'
  const result = spawnSync(
    process.execPath,
    [
      '--input-type=module',
      '-e',
      `
        process.env.https_proxy = ${JSON.stringify(proxyUrl)};
        process.env.http_proxy = '';
        const helper = (await import(${JSON.stringify(`${helperModuleUrl}?proxy-env-test=1`)})).default;
        console.log(JSON.stringify({
          proxy: helper.proxy,
          hasAgent: Boolean(helper.header_options.agent)
        }));
      `
    ],
    {
      cwd: repoRoot,
      encoding: 'utf8'
    }
  )

  assert.equal(result.status, 0, result.stderr)
  assert.notEqual(result.stdout.trim(), '')

  const parsed = JSON.parse(result.stdout.trim())
  assert.equal(parsed.proxy, proxyUrl)
  assert.equal(parsed.hasAgent, true)
})
