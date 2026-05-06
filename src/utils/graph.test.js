import { describe, it, expect } from 'vitest'
import { endpointSlug, canonicalLinkId, buildAdjacency, bfsPath, pathLinkIdSet } from './graph.js'

describe('endpointSlug', () => {
  it('returns the string when given a slug', () => {
    expect(endpointSlug('boiler')).toBe('boiler')
  })

  it('returns the .slug when given a node ref', () => {
    expect(endpointSlug({ slug: 'boiler', title: 'Boiler' })).toBe('boiler')
  })

  it('returns undefined endpoint as-is', () => {
    expect(endpointSlug(undefined)).toBeUndefined()
  })

  it('returns null endpoint as-is', () => {
    expect(endpointSlug(null)).toBeNull()
  })
})

describe('canonicalLinkId', () => {
  it('produces the same id regardless of argument order', () => {
    expect(canonicalLinkId('a', 'b')).toBe(canonicalLinkId('b', 'a'))
  })

  it('sorts endpoints lexicographically', () => {
    expect(canonicalLinkId('b', 'a')).toBe('a|b')
  })

  it('handles equal endpoints (self-loop)', () => {
    expect(canonicalLinkId('a', 'a')).toBe('a|a')
  })
})

describe('buildAdjacency', () => {
  it('returns empty map for no links', () => {
    expect(buildAdjacency([]).size).toBe(0)
  })

  it('builds undirected edges (both directions)', () => {
    const adj = buildAdjacency([{ source: 'a', target: 'b' }])
    expect(adj.get('a')).toEqual(['b'])
    expect(adj.get('b')).toEqual(['a'])
  })

  it('accepts node-ref endpoints (post force-graph mutation)', () => {
    const a = { slug: 'a' }
    const b = { slug: 'b' }
    const adj = buildAdjacency([{ source: a, target: b }])
    expect(adj.get('a')).toEqual(['b'])
    expect(adj.get('b')).toEqual(['a'])
  })

  it('accepts a mix of string slugs and node refs', () => {
    const adj = buildAdjacency([{ source: 'a', target: { slug: 'b' } }])
    expect(adj.get('a')).toEqual(['b'])
    expect(adj.get('b')).toEqual(['a'])
  })

  it('skips links with missing endpoints', () => {
    const adj = buildAdjacency([
      { source: 'a', target: null },
      { source: undefined, target: 'b' },
      { source: 'c', target: 'd' },
    ])
    expect(adj.has('a')).toBe(false)
    expect(adj.has('b')).toBe(false)
    expect(adj.get('c')).toEqual(['d'])
  })

  it('preserves parallel edges in adjacency', () => {
    const adj = buildAdjacency([
      { source: 'a', target: 'b' },
      { source: 'a', target: 'b' },
    ])
    expect(adj.get('a')).toEqual(['b', 'b'])
  })
})

describe('bfsPath', () => {
  it('returns [start] when start === end', () => {
    const adj = buildAdjacency([{ source: 'a', target: 'b' }])
    expect(bfsPath('a', 'a', adj)).toEqual(['a'])
  })

  it('finds a direct edge', () => {
    const adj = buildAdjacency([{ source: 'a', target: 'b' }])
    expect(bfsPath('a', 'b', adj)).toEqual(['a', 'b'])
  })

  it('finds a path traversing the edge against its declared direction', () => {
    // Edge declared a → b; BFS asked to go b → a.
    const adj = buildAdjacency([{ source: 'a', target: 'b' }])
    expect(bfsPath('b', 'a', adj)).toEqual(['b', 'a'])
  })

  it('returns the shortest path among alternatives', () => {
    // Long route: a-b-c-d. Short route: a-d.
    const adj = buildAdjacency([
      { source: 'a', target: 'b' },
      { source: 'b', target: 'c' },
      { source: 'c', target: 'd' },
      { source: 'a', target: 'd' },
    ])
    expect(bfsPath('a', 'd', adj)).toEqual(['a', 'd'])
  })

  it('finds a multi-hop path when no direct edge exists', () => {
    const adj = buildAdjacency([
      { source: 'a', target: 'b' },
      { source: 'b', target: 'c' },
      { source: 'c', target: 'd' },
    ])
    expect(bfsPath('a', 'd', adj)).toEqual(['a', 'b', 'c', 'd'])
  })

  it('returns null when the target is unreachable', () => {
    // Two disconnected components: {a,b} and {c,d}.
    const adj = buildAdjacency([
      { source: 'a', target: 'b' },
      { source: 'c', target: 'd' },
    ])
    expect(bfsPath('a', 'd', adj)).toBeNull()
  })

  it('returns null when start has no neighbors and start !== end', () => {
    const adj = buildAdjacency([{ source: 'b', target: 'c' }])
    expect(bfsPath('a', 'b', adj)).toBeNull()
  })

  it('does not loop forever on a self-loop', () => {
    const adj = buildAdjacency([
      { source: 'a', target: 'a' },
      { source: 'a', target: 'b' },
    ])
    expect(bfsPath('a', 'b', adj)).toEqual(['a', 'b'])
  })

  it('handles parallel edges without revisiting', () => {
    const adj = buildAdjacency([
      { source: 'a', target: 'b' },
      { source: 'a', target: 'b' },
      { source: 'b', target: 'c' },
    ])
    expect(bfsPath('a', 'c', adj)).toEqual(['a', 'b', 'c'])
  })
})

describe('pathLinkIdSet', () => {
  it('returns an empty set for a single-node path', () => {
    expect(pathLinkIdSet(['a']).size).toBe(0)
  })

  it('produces canonical ids for each consecutive pair', () => {
    const ids = pathLinkIdSet(['b', 'a', 'c'])
    expect(ids.has('a|b')).toBe(true)
    expect(ids.has('a|c')).toBe(true)
    expect(ids.size).toBe(2)
  })
})
