import type {
  SearchResult,
  Movie,
  Person,
  MovieCredits,
  PersonMovieCredit,
  FilterOptions,
} from './types'

const API_KEY = 'c09215a0a0edb76b1995e28ec7d431cf'
const BASE_URL = 'https://api.themoviedb.org/3'
const IMAGE_BASE_URL = 'https://image.tmdb.org/t/p/w500'

export const tmdbApi = {
  getImageUrl: (path: string | null) => {
    if (!path) return null
    return `${IMAGE_BASE_URL}${path}`
  },

  search: async (query: string): Promise<SearchResult[]> => {
    const response = await fetch(
      `${BASE_URL}/search/multi?api_key=${API_KEY}&query=${encodeURIComponent(
        query
      )}&include_adult=false`
    )
    const data = await response.json()
    return data.results.filter(
      (item: SearchResult) =>
        item.media_type === 'movie' || item.media_type === 'person'
    )
  },

  getMovieCredits: async (movieId: number): Promise<MovieCredits> => {
    const response = await fetch(
      `${BASE_URL}/movie/${movieId}/credits?api_key=${API_KEY}`
    )
    return response.json()
  },

  getPersonMovieCredits: async (
    personId: number
  ): Promise<{ cast: PersonMovieCredit[]; crew: PersonMovieCredit[] }> => {
    const response = await fetch(
      `${BASE_URL}/person/${personId}/movie_credits?api_key=${API_KEY}`
    )
    return response.json()
  },

  getMovie: async (movieId: number): Promise<Movie> => {
    const response = await fetch(
      `${BASE_URL}/movie/${movieId}?api_key=${API_KEY}`
    )
    return response.json()
  },

  getPerson: async (personId: number): Promise<Person> => {
    const response = await fetch(
      `${BASE_URL}/person/${personId}?api_key=${API_KEY}`
    )
    return response.json()
  },

  discoverMovies: async (
    personId: number,
    filters: FilterOptions
  ): Promise<Movie[]> => {
    const params = new URLSearchParams({
      api_key: API_KEY,
      with_people: personId.toString(),
      sort_by:
        filters.sortBy === 'popularity'
          ? 'popularity.desc'
          : 'vote_average.desc',
      'vote_count.gte': '100',
      include_adult: 'false',
    })

    if (filters.genres.length > 0) {
      params.append('with_genres', filters.genres.join(','))
    }

    if (filters.yearRange) {
      if (filters.yearRange.min) {
        params.append(
          'primary_release_date.gte',
          `${filters.yearRange.min}-01-01`
        )
      }
      if (filters.yearRange.max) {
        params.append(
          'primary_release_date.lte',
          `${filters.yearRange.max}-12-31`
        )
      }
    }

    const response = await fetch(`${BASE_URL}/discover/movie?${params}`)
    const data = await response.json()
    return data.results || []
  },
}
