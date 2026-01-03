import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { CheckCircle, BookmarkSimple } from '@phosphor-icons/react'
import { tmdbApi } from '@/lib/tmdb'
import type { GraphNode } from '@/lib/types'

interface MovieModalProps {
  open: boolean
  onClose: () => void
  movie: GraphNode | null
  onMarkWatched: (movieId: number) => void
  onAddToWatchlist: (movieId: number) => void
}

export function MovieModal({
  open,
  onClose,
  movie,
  onMarkWatched,
  onAddToWatchlist,
}: MovieModalProps) {
  if (!movie) return null

  const posterUrl = movie.imageUrl ? tmdbApi.getImageUrl(movie.imageUrl) : null

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle className="text-2xl">{movie.name}</DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          <div className="flex gap-6">
            {posterUrl ? (
              <img
                src={posterUrl}
                alt={movie.name}
                className="w-32 h-48 object-cover rounded-lg flex-shrink-0"
              />
            ) : (
              <div className="w-32 h-48 bg-muted rounded-lg flex items-center justify-center flex-shrink-0">
                <span className="text-muted-foreground text-sm">No poster</span>
              </div>
            )}

            <div className="flex-1 space-y-3">
              {movie.metadata?.releaseDate && (
                <div>
                  <span className="text-sm text-muted-foreground uppercase tracking-wide">
                    Release Date
                  </span>
                  <p className="text-base">
                    {new Date(movie.metadata.releaseDate).toLocaleDateString(
                      'en-US',
                      { year: 'numeric', month: 'long', day: 'numeric' }
                    )}
                  </p>
                </div>
              )}

              {movie.metadata?.rating !== undefined && (
                <div>
                  <span className="text-sm text-muted-foreground uppercase tracking-wide">
                    Rating
                  </span>
                  <p className="text-base">
                    {movie.metadata.rating.toFixed(1)} / 10
                  </p>
                </div>
              )}

              <div className="flex gap-2 flex-wrap">
                {movie.watched && (
                  <Badge variant="secondary" className="gap-1">
                    <CheckCircle size={14} weight="fill" />
                    Watched
                  </Badge>
                )}
                {movie.watchlist && (
                  <Badge variant="secondary" className="gap-1">
                    <BookmarkSimple size={14} weight="fill" />
                    Watchlist
                  </Badge>
                )}
              </div>
            </div>
          </div>

          <div className="flex gap-3">
            {!movie.watched && (
              <Button
                onClick={() => {
                  onMarkWatched(movie.tmdbId)
                  onClose()
                }}
                className="flex-1 gap-2"
                variant="outline"
              >
                <CheckCircle size={18} />
                Mark as Watched
              </Button>
            )}
            {!movie.watchlist && !movie.watched && (
              <Button
                onClick={() => {
                  onAddToWatchlist(movie.tmdbId)
                  onClose()
                }}
                className="flex-1 gap-2 bg-accent text-accent-foreground hover:bg-accent/90"
              >
                <BookmarkSimple size={18} />
                Add to Watchlist
              </Button>
            )}
            {movie.watched && (
              <Button
                onClick={() => {
                  onAddToWatchlist(movie.tmdbId)
                  onClose()
                }}
                className="flex-1"
                variant="outline"
              >
                Remove from Watched
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
