// Pure helpers for the exercise player (no Vue in here, so it is easy to test).

export const NEWLINE = '!!newline'

/* ------------------------------------------------------------------ */
/* Small helpers                                                       */
/* ------------------------------------------------------------------ */

export function shuffle(arr) {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

// Used for typed answers: ignores case and extra spaces.
export function normalizeAnswer(s) {
  return String(s ?? '').trim().replace(/\s+/g, ' ').toLowerCase()
}

/* ------------------------------------------------------------------ */
/* Pattern matching                                                    */
/*                                                                     */
/* A pattern is a list of nodes:                                       */
/*   { k: 'leaf', value, key? }  one item                              */
/*   { k: 'seq',  items }        items must appear in this order       */
/*   { k: 'set',  items }        items may appear in any order         */
/*                                                                     */
/* matchPattern(items, placed, leafMatches) is true when `placed`      */
/* (what the learner built) is one valid expansion of the pattern.     */
/* ------------------------------------------------------------------ */

const keyOf = (n) => (n.k === 'leaf' && n.key != null ? n.key : null)

function endsSeq(items, placed, start, leafMatches) {
  let cur = new Set([start])
  for (const item of items) {
    const next = new Set()
    for (const pos of cur) {
      for (const e of endsNode(item, placed, pos, leafMatches)) next.add(e)
    }
    if (next.size === 0) return next
    cur = next
  }
  return cur
}

function endsNode(node, placed, pos, leafMatches) {
  if (node.k === 'leaf') {
    return pos < placed.length && leafMatches(node.value, placed[pos]) ? [pos + 1] : []
  }
  if (node.k === 'seq') return [...endsSeq(node.items, placed, pos, leafMatches)]
  return [...endsSet(node.items, placed, pos, leafMatches)]
}

function endsSet(items, placed, start, leafMatches) {
  const results = new Set()
  const used = new Array(items.length).fill(false)

  const rec = (pos, count) => {
    if (count === items.length) {
      results.add(pos)
      return
    }
    for (let i = 0; i < items.length; i++) {
      if (used[i]) continue

      // Skip permutations that only swap two identical leaves.
      const key = keyOf(items[i])
      if (key !== null) {
        let dup = false
        for (let j = 0; j < i; j++) {
          if (!used[j] && keyOf(items[j]) === key) {
            dup = true
            break
          }
        }
        if (dup) continue
      }

      used[i] = true
      for (const e of endsNode(items[i], placed, pos, leafMatches)) rec(e, count + 1)
      used[i] = false
    }
  }

  rec(start, 0)
  return results
}

export function matchPattern(items, placed, leafMatches) {
  return endsSeq(items, placed, 0, leafMatches).has(placed.length)
}

function hasInterchangeable(items) {
  return items.some(
    (n) => (n.k === 'set' && n.items.length > 1) || (n.k !== 'leaf' && hasInterchangeable(n.items))
  )
}

/* ------------------------------------------------------------------ */
/* sorting                                                             */
/* ------------------------------------------------------------------ */

// order tree:  "text"            -> one item
//              [ ... ]           -> items that may swap places
//              { group: [ ... ] } -> a block that stays together, in order
export function buildSorting(order) {
  const leaves = [] // written order; leaf.id === index

  const conv = (node) => {
    if (typeof node === 'string') {
      const leaf = { id: leaves.length, text: node }
      leaves.push(leaf)
      return { k: 'leaf', value: leaf, key: node }
    }
    if (Array.isArray(node)) return { k: 'set', items: node.map(conv) }
    if (node && Array.isArray(node.group)) return { k: 'seq', items: node.group.map(conv) }
    throw new Error('Unknown node in "sorting" order')
  }

  const pattern = order.map(conv)
  return { leaves, pattern, hasSwaps: hasInterchangeable(pattern) }
}

export function gradeSorting(pattern, placedLeaves) {
  return matchPattern(pattern, placedLeaves, (expected, got) => expected.text === got.text)
}

/* ------------------------------------------------------------------ */
/* nested_dnd_sort                                                     */
/*                                                                     */
/* The JSON tree is turned into:                                       */
/*   pieces  - everything the learner can move                         */
/*             { kind: 'text',  id, text }                             */
/*             { kind: 'block', id, parts, zones }                     */
/*   zones   - drop areas inside blocks (+ the implicit 'root' zone)   */
/*   rootPattern / zone.pattern - what each zone should contain        */
/* ------------------------------------------------------------------ */

export function buildNested(root) {
  const pieces = {}
  let seq = 0

  // A list of nodes -> pattern items. A "drop" directly inside a list is
  // transparent: its children are spliced into the parent list.
  const convList = (nodes) => {
    const out = []
    for (const n of nodes) out.push(...convNode(n))
    return out
  }

  const convNode = (n) => {
    if (typeof n === 'string') return [makeText(n)]
    if (Array.isArray(n)) return [{ k: 'set', items: convList(n) }]
    if (n && n.type === 'block') return [makeBlock(n)]
    if (n && n.type === 'drop') return convList(n.root ?? [])
    throw new Error('Unknown node in "nested_dnd_sort" root')
  }

  const makeText = (text) => {
    const id = `p${seq++}`
    const piece = { id, kind: 'text', text }
    pieces[id] = piece
    return { k: 'leaf', value: piece, key: `t:${text}` }
  }

  const makeBlock = (node) => {
    const id = `p${seq++}`
    const piece = { id, kind: 'block', parts: [], zones: [] }
    pieces[id] = piece

    for (const item of node.content ?? []) {
      if (item === NEWLINE) {
        piece.parts.push({ type: 'newline' })
      } else if (typeof item === 'string') {
        piece.parts.push({ type: 'static', text: item })
      } else if (item && item.type === 'drop') {
        const zoneId = `${id}:z${piece.zones.length}`
        piece.parts.push({ type: 'zone', zoneId })
        piece.zones.push({ zoneId, pattern: convList(item.root ?? []) })
      }
    }
    return { k: 'leaf', value: piece }
  }

  const rootPattern = convList(root)
  return { pieces, rootPattern }
}

const frameSig = (block) =>
  block.parts
    .map((p) => (p.type === 'zone' ? '\u0001zone' : p.type === 'newline' ? '\n' : p.text))
    .join('\u0002')

// placement: { root: [pieceId], '<blockId>:z0': [pieceId], ... }
export function gradeNested(built, placement) {
  const leafMatches = (expected, placedId) => {
    const got = built.pieces[placedId]
    if (!got) return false
    if (expected.kind === 'text') return got.kind === 'text' && got.text === expected.text

    // Blocks are compared by what they look like and what is inside them,
    // so two identical-looking frames are interchangeable.
    if (got.kind !== 'block' || frameSig(got) !== frameSig(expected)) return false
    return expected.zones.every((z, i) =>
      matchPattern(z.pattern, placement[got.zones[i].zoneId] ?? [], leafMatches)
    )
  }
  return matchPattern(built.rootPattern, placement.root ?? [], leafMatches)
}

// One valid answer (interchangeable items in the order they were written).
export function canonicalPlacement(built) {
  const placement = {}

  const flat = (items) => {
    const ids = []
    for (const it of items) {
      if (it.k === 'leaf') {
        ids.push(it.value.id)
        if (it.value.kind === 'block') {
          for (const z of it.value.zones) placement[z.zoneId] = flat(z.pattern)
        }
      } else {
        ids.push(...flat(it.items))
      }
    }
    return ids
  }

  placement.root = flat(built.rootPattern)
  return placement
}

// "<html> … </html>" style label for a block sitting in the bank.
export function blockLabel(block) {
  return block.parts
    .map((p) => (p.type === 'zone' ? '…' : p.type === 'newline' ? ' ' : p.text))
    .join(' ')
    .replace(/\s+/g, ' ')
    .trim()
}
