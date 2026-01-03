import { useEffect, useRef, useState } from 'react'
import * as d3 from 'd3'
import { FilmStrip, User, VideoCamera, CheckCircle, BookmarkSimple } from '@phosphor-icons/react'
import { createForceSimulation, getNodeColor } from '@/lib/graph-utils'
import type { D3Node, D3Link } from '@/lib/graph-utils'
import type { GraphNode, GraphLink } from '@/lib/types'

interface GraphProps {
  nodes: GraphNode[]
  links: GraphLink[]
  onNodeClick: (node: GraphNode, event?: React.MouseEvent) => void
  hiddenNodes: Set<string>
  collapsedNodes: Set<string>
}

export function Graph({ nodes, links, onNodeClick, hiddenNodes, collapsedNodes }: GraphProps) {
  const svgRef = useRef<SVGSVGElement>(null)
  const [dimensions, setDimensions] = useState({ width: 800, height: 600 })

  useEffect(() => {
    const updateDimensions = () => {
      if (svgRef.current) {
        const rect = svgRef.current.getBoundingClientRect()
        setDimensions({ width: rect.width, height: rect.height })
      }
    }

    updateDimensions()
    window.addEventListener('resize', updateDimensions)
    return () => window.removeEventListener('resize', updateDimensions)
  }, [])

  useEffect(() => {
    if (!svgRef.current || nodes.length === 0) return

    const svg = d3.select(svgRef.current)
    svg.selectAll('*').remove()

    const { width, height } = dimensions

    const g = svg.append('g')

    const zoom = d3.zoom<SVGSVGElement, unknown>()
      .scaleExtent([0.5, 3])
      .on('zoom', (event) => {
        g.attr('transform', event.transform)
      })

    svg.call(zoom)

    const visibleNodes = nodes.filter((node) => !hiddenNodes.has(node.id))
    const visibleLinks = links.filter(
      (link) => !hiddenNodes.has(link.source) && !hiddenNodes.has(link.target)
    )

    const d3Nodes: D3Node[] = visibleNodes.map((node) => ({ ...node }))
    const d3Links: D3Link[] = visibleLinks.map((link) => ({ ...link }))

    const simulation = createForceSimulation(d3Nodes, d3Links, width, height)

    const link = g
      .append('g')
      .selectAll('line')
      .data(d3Links)
      .join('line')
      .attr('stroke', 'oklch(0.30 0.03 255)')
      .attr('stroke-width', 2)
      .attr('stroke-opacity', 0.6)

    const nodeGroup = g
      .append('g')
      .selectAll('g')
      .data(d3Nodes)
      .join('g')
      .attr('cursor', 'pointer')
      .call(
        d3
          .drag<SVGGElement, D3Node>()
          .on('start', (event, d) => {
            if (!event.active) simulation.alphaTarget(0.3).restart()
            d.fx = d.x
            d.fy = d.y
          })
          .on('drag', (event, d) => {
            d.fx = event.x
            d.fy = event.y
          })
          .on('end', (event, d) => {
            if (!event.active) simulation.alphaTarget(0)
            d.fx = null
            d.fy = null
          })
      )

    nodeGroup.append('circle')
      .attr('r', 30)
      .attr('fill', (d) => getNodeColor(d.type, d.watched, d.watchlist))
      .attr('stroke', 'oklch(0.98 0 0)')
      .attr('stroke-width', 2)
      .style('filter', 'drop-shadow(0 4px 8px rgba(0, 0, 0, 0.4))')

    nodeGroup.append('foreignObject')
      .attr('width', 24)
      .attr('height', 24)
      .attr('x', -12)
      .attr('y', -12)
      .append('xhtml:div')
      .style('width', '24px')
      .style('height', '24px')
      .style('display', 'flex')
      .style('align-items', 'center')
      .style('justify-content', 'center')
      .style('color', 'oklch(0.15 0.01 260)')
      .html((d) => {
        const iconMap = {
          movie: FilmStrip,
          actor: User,
          director: VideoCamera,
        }
        const IconComponent = iconMap[d.type as keyof typeof iconMap]
        const iconContainer = document.createElement('div')
        iconContainer.id = `icon-${d.id}`
        return iconContainer.outerHTML
      })

    nodeGroup.each(function (d) {
      const iconMap = {
        movie: FilmStrip,
        actor: User,
        director: VideoCamera,
      }
      const IconComponent = iconMap[d.type as keyof typeof iconMap]
      const container = this.querySelector(`#icon-${d.id}`)
      if (container) {
        const root = document.createElement('div')
        root.innerHTML = `<svg width="24" height="24" fill="currentColor" viewBox="0 0 256 256">
          ${getIconPath(d.type)}
        </svg>`
        container.appendChild(root.firstChild!)
      }
    })

    nodeGroup.append('circle')
      .attr('r', 10)
      .attr('cx', 18)
      .attr('cy', -18)
      .attr('fill', (d) => {
        if (d.watched) return 'oklch(0.70 0.15 160)'
        if (d.watchlist) return 'oklch(0.75 0.15 210)'
        if (collapsedNodes.has(d.id)) return 'oklch(0.80 0.15 85)'
        if (d.expanded) return 'oklch(0.75 0.15 210)'
        return 'transparent'
      })
      .attr('stroke', 'oklch(0.98 0 0)')
      .attr('stroke-width', (d) => (d.watched || d.watchlist || d.expanded || collapsedNodes.has(d.id) ? 1 : 0))
      .style('filter', 'drop-shadow(0 2px 4px rgba(0, 0, 0, 0.3))')

    nodeGroup.append('foreignObject')
      .attr('width', 12)
      .attr('height', 12)
      .attr('x', 12)
      .attr('y', -24)
      .style('pointer-events', 'none')
      .append('xhtml:div')
      .style('width', '12px')
      .style('height', '12px')
      .style('display', 'flex')
      .style('align-items', 'center')
      .style('justify-content', 'center')
      .style('color', 'oklch(0.98 0 0)')
      .html((d) => {
        if (d.watched) return '<div id="badge-check-' + d.id + '"></div>'
        if (d.watchlist) return '<div id="badge-bookmark-' + d.id + '"></div>'
        if (collapsedNodes.has(d.id)) return '<div id="badge-collapsed-' + d.id + '"></div>'
        return ''
      })

    nodeGroup.each(function (d) {
      if (d.watched) {
        const container = this.querySelector(`#badge-check-${d.id}`)
        if (container) {
          container.innerHTML = `<svg width="12" height="12" fill="currentColor" viewBox="0 0 256 256">
            <path d="M173.66,98.34a8,8,0,0,1,0,11.32l-56,56a8,8,0,0,1-11.32,0l-24-24a8,8,0,0,1,11.32-11.32L112,148.69l50.34-50.35A8,8,0,0,1,173.66,98.34ZM232,128A104,104,0,1,1,128,24,104.11,104.11,0,0,1,232,128Zm-16,0a88,88,0,1,0-88,88A88.1,88.1,0,0,0,216,128Z"></path>
          </svg>`
        }
      } else if (d.watchlist) {
        const container = this.querySelector(`#badge-bookmark-${d.id}`)
        if (container) {
          container.innerHTML = `<svg width="12" height="12" fill="currentColor" viewBox="0 0 256 256">
            <path d="M184,32H72A16,16,0,0,0,56,48V224a8,8,0,0,0,12.24,6.78L128,193.43l59.77,37.35A8,8,0,0,0,200,224V48A16,16,0,0,0,184,32Zm0,177.57-51.77-32.35a8,8,0,0,0-8.48,0L72,209.57V48H184Z"></path>
          </svg>`
        }
      } else if (collapsedNodes.has(d.id)) {
        const container = this.querySelector(`#badge-collapsed-${d.id}`)
        if (container) {
          container.innerHTML = `<svg width="12" height="12" fill="currentColor" viewBox="0 0 256 256">
            <path d="M224,128a8,8,0,0,1-8,8H40a8,8,0,0,1,0-16H216A8,8,0,0,1,224,128Z"></path>
          </svg>`
        }
      }
    })

    const labels = g
      .append('g')
      .selectAll('text')
      .data(d3Nodes)
      .join('text')
      .text((d) => {
        const maxLength = 15
        return d.name.length > maxLength
          ? d.name.substring(0, maxLength) + '...'
          : d.name
      })
      .attr('class', 'node-label')
      .attr('text-anchor', 'middle')
      .attr('dy', 45)
      .attr('fill', 'oklch(0.98 0 0)')
      .style('font-size', '14px')
      .style('font-weight', '500')
      .style('text-shadow', '0 2px 4px rgba(0, 0, 0, 0.8)')

    nodeGroup.on('click', (event, d) => {
      event.stopPropagation()
      onNodeClick(d, event)
    })

    nodeGroup.on('mouseenter', function () {
      d3.select(this).select('circle').transition().duration(150).attr('r', 33)
    })

    nodeGroup.on('mouseleave', function () {
      d3.select(this).select('circle').transition().duration(150).attr('r', 30)
    })

    simulation.on('tick', () => {
      link
        .attr('x1', (d) => (d.source as D3Node).x || 0)
        .attr('y1', (d) => (d.source as D3Node).y || 0)
        .attr('x2', (d) => (d.target as D3Node).x || 0)
        .attr('y2', (d) => (d.target as D3Node).y || 0)

      nodeGroup.attr('transform', (d) => `translate(${d.x},${d.y})`)
      labels.attr('x', (d) => d.x || 0).attr('y', (d) => d.y || 0)
    })

    return () => {
      simulation.stop()
    }
  }, [nodes, links, dimensions, onNodeClick, hiddenNodes, collapsedNodes])

  return (
    <svg
      ref={svgRef}
      className="graph-canvas w-full h-full"
      style={{ background: 'oklch(0.15 0.01 260)' }}
    />
  )
}

function getIconPath(type: string): string {
  const paths = {
    movie: '<path d="M216,40H40A16,16,0,0,0,24,56V200a16,16,0,0,0,16,16H216a16,16,0,0,0,16-16V56A16,16,0,0,0,216,40ZM40,72H56V88H40ZM56,104v16H40V104Zm16-32H88V88H72ZM88,104v16H72V104Zm16,0h16v16H104Zm32,0h16v16H136Zm32,0h16v16H168ZM104,72h16V88H104ZM136,72h16V88H136ZM168,72h16V88H168Zm48,0v16H200V72ZM40,56H56V68H40Zm0,80H56v16H40Zm0,32H56v16H40Zm176,32H200V184h16Zm0-32H200V152h16Zm0-32H200V120h16Zm0-32H200V88h16Zm0-16H200V56h16Z"></path>',
    actor: '<path d="M230.92,212c-15.23-26.33-38.7-45.21-66.09-54.16a72,72,0,1,0-73.66,0C63.78,166.78,40.31,185.66,25.08,212a8,8,0,1,0,13.85,8c18.84-32.56,52.14-52,89.07-52s70.23,19.44,89.07,52a8,8,0,1,0,13.85-8ZM72,96a56,56,0,1,1,56,56A56.06,56.06,0,0,1,72,96Z"></path>',
    director: '<path d="M251.77,73a8,8,0,0,0-8.21.39L208,97.05V72a16,16,0,0,0-16-16H32A16,16,0,0,0,16,72V184a16,16,0,0,0,16,16H192a16,16,0,0,0,16-16V159l35.56,23.71A8,8,0,0,0,248,184a8,8,0,0,0,8-8V80A8,8,0,0,0,251.77,73ZM192,184H32V72H192V184Zm48-22.95-32-21.33V116.28L240,95Z"></path>',
  }
  return paths[type as keyof typeof paths] || paths.movie
}
