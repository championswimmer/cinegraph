import * as d3 from 'd3'
import type { GraphNode, GraphLink } from './types'

export interface D3Node extends GraphNode, d3.SimulationNodeDatum {
  x?: number
  y?: number
  fx?: number | null
  fy?: number | null
}

export interface D3Link {
  source: string | D3Node
  target: string | D3Node
}

export const getNodeColor = (type: string, watched?: boolean, watchlist?: boolean) => {
  if (type === 'movie') {
    if (watched) return 'oklch(0.50 0.08 85)'
    if (watchlist) return 'oklch(0.85 0.18 85)'
    return 'oklch(0.80 0.15 85)'
  }
  if (type === 'actor') return 'oklch(0.70 0.20 330)'
  if (type === 'director') return 'oklch(0.70 0.15 160)'
  return 'oklch(0.50 0.1 210)'
}

export const createForceSimulation = (
  nodes: D3Node[],
  links: D3Link[],
  width: number,
  height: number
) => {
  return d3
    .forceSimulation<D3Node>(nodes)
    .force(
      'link',
      d3
        .forceLink<D3Node, D3Link>(links)
        .id((d) => d.id)
        .distance(150)
    )
    .force('charge', d3.forceManyBody().strength(-400))
    .force('center', d3.forceCenter(width / 2, height / 2))
    .force('collision', d3.forceCollide().radius(40))
}
