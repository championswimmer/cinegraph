export interface Movie {
  id: number
  title: string
  poster_path: string | null
  release_date: string
  overview: string
  vote_average: number
  genre_ids: number[]
}

export interface Person {
  id: number
  name: string
  profile_path: string | null
  known_for_department: string
}

export interface Cast {
  id: number
  name: string
  character: string
  profile_path: string | null
  order: number
}

export interface Crew {
  id: number
  name: string
  job: string
  department: string
  profile_path: string | null
}

export interface MovieCredits {
  cast: Cast[]
  crew: Crew[]
}

export interface PersonMovieCredit {
  id: number
  title: string
  poster_path: string | null
  release_date: string
  vote_average: number
  popularity: number
  character?: string
  job?: string
}

export interface SearchResult {
  id: number
  title?: string
  name?: string
  media_type: 'movie' | 'person'
  poster_path?: string | null
  profile_path?: string | null
  release_date?: string
}

export type NodeType = 'movie' | 'actor' | 'director'

export interface GraphNode {
  id: string
  tmdbId: number
  type: NodeType
  name: string
  imageUrl: string | null
  metadata?: {
    releaseDate?: string
    rating?: number
    character?: string
    job?: string
  }
  expanded?: boolean
  watched?: boolean
  watchlist?: boolean
}

export interface GraphLink {
  source: string
  target: string
}

export interface FilterOptions {
  genres: number[]
  yearRange: { min: number; max: number } | null
  sortBy: 'popularity' | 'rating'
}

export interface WatchlistItem {
  tmdbId: number
  title: string
  poster_path: string | null
  addedAt: number
  watched: boolean
}

export const GENRES = [
  { id: 28, name: 'Action' },
  { id: 12, name: 'Adventure' },
  { id: 16, name: 'Animation' },
  { id: 35, name: 'Comedy' },
  { id: 80, name: 'Crime' },
  { id: 99, name: 'Documentary' },
  { id: 18, name: 'Drama' },
  { id: 10751, name: 'Family' },
  { id: 14, name: 'Fantasy' },
  { id: 36, name: 'History' },
  { id: 27, name: 'Horror' },
  { id: 10402, name: 'Music' },
  { id: 9648, name: 'Mystery' },
  { id: 10749, name: 'Romance' },
  { id: 878, name: 'Science Fiction' },
  { id: 10770, name: 'TV Movie' },
  { id: 53, name: 'Thriller' },
  { id: 10752, name: 'War' },
  { id: 37, name: 'Western' },
]
