// force-graph mutates link.source/target into node refs after first tick.
// This helper accepts either form so callers don't need to care which state
// the link is in.
export function endpointSlug(end) {
  return end && typeof end === 'object' ? end.slug : end
}

// Direction-agnostic edge key. The graph is undirected for path purposes,
// so (a,b) and (b,a) must hash to the same id.
export function canonicalLinkId(a, b) {
  return a < b ? `${a}|${b}` : `${b}|${a}`
}

// Build an undirected adjacency map: slug → [neighbor slugs].
// Accepts links whose endpoints are either string slugs or node refs.
export function buildAdjacency(links) {
  const adj = new Map()
  for (const link of links) {
    const a = endpointSlug(link.source)
    const b = endpointSlug(link.target)
    if (!a || !b) continue
    if (!adj.has(a)) adj.set(a, [])
    if (!adj.has(b)) adj.set(b, [])
    adj.get(a).push(b)
    adj.get(b).push(a)
  }
  return adj
}

// BFS shortest path between two slugs in an undirected graph.
// Returns an array of slugs [start, ..., end] or null if unreachable.
// O(V + E): uses an index-based queue (no Array.shift).
export function bfsPath(start, end, adj) {
  if (start === end) return [start]
  const prev = new Map([[start, null]])
  const queue = [start]
  let head = 0
  while (head < queue.length) {
    const cur = queue[head++]
    if (cur === end) break
    const neighbors = adj.get(cur)
    if (!neighbors) continue
    for (const next of neighbors) {
      if (prev.has(next)) continue
      prev.set(next, cur)
      queue.push(next)
    }
  }
  if (!prev.has(end)) return null
  const path = []
  for (let n = end; n != null; n = prev.get(n)) path.unshift(n)
  return path
}

// Convenience: convert a path of slugs into a Set of canonical link ids
// for the consecutive edges along the path.
export function pathLinkIdSet(path) {
  const ids = new Set()
  for (let i = 0; i < path.length - 1; i++) {
    ids.add(canonicalLinkId(path[i], path[i + 1]))
  }
  return ids
}
