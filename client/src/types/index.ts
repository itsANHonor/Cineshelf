// Series types
export interface Series {
  id: number;
  name: string;
  sort_name: string;
  tmdb_collection_id?: number;
  created_at?: string;
  updated_at?: string;
}

export interface MovieSeries {
  id: number;
  media_id: number;
  series_id: number;
  sort_order?: number;
  auto_sort: boolean;
  series?: Series;
}

// Media types
export interface Media {
  id: number;
  title: string;
  tmdb_id?: number;
  synopsis?: string;
  cover_art_url?: string;
  release_date?: string;
  director?: string;
  cast?: string[];
  physical_format: string;
  edition_notes?: string;
  region_code?: string;
  custom_image_url?: string;
  series?: Series[];
  created_at?: string;
  updated_at?: string;
}

export interface CreateMediaDto {
  title: string;
  tmdb_id?: number;
  synopsis?: string;
  cover_art_url?: string;
  release_date?: string;
  director?: string;
  cast?: string[];
  physical_format: string;
  edition_notes?: string;
  region_code?: string;
  custom_image_url?: string;
}

export type UpdateMediaDto = Partial<CreateMediaDto>;

// TMDb types
export interface TMDbMovie {
  id: number;
  title: string;
  overview: string;
  poster_path: string | null;
  release_date: string;
  vote_average: number;
  vote_count: number;
}

export interface TMDbMovieDetails extends TMDbMovie {
  backdrop_path: string | null;
  runtime: number;
  genres: { id: number; name: string }[];
  director?: string;
  cast?: string[];
  poster_url?: string;
}

export interface TMDbSearchResponse {
  page: number;
  results: TMDbMovie[];
  total_pages: number;
  total_results: number;
}

// Settings types
export interface Settings {
  collection_public: string;
  site_title: string;
  items_per_page: string;
  default_theme: string;
  default_sort_by: string;
  default_sort_order: string;
  collection_title: string;
  [key: string]: string;
}

// Auth types
export interface AuthResponse {
  success: boolean;
  message: string;
  token: string;
}

// Filter and sort types
export type PhysicalFormat = '4K UHD' | 'Blu-ray' | 'DVD' | 'all';
export type SortField = 'title' | 'release_date' | 'created_at' | 'physical_format' | 'series_sort' | 'director_last_name';
export type SortOrder = 'asc' | 'desc';

export interface FilterOptions {
  format: PhysicalFormat;
  sort_by: SortField;
  sort_order: SortOrder;
}

