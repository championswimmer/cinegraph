import { useState } from 'react'
import { useKV } from '@github/spark/hooks'
import { SearchBar } from '@/components/SearchBar'
import { Graph } from '@/components/Graph'
import { FilterModal } from '@/components/FilterModal'
import { MovieModal } from '@/components/MovieModal'
import { WatchlistSidebar } from '@/components/WatchlistSidebar'
import { Button } from '@/components/ui/button'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import { toast } from 'sonner'
import { tmdbApi } from '@/lib/tmdb'
import { BookmarkSimple, Image } from '@phosphor-icons/react'
import type {
  SearchResult,
  GraphNode,
  GraphLink,
  FilterOptions,
  WatchlistItem,
} from '@/lib/types'

function App() {
  const [nodes, setNodes] = useState<GraphNode[]>([])
  const [links, setLinks] = useState<GraphLink[]>([])
  const [watchlist, setWatchlist] = useKV<WatchlistItem[]>('watchlist', [])
  const [watchedMovies, setWatchedMovies] = useKV<number[]>('watched', [])
  const [collapsedNodes, setCollapsedNodes] = useState<Set<string>>(new Set())
  const [showThumbnails, setShowThumbnails] = useKV<boolean>('show-thumbnails', false)

  const [filterModalOpen, setFilterModalOpen] = useState(false)
  const [movieModalOpen, setMovieModalOpen] = useState(false)
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [selectedPerson, setSelectedPerson] = useState<{
    id: number
    name: string
  } | null>(null)
  const [selectedMovie, setSelectedMovie] = useState<GraphNode | null>(null)
  const [loadingMore, setLoadingMore] = useState(false)
  const [personMovieCount, setPersonMovieCount] = useState<
    Record<string, number>
  >({})
  const [expandedMovies, setExpandedMovies] = useState<Set<number>>(new Set())

  const addNode = (node: GraphNode) => {
    setNodes((current) => {
      if (current.find((n) => n.id === node.id)) {
        return current
      }
      return [...current, node]
    })
  }

  const addLink = (link: GraphLink) => {
    setLinks((current) => {
      if (
        current.find(
          (l) => l.source === link.source && l.target === link.target
        )
      ) {
        return current
      }
      return [...current, link]
    })
  }

  const handleSearchSelect = async (result: SearchResult) => {
    setNodes([])
    setLinks([])
    setCollapsedNodes(new Set())

    if (result.media_type === 'movie') {
      await handleMovieSearch(result.id)
    } else {
      await handlePersonSearch(result.id, result.name!)
    }
  }

  const handleMovieSearch = async (movieId: number) => {
    try {
      const [movie, credits] = await Promise.all([
        tmdbApi.getMovie(movieId),
        tmdbApi.getMovieCredits(movieId),
      ])

      const movieNode: GraphNode = {
        id: `movie-${movie.id}`,
        tmdbId: movie.id,
        type: 'movie',
        name: movie.title,
        imageUrl: movie.poster_path,
        metadata: {
          releaseDate: movie.release_date,
          rating: movie.vote_average,
        },
        watched: (watchedMovies || []).includes(movie.id),
        watchlist: (watchlist || []).some((item) => item.tmdbId === movie.id),
      }

      addNode(movieNode)

      const director = credits.crew.find((c) => c.job === 'Director')
      if (director) {
        const directorNode: GraphNode = {
          id: `director-${director.id}`,
          tmdbId: director.id,
          type: 'director',
          name: director.name,
          imageUrl: director.profile_path,
        }
        addNode(directorNode)
        addLink({ source: movieNode.id, target: directorNode.id })
      }

      const topActors = credits.cast.slice(0, 5)
      topActors.forEach((actor) => {
        const actorNode: GraphNode = {
          id: `actor-${actor.id}`,
          tmdbId: actor.id,
          type: 'actor',
          name: actor.name,
          imageUrl: actor.profile_path,
          metadata: {
            character: actor.character,
          },
        }
        addNode(actorNode)
        addLink({ source: movieNode.id, target: actorNode.id })
      })

      toast.success(`Loaded ${movie.title}`)
    } catch (error) {
      toast.error('Failed to load movie details')
      console.error(error)
    }
  }

  const handlePersonSearch = async (personId: number, personName: string) => {
    try {
      const [person, credits] = await Promise.all([
        tmdbApi.getPerson(personId),
        tmdbApi.getPersonMovieCredits(personId),
      ])

      const isDirector = person.known_for_department === 'Directing'
      const personNode: GraphNode = {
        id: `${isDirector ? 'director' : 'actor'}-${person.id}`,
        tmdbId: person.id,
        type: isDirector ? 'director' : 'actor',
        name: person.name,
        imageUrl: person.profile_path,
      }

      addNode(personNode)

      const movies = isDirector ? credits.crew : credits.cast
      const sortedMovies = movies
        .filter((m) => m.vote_average > 0)
        .sort((a, b) => b.popularity - a.popularity)
        .slice(0, 5)

      sortedMovies.forEach((movie) => {
        const movieNode: GraphNode = {
          id: `movie-${movie.id}`,
          tmdbId: movie.id,
          type: 'movie',
          name: movie.title,
          imageUrl: movie.poster_path,
          metadata: {
            releaseDate: movie.release_date,
            rating: movie.vote_average,
          },
          watched: (watchedMovies || []).includes(movie.id),
          watchlist: (watchlist || []).some((item) => item.tmdbId === movie.id),
        }
        addNode(movieNode)
        addLink({ source: personNode.id, target: movieNode.id })
      })

      setPersonMovieCount((prev) => ({
        ...prev,
        [personNode.id]: 5,
      }))

      toast.success(`Loaded ${person.name}`)
    } catch (error) {
      toast.error('Failed to load person details')
      console.error(error)
    }
  }

  const getDescendants = (nodeId: string): Set<string> => {
    const descendants = new Set<string>()
    const queue = [nodeId]
    const visited = new Set<string>()

    while (queue.length > 0) {
      const current = queue.shift()!
      if (visited.has(current)) continue
      visited.add(current)

      const childLinks = links.filter((l) => l.source === current)
      childLinks.forEach((link) => {
        descendants.add(link.target)
        queue.push(link.target)
      })
    }

    return descendants
  }

  const getHiddenNodes = (): Set<string> => {
    const hidden = new Set<string>()

    collapsedNodes.forEach((collapsedId) => {
      const descendants = getDescendants(collapsedId)
      descendants.forEach((desc) => hidden.add(desc))
    })

    return hidden
  }

  const handleNodeClick = (node: GraphNode, event?: React.MouseEvent) => {
    const isCtrlOrMetaKey = event?.ctrlKey || event?.metaKey

    if (isCtrlOrMetaKey) {
      setCollapsedNodes((current) => {
        const newSet = new Set(current)
        if (newSet.has(node.id)) {
          newSet.delete(node.id)
        } else {
          newSet.add(node.id)
        }
        return newSet
      })
      return
    }

    if (node.type === 'movie') {
      setSelectedMovie(node)
      setMovieModalOpen(true)
    } else {
      setSelectedPerson({ id: node.tmdbId, name: node.name })
      setFilterModalOpen(true)
    }
  }

  const handleFilterApply = async (filters: FilterOptions) => {
    if (!selectedPerson) return

    setFilterModalOpen(false)

    try {
      const movies = await tmdbApi.discoverMovies(selectedPerson.id, filters)
      const topMovies = movies.slice(0, 5)

      const personNodeId = nodes.find(
        (n) => n.tmdbId === selectedPerson.id
      )?.id

      if (!personNodeId) return

      topMovies.forEach((movie) => {
        const movieNode: GraphNode = {
          id: `movie-${movie.id}`,
          tmdbId: movie.id,
          type: 'movie',
          name: movie.title,
          imageUrl: movie.poster_path,
          metadata: {
            releaseDate: movie.release_date,
            rating: movie.vote_average,
          },
          watched: (watchedMovies || []).includes(movie.id),
          watchlist: (watchlist || []).some((item) => item.tmdbId === movie.id),
        }
        addNode(movieNode)
        addLink({ source: personNodeId, target: movieNode.id })
      })

      setNodes((current) =>
        current.map((n) =>
          n.id === personNodeId ? { ...n, expanded: true } : n
        )
      )

      toast.success(`Added ${topMovies.length} movies`)
    } catch (error) {
      toast.error('Failed to discover movies')
      console.error(error)
    }
  }

  const handleMarkWatched = (movieId: number) => {
    setWatchedMovies((current) => {
      const list = current || []
      if (list.includes(movieId)) {
        return list.filter((id) => id !== movieId)
      }
      return [...list, movieId]
    })

    setWatchlist((current) => (current || []).filter((item) => item.tmdbId !== movieId))

    setNodes((current) =>
      current.map((node) =>
        node.tmdbId === movieId && node.type === 'movie'
          ? { ...node, watched: !node.watched, watchlist: false }
          : node
      )
    )

    toast.success('Updated watch status')
  }

  const handleAddToWatchlist = (movieId: number) => {
    const movie = nodes.find(
      (n) => n.tmdbId === movieId && n.type === 'movie'
    )
    if (!movie) return

    setWatchlist((current) => {
      const list = current || []
      if (list.some((item) => item.tmdbId === movieId)) {
        return list.filter((item) => item.tmdbId !== movieId)
      }
      return [
        ...list,
        {
          tmdbId: movieId,
          title: movie.name,
          poster_path: movie.imageUrl,
          addedAt: Date.now(),
          watched: false,
        },
      ]
    })

    setNodes((current) =>
      current.map((node) =>
        node.tmdbId === movieId && node.type === 'movie'
          ? { ...node, watchlist: !node.watchlist }
          : node
      )
    )

    toast.success('Updated watchlist')
  }

  const handleExpandMovie = async (movieId: number) => {
    if (expandedMovies.has(movieId)) {
      toast.info('Movie already expanded')
      return
    }

    try {
      const [movie, credits] = await Promise.all([
        tmdbApi.getMovie(movieId),
        tmdbApi.getMovieCredits(movieId),
      ])

      const movieNodeId = `movie-${movieId}`

      const director = credits.crew.find((c) => c.job === 'Director')
      if (director) {
        const directorNode: GraphNode = {
          id: `director-${director.id}`,
          tmdbId: director.id,
          type: 'director',
          name: director.name,
          imageUrl: director.profile_path,
        }
        addNode(directorNode)
        addLink({ source: movieNodeId, target: directorNode.id })
      }

      const topActors = credits.cast.slice(0, 5)
      topActors.forEach((actor) => {
        const actorNode: GraphNode = {
          id: `actor-${actor.id}`,
          tmdbId: actor.id,
          type: 'actor',
          name: actor.name,
          imageUrl: actor.profile_path,
          metadata: {
            character: actor.character,
          },
        }
        addNode(actorNode)
        addLink({ source: movieNodeId, target: actorNode.id })
      })

      setExpandedMovies((prev) => new Set([...prev, movieId]))

      setNodes((current) =>
        current.map((n) =>
          n.tmdbId === movieId && n.type === 'movie' ? { ...n, expanded: true } : n
        )
      )

      toast.success(`Expanded ${movie.title}`)
    } catch (error) {
      toast.error('Failed to expand movie')
      console.error(error)
    }
  }

  const handleRemoveFromWatchlist = (movieId: number) => {
    setWatchlist((current) => (current || []).filter((item) => item.tmdbId !== movieId))

    setNodes((current) =>
      current.map((node) =>
        node.tmdbId === movieId && node.type === 'movie'
          ? { ...node, watchlist: false }
          : node
      )
    )

    toast.success('Removed from watchlist')
  }

  const handleSidebarMovieClick = async (movieId: number) => {
    const existingNode = nodes.find(
      (n) => n.tmdbId === movieId && n.type === 'movie'
    )

    if (existingNode) {
      setSelectedMovie(existingNode)
      setMovieModalOpen(true)
    } else {
      try {
        const movie = await tmdbApi.getMovie(movieId)
        const movieNode: GraphNode = {
          id: `movie-${movie.id}`,
          tmdbId: movie.id,
          type: 'movie',
          name: movie.title,
          imageUrl: movie.poster_path,
          metadata: {
            releaseDate: movie.release_date,
            rating: movie.vote_average,
          },
          watched: (watchedMovies || []).includes(movie.id),
          watchlist: (watchlist || []).some((item) => item.tmdbId === movie.id),
        }
        setSelectedMovie(movieNode)
        setMovieModalOpen(true)
      } catch (error) {
        toast.error('Failed to load movie')
        console.error(error)
      }
    }
  }

  const handleLoadMore = async (personId: string) => {
    setLoadingMore(true)
    const node = nodes.find((n) => n.id === personId)
    if (!node) return

    try {
      const credits = await tmdbApi.getPersonMovieCredits(node.tmdbId)
      const isDirector = node.type === 'director'
      const movies = isDirector ? credits.crew : credits.cast

      const currentCount = personMovieCount[personId] || 5
      const sortedMovies = movies
        .filter((m) => m.vote_average > 0)
        .sort((a, b) => b.popularity - a.popularity)
        .slice(currentCount, currentCount + 5)

      sortedMovies.forEach((movie) => {
        const movieNode: GraphNode = {
          id: `movie-${movie.id}`,
          tmdbId: movie.id,
          type: 'movie',
          name: movie.title,
          imageUrl: movie.poster_path,
          metadata: {
            releaseDate: movie.release_date,
            rating: movie.vote_average,
          },
          watched: (watchedMovies || []).includes(movie.id),
          watchlist: (watchlist || []).some((item) => item.tmdbId === movie.id),
        }
        addNode(movieNode)
        addLink({ source: personId, target: movieNode.id })
      })

      setPersonMovieCount((prev) => ({
        ...prev,
        [personId]: currentCount + 5,
      }))

      toast.success(`Loaded ${sortedMovies.length} more movies`)
    } catch (error) {
      toast.error('Failed to load more movies')
      console.error(error)
    } finally {
      setLoadingMore(false)
    }
  }

  const watchlistCount = watchlist?.length || 0

  return (
    <div className="h-screen flex flex-col bg-background text-foreground">
      <header className="border-b border-border bg-card/50 backdrop-blur-sm z-10">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-3xl font-bold tracking-tight">CineGraph</h1>
            <div className="flex items-center gap-4">
              {nodes.length > 0 && (
                <>
                  <div className="flex items-center gap-2 px-3 py-2 bg-card border border-border rounded-lg">
                    <Image size={18} className="text-muted-foreground" />
                    <Label htmlFor="thumbnail-toggle" className="text-sm cursor-pointer">
                      Thumbnails
                    </Label>
                    <Switch
                      id="thumbnail-toggle"
                      checked={showThumbnails || false}
                      onCheckedChange={setShowThumbnails}
                    />
                  </div>
                  <div className="text-xs text-muted-foreground">
                    Ctrl+Click to expand/collapse
                  </div>
                </>
              )}
              <Button
                variant="outline"
                className="gap-2"
                onClick={() => setSidebarOpen(true)}
              >
                <BookmarkSimple size={18} />
                My Movies ({watchlistCount})
              </Button>
            </div>
          </div>
          <SearchBar onSelect={handleSearchSelect} />
        </div>
      </header>

      <main className="flex-1 relative overflow-hidden">
        {nodes.length === 0 ? (
          <div className="h-full flex items-center justify-center">
            <div className="text-center space-y-4 max-w-md px-6">
              <h2 className="text-2xl font-semibold text-muted-foreground">
                Start Your Discovery
              </h2>
              <p className="text-muted-foreground">
                Search for a movie, actor, or director to explore cinematic
                connections through an interactive graph
              </p>
            </div>
          </div>
        ) : (
          <Graph
            nodes={nodes}
            links={links}
            onNodeClick={handleNodeClick}
            hiddenNodes={getHiddenNodes()}
            collapsedNodes={collapsedNodes}
            showThumbnails={showThumbnails || false}
          />
        )}
      </main>

      {nodes.length > 0 && (
        <div className="absolute bottom-6 right-6 flex gap-2">
          {Object.keys(personMovieCount).map((personId) => {
            const person = nodes.find((n) => n.id === personId)
            if (!person || person.expanded) return null
            return (
              <Button
                key={personId}
                onClick={() => handleLoadMore(personId)}
                disabled={loadingMore}
                className="bg-card border border-border hover:bg-muted"
              >
                Load More from {person.name}
              </Button>
            )
          })}
        </div>
      )}

      <FilterModal
        open={filterModalOpen}
        onClose={() => setFilterModalOpen(false)}
        onApply={handleFilterApply}
        personName={selectedPerson?.name || ''}
      />

      <MovieModal
        open={movieModalOpen}
        onClose={() => setMovieModalOpen(false)}
        movie={selectedMovie}
        onMarkWatched={handleMarkWatched}
        onAddToWatchlist={handleAddToWatchlist}
        onExpandMovie={handleExpandMovie}
        isExpanded={selectedMovie ? expandedMovies.has(selectedMovie.tmdbId) : false}
      />

      <WatchlistSidebar
        open={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        watchlist={watchlist || []}
        watchedMovies={watchedMovies || []}
        onRemoveFromWatchlist={handleRemoveFromWatchlist}
        onMarkWatched={handleMarkWatched}
        onMovieClick={handleSidebarMovieClick}
      />
    </div>
  )
}

export default App
