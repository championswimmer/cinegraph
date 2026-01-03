import { useState } from 'react'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'
import { BookmarkSimple, CheckCircle, X } from '@phosphor-icons/react'
import { tmdbApi } from '@/lib/tmdb'
import { cn } from '@/lib/utils'
import type { WatchlistItem } from '@/lib/types'

interface WatchlistSidebarProps {
  open: boolean
  onClose: () => void
  watchlist: WatchlistItem[]
  watchedMovies: number[]
  onRemoveFromWatchlist: (movieId: number) => void
  onMarkWatched: (movieId: number) => void
  onMovieClick?: (movieId: number) => void
}

export function WatchlistSidebar({
  open,
  onClose,
  watchlist,
  watchedMovies,
  onRemoveFromWatchlist,
  onMarkWatched,
  onMovieClick,
}: WatchlistSidebarProps) {
  const [activeTab, setActiveTab] = useState<'watchlist' | 'watched'>('watchlist')

  const watchedItems = watchlist.filter((item) =>
    watchedMovies.includes(item.tmdbId)
  )

  const unwatchedItems = watchlist.filter(
    (item) => !watchedMovies.includes(item.tmdbId)
  )

  const sortedWatchlist = [...unwatchedItems].sort(
    (a, b) => b.addedAt - a.addedAt
  )
  const sortedWatched = [...watchedItems].sort((a, b) => b.addedAt - a.addedAt)

  return (
    <Sheet open={open} onOpenChange={onClose}>
      <SheetContent side="right" className="w-full sm:w-[400px] p-0">
        <SheetHeader className="px-6 pt-6 pb-4">
          <SheetTitle className="text-2xl">My Movies</SheetTitle>
        </SheetHeader>

        <div className="flex border-b border-border">
          <button
            onClick={() => setActiveTab('watchlist')}
            className={cn(
              'flex-1 px-6 py-3 text-sm font-medium transition-colors relative',
              activeTab === 'watchlist'
                ? 'text-foreground'
                : 'text-muted-foreground hover:text-foreground'
            )}
          >
            <div className="flex items-center justify-center gap-2">
              <BookmarkSimple size={18} />
              Watchlist ({sortedWatchlist.length})
            </div>
            {activeTab === 'watchlist' && (
              <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-accent" />
            )}
          </button>
          <button
            onClick={() => setActiveTab('watched')}
            className={cn(
              'flex-1 px-6 py-3 text-sm font-medium transition-colors relative',
              activeTab === 'watched'
                ? 'text-foreground'
                : 'text-muted-foreground hover:text-foreground'
            )}
          >
            <div className="flex items-center justify-center gap-2">
              <CheckCircle size={18} />
              Watched ({sortedWatched.length})
            </div>
            {activeTab === 'watched' && (
              <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-accent" />
            )}
          </button>
        </div>

        <ScrollArea className="h-[calc(100vh-140px)]">
          <div className="px-6 py-4 space-y-3">
            {activeTab === 'watchlist' ? (
              sortedWatchlist.length > 0 ? (
                sortedWatchlist.map((item) => (
                  <MovieCard
                    key={item.tmdbId}
                    item={item}
                    onRemove={onRemoveFromWatchlist}
                    onMarkWatched={onMarkWatched}
                    onMovieClick={onMovieClick}
                    isWatched={false}
                  />
                ))
              ) : (
                <div className="text-center py-12 text-muted-foreground">
                  <BookmarkSimple size={48} className="mx-auto mb-3 opacity-50" />
                  <p>No movies in your watchlist</p>
                  <p className="text-sm mt-1">
                    Add movies from the graph to watch later
                  </p>
                </div>
              )
            ) : sortedWatched.length > 0 ? (
              sortedWatched.map((item) => (
                <MovieCard
                  key={item.tmdbId}
                  item={item}
                  onRemove={onRemoveFromWatchlist}
                  onMarkWatched={onMarkWatched}
                  onMovieClick={onMovieClick}
                  isWatched={true}
                />
              ))
            ) : (
              <div className="text-center py-12 text-muted-foreground">
                <CheckCircle size={48} className="mx-auto mb-3 opacity-50" />
                <p>No watched movies yet</p>
                <p className="text-sm mt-1">
                  Mark movies as watched from the graph
                </p>
              </div>
            )}
          </div>
        </ScrollArea>
      </SheetContent>
    </Sheet>
  )
}

interface MovieCardProps {
  item: WatchlistItem
  onRemove: (movieId: number) => void
  onMarkWatched: (movieId: number) => void
  onMovieClick?: (movieId: number) => void
  isWatched: boolean
}

function MovieCard({
  item,
  onRemove,
  onMarkWatched,
  onMovieClick,
  isWatched,
}: MovieCardProps) {
  const posterUrl = item.poster_path
    ? tmdbApi.getImageUrl(item.poster_path)
    : null

  return (
    <div className="flex gap-3 p-3 rounded-lg bg-card border border-border hover:bg-muted/50 transition-colors">
      <button
        onClick={() => onMovieClick?.(item.tmdbId)}
        className="flex-shrink-0 cursor-pointer"
      >
        {posterUrl ? (
          <img
            src={posterUrl}
            alt={item.title}
            className="w-16 h-24 object-cover rounded"
          />
        ) : (
          <div className="w-16 h-24 bg-muted rounded flex items-center justify-center">
            <span className="text-xs text-muted-foreground">No poster</span>
          </div>
        )}
      </button>

      <div className="flex-1 min-w-0 flex flex-col justify-between">
        <div>
          <button
            onClick={() => onMovieClick?.(item.tmdbId)}
            className="font-medium text-sm line-clamp-2 text-left hover:text-accent transition-colors"
          >
            {item.title}
          </button>
          <p className="text-xs text-muted-foreground mt-1">
            Added {new Date(item.addedAt).toLocaleDateString()}
          </p>
        </div>

        <div className="flex gap-2 mt-2">
          {!isWatched && (
            <Button
              size="sm"
              variant="outline"
              className="h-7 text-xs gap-1"
              onClick={() => onMarkWatched(item.tmdbId)}
            >
              <CheckCircle size={14} />
              Watched
            </Button>
          )}
          <Button
            size="sm"
            variant="ghost"
            className="h-7 text-xs gap-1 text-muted-foreground hover:text-destructive"
            onClick={() => onRemove(item.tmdbId)}
          >
            <X size={14} />
            Remove
          </Button>
        </div>
      </div>
    </div>
  )
}
