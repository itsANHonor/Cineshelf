import axios from 'axios';

const TMDB_API_KEY = process.env.TMDB_API_KEY;
const TMDB_BASE_URL = 'https://api.themoviedb.org/3';
const TMDB_IMAGE_BASE_URL = 'https://image.tmdb.org/t/p/w500';

export interface TMDbMovie {
  id: number;
  title: string;
  overview: string;
  poster_path: string | null;
  release_date: string;
  vote_average: number;
  vote_count: number;
}

export interface TMDbMovieDetails {
  id: number;
  title: string;
  overview: string;
  poster_path: string | null;
  backdrop_path: string | null;
  release_date: string;
  runtime: number;
  genres: { id: number; name: string }[];
  credits?: {
    cast: { id: number; name: string; character: string; profile_path: string | null }[];
    crew: { id: number; name: string; job: string }[];
  };
}

export interface TMDbSearchResponse {
  page: number;
  results: TMDbMovie[];
  total_pages: number;
  total_results: number;
}

class TMDbService {
  private apiKey: string;

  constructor() {
    if (!TMDB_API_KEY) {
      throw new Error('TMDB_API_KEY is not defined in environment variables');
    }
    this.apiKey = TMDB_API_KEY;
  }

  /**
   * Search for movies by title
   */
  async searchMovies(query: string, page: number = 1): Promise<TMDbSearchResponse> {
    try {
      const response = await axios.get(`${TMDB_BASE_URL}/search/movie`, {
        params: {
          api_key: this.apiKey,
          query,
          page,
          include_adult: false,
        },
      });

      return response.data;
    } catch (error) {
      console.error('TMDb search error:', error);
      throw new Error('Failed to search movies on TMDb');
    }
  }

  /**
   * Get detailed information about a movie including cast and crew
   */
  async getMovieDetails(movieId: number): Promise<TMDbMovieDetails> {
    try {
      const response = await axios.get(`${TMDB_BASE_URL}/movie/${movieId}`, {
        params: {
          api_key: this.apiKey,
          append_to_response: 'credits',
        },
      });

      return response.data;
    } catch (error) {
      console.error('TMDb movie details error:', error);
      throw new Error('Failed to fetch movie details from TMDb');
    }
  }

  /**
   * Get full image URL from TMDb path
   */
  getImageUrl(path: string | null, size: 'w500' | 'w780' | 'original' = 'w500'): string | null {
    if (!path) return null;
    return `https://image.tmdb.org/t/p/${size}${path}`;
  }

  /**
   * Extract director from credits
   */
  getDirector(credits?: TMDbMovieDetails['credits']): string | null {
    if (!credits?.crew) return null;
    const director = credits.crew.find((person) => person.job === 'Director');
    return director?.name || null;
  }

  /**
   * Get top cast members
   */
  getTopCast(credits?: TMDbMovieDetails['credits'], limit: number = 5): string[] {
    if (!credits?.cast) return [];
    return credits.cast.slice(0, limit).map((actor) => actor.name);
  }

  /**
   * Get movie's belonging collections
   */
  async getMovieCollections(movieId: number): Promise<any> {
    try {
      const response = await axios.get(`${TMDB_BASE_URL}/movie/${movieId}`, {
        params: {
          api_key: this.apiKey,
        },
      });

      return response.data.belongs_to_collection;
    } catch (error) {
      console.error('TMDb movie collections error:', error);
      throw new Error('Failed to fetch movie collections from TMDb');
    }
  }

  /**
   * Get collection details including all movies
   */
  async getCollectionDetails(collectionId: number): Promise<any> {
    try {
      const response = await axios.get(`${TMDB_BASE_URL}/collection/${collectionId}`, {
        params: {
          api_key: this.apiKey,
        },
      });

      return response.data;
    } catch (error) {
      console.error('TMDb collection details error:', error);
      throw new Error('Failed to fetch collection details from TMDb');
    }
  }
}

export const tmdbService = new TMDbService();

