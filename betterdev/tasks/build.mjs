#!/usr/bin/env node
// Builds the feature map from the briefs.
//
//   node betterdev/tasks/build.mjs          writes README.md's feature map + index.json
//   node betterdev/tasks/build.mjs --check  fails if either is stale or a brief is malformed
//
// Sources: the briefs in be/ and fe/ (title, **Type/Track/Needs/Feature** line,
// **What the app's users get:**, **Where:**, the "Done when" list) and
// features.json (the product features, in the order the app grows).
// index.json is what BetterDev reads to show each task on its milestone page.
import { readFileSync, readdirSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const here = dirname(fileURLToPath(import.meta.url))
const check = process.argv.includes('--check')
const problems = []
const fail = (msg) => problems.push(msg)

const TRACKS = { be: 'backend', fe: 'frontend' }
const DONE = '**Done when (checked by the BetterDev check):**'
const ALSO = '**Also expected (reviewed, not checked automatically):**'
const USERS = "**What the app's users get:**"
const INTERNAL = 'Nothing visible'

const features = JSON.parse(readFileSync(join(here, 'features.json'), 'utf8'))
const featureByTitle = new Map(features.map((f) => [f.title, f]))
if (featureByTitle.size !== features.length) fail('features.json: duplicate feature title')

function field(line, key) {
  const m = line.match(new RegExp(`\\*\\*${key}:\\*\\* ([^·]+)`))
  return m ? m[1].trim() : null
}

function parseNeeds(raw) {
  if (!raw) return []
  return raw.split(',').map((part) => {
    const mockable = /\(or mock it\)/.test(part)
    return { id: part.replace(/\(or mock it\)/, '').trim(), mockable }
  })
}

/** Paragraph blocks (blank-line separated), keeping lists and tables intact. */
function blocks(lines) {
  const out = []
  let cur = []
  for (const l of lines) {
    if (l.trim() === '') {
      if (cur.length) out.push(cur.join('\n'))
      cur = []
    } else cur.push(l)
  }
  if (cur.length) out.push(cur.join('\n'))
  return out
}

function parseBrief(dir, file) {
  const id = file.replace(/\.md$/, '')
  const path = `betterdev/tasks/${dir}/${file}`
  const text = readFileSync(join(here, dir, file), 'utf8')
  const where = (msg) => fail(`${path}: ${msg}`)
  const lines = text.split('\n')
  const head = lines[0].match(/^# (\S+) — (.+)$/)
  if (!head) where('first line must be "# <id> — <title>"')
  else if (head[1] !== id) where(`title id "${head[1]}" doesn't match the file name`)
  const metaLine = lines.find((l) => l.startsWith('**Type:**')) ?? ''
  const type = field(metaLine, 'Type')
  const track = field(metaLine, 'Track')
  const featureTitle = field(metaLine, 'Feature')
  if (!type) where('missing **Type:**')
  if (track !== TRACKS[dir]) where(`**Track:** should be ${TRACKS[dir]}`)
  const feature = featureByTitle.get(featureTitle)
  if (!feature) where(`**Feature:** "${featureTitle}" is not in features.json`)

  const body = blocks(lines.slice(1)).filter((b) => b !== metaLine)
  const take = (prefix) => {
    const i = body.findIndex((b) => b.startsWith(prefix))
    if (i < 0) return null
    return body.splice(i, 1)[0].slice(prefix.length).trim()
  }
  const usersGet = take(USERS)
  if (!usersGet) where(`missing "${USERS}" line`)
  const whereText = take('**Where:**')
  if (!whereText) where('missing **Where:**')
  const doneIdx = body.findIndex((b) => b.startsWith(DONE))
  if (doneIdx < 0) {
    where(`missing "${DONE}"`)
    return null
  }
  const doneWhen = body[doneIdx].slice(DONE.length).trim()
  if (!doneWhen.startsWith('- ')) where('the Done when list must follow its heading directly')
  const before = body.slice(0, doneIdx)
  const after = body.slice(doneIdx + 1).filter((b) => !b.startsWith('Run it from **Actions'))
  const libIdx = before.findIndex((b) => b.startsWith('**Libraries**'))
  const intro = (libIdx < 0 ? before : before.slice(0, libIdx)).join('\n\n')
  const libraries = libIdx < 0 ? null : before.slice(libIdx).join('\n\n').replace(/^\*\*Libraries\*\*\n?/, '')
  const alsoIdx = after.findIndex((b) => b.startsWith(ALSO))
  const alsoExpected = alsoIdx < 0 ? null : after.splice(alsoIdx, 1)[0].slice(ALSO.length).trim()

  return {
    id,
    title: head?.[2] ?? id,
    type,
    track,
    feature: feature?.id ?? null,
    needs: parseNeeds(field(metaLine, 'Needs')),
    usersGet,
    internal: usersGet?.startsWith(INTERNAL) ?? false,
    where: whereText,
    intro,
    libraries,
    doneWhen,
    alsoExpected,
    notes: after.join('\n\n') || null,
    path,
  }
}

const tasks = {}
for (const dir of Object.keys(TRACKS)) {
  for (const file of readdirSync(join(here, dir)).filter((f) => f.endsWith('.md')).sort()) {
    const t = parseBrief(dir, file)
    if (t) tasks[t.id] = t
  }
}
for (const t of Object.values(tasks)) {
  for (const n of t.needs) if (!tasks[n.id]) fail(`${t.path}: **Needs:** ${n.id} isn't a brief`)
}

// README order tables: every brief listed once, with its own title and type.
const readmePath = join(here, 'README.md')
const readme = readFileSync(readmePath, 'utf8')
const order = { backend: [], frontend: [] }
for (const m of readme.matchAll(/^\| (\S+) \| ([^|]+) \| ([^|]+) \|$/gm)) {
  const t = tasks[m[1]]
  if (!t) continue
  if (order[t.track].includes(t.id)) fail(`README.md lists ${t.id} twice`)
  order[t.track].push(t.id)
  if (m[2].trim() !== t.type) fail(`README.md: ${t.id} Type "${m[2].trim()}" ≠ brief "${t.type}"`)
  if (m[3].trim() !== t.title) fail(`README.md: ${t.id} "${m[3].trim()}" ≠ brief title "${t.title}"`)
}
for (const t of Object.values(tasks)) if (!order[t.track].includes(t.id)) fail(`README.md doesn't list ${t.id}`)

const rank = (id) => [...order.backend, ...order.frontend].indexOf(id)
const featureOut = features.map((f) => {
  const ids = Object.values(tasks)
    .filter((t) => t.feature === f.id)
    .map((t) => t.id)
    .sort((a, b) => rank(a) - rank(b))
  if (!ids.length) fail(`features.json: "${f.title}" has no tasks`)
  return { id: f.id, title: f.title, summary: f.summary, internal: !!f.internal, tasks: ids }
})

// Feature map section in README.md.
const START = '<!-- feature-map:start — generated by `node betterdev/tasks/build.mjs`; edit the briefs and features.json instead -->'
const END = '<!-- feature-map:end -->'
const link = (id) => `[${id}](${tasks[id].path.replace('betterdev/tasks/', '')})${tasks[id].internal ? ' *(internal)*' : ''}`
const cell = (f, track) => f.tasks.filter((id) => tasks[id].track === track).map(link).join(', ') || '—'
const map = [
  START,
  "## What you're building",
  '',
  'The finished app, feature by feature, and the tasks that build each part. Each',
  "brief's **What the app's users get** line says what that task adds for the people",
  'using the app; *internal* tasks change nothing they see. A feature is done when',
  'every one of its tasks passes its check.',
  '',
  '| Feature | What its users get | Backend | Frontend |',
  '|---|---|---|---|',
  ...featureOut.map(
    (f) =>
      `| **${f.title}**${f.internal ? ' *(internal)*' : ''} | ${f.summary} | ${cell(f, 'backend')} | ${cell(f, 'frontend')} |`,
  ),
  END,
].join('\n')
let nextReadme
if (readme.includes(END)) {
  nextReadme = readme.replace(new RegExp(`${START.slice(0, 22)}[\\s\\S]*?${END}`), map)
} else {
  nextReadme = readme.replace('## Backend — suggested order', `${map}\n\n## Backend — suggested order`)
}

const index = { generatedBy: 'betterdev/tasks/build.mjs', order, features: featureOut, tasks }
const nextIndex = JSON.stringify(index, null, 2) + '\n'
const indexPath = join(here, 'index.json')
let currentIndex = null
try {
  currentIndex = readFileSync(indexPath, 'utf8')
} catch {}

if (problems.length) {
  console.error(problems.map((p) => `✗ ${p}`).join('\n'))
  process.exit(1)
}
if (check) {
  const stale = [nextReadme !== readme && 'README.md', nextIndex !== currentIndex && 'index.json'].filter(Boolean)
  if (stale.length) {
    console.error(`✗ ${stale.join(' and ')} out of date — run: node betterdev/tasks/build.mjs`)
    process.exit(1)
  }
  console.log(`✓ ${Object.keys(tasks).length} briefs, ${features.length} features — feature map up to date`)
} else {
  writeFileSync(readmePath, nextReadme)
  writeFileSync(indexPath, nextIndex)
  console.log(`wrote README.md feature map and index.json (${Object.keys(tasks).length} briefs)`)
}
