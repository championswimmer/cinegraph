import { useState, useEffect, useRef } from 'react'
import { Input } from '@/components/ui/input'
import { MagnifyingGlass, FilmStrip, User } from '@phosphor-icons/react'
import { tmdbApi } from '@/lib/tmdb'
import type { SearchResult } from '@/lib/types'

interface SearchBarProps {
  onSelect: (result: SearchResult) => void
}

export function SearchBar({ onSelect }: SearchBarProps) {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<SearchResult[]>([])
  const [isOpen, setIsOpen] = useState(false)
  const [selectedIndex, setSelectedIndex] = useState(0)
  const searchRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (query.length < 2) {
      setResults([])
      setIsOpen(false)
      return
    }

    const debounce = setTimeout(async () => {
      try {
        const searchResults = await tmdbApi.search(query)
        setResults(searchResults.slice(0, 8))
        setIsOpen(searchResults.length > 0)
        setSelectedIndex(0)
      } catch (error) {
        console.error('Search failed:', error)
      }
    }, 300)

    return () => clearTimeout(debounce)
  }, [query])

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        searchRef.current &&
        !searchRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!isOpen) return

    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setSelectedIndex((prev) => (prev + 1) % results.length)
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setSelectedIndex((prev) => (prev - 1 + results.length) % results.length)
    } else if (e.key === 'Enter' && results[selectedIndex]) {
      e.preventDefault()
      handleSelect(results[selectedIndex])
    } else if (e.key === 'Escape') {
      setIsOpen(false)
    }
  }

  const handleSelect = (result: SearchResult) => {
    onSelect(result)
    setQuery('')
    setIsOpen(false)
    setResults([])
  }

  const getResultTitle = (result: SearchResult) => {
    return result.media_type === 'movie' ? result.title : result.name
  }

  const getResultImage = (result: SearchResult) => {
    const path =
      result.media_type === 'movie' ? result.poster_path : result.profile_path
    return path ? tmdbApi.getImageUrl(path) : null
  }

  return (
    <div ref={searchRef} className="relative w-full max-w-2xl">
      <div className="relative">
        <MagnifyingGlass
          className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground"
          size={20}
        />
        <Input
          type="text"
          placeholder="Search for movies, actors, or directors..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={handleKeyDown}
          className="pl-12 pr-4 h-12 text-base bg-card border-border focus:border-accent focus:ring-accent"
        />
      </div>

      {isOpen && results.length > 0 && (
        <div className="absolute top-full mt-2 w-full bg-card border border-border rounded-lg shadow-2xl overflow-hidden z-50 animate-in fade-in slide-in-from-top-2 duration-200">
          {results.map((result, index) => (
            <button
              key={`${result.media_type}-${result.id}`}
              onClick={() => handleSelect(result)}
              className={`w-full flex items-center gap-3 p-3 text-left transition-colors ${
                index === selectedIndex
                  ? 'bg-accent/10 border-l-2 border-accent'
                  : 'hover:bg-muted border-l-2 border-transparent'
              }`}
            >
              {getResultImage(result) ? (
                <img
                  src={getResultImage(result)!}
                  alt={getResultTitle(result)}
                  className="w-12 h-12 rounded object-cover flex-shrink-0"
                />
              ) : (
                <div className="w-12 h-12 rounded bg-muted flex items-center justify-center flex-shrink-0">
                  {result.media_type === 'movie' ? (
                    <FilmStrip size={24} className="text-muted-foreground" />
                  ) : (
                    <User size={24} className="text-muted-foreground" />
                  )}
                </div>
              )}
              <div className="flex-1 min-w-0">
                <div className="font-medium truncate">
                  {getResultTitle(result)}
                </div>
                <div className="text-sm text-muted-foreground flex items-center gap-2">
                  <span className="capitalize">{result.media_type}</span>
                  {result.release_date && (
                    <>
                      <span>•</span>
                      <span>{new Date(result.release_date).getFullYear()}</span>
                    </>
                  )}
                </div>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
