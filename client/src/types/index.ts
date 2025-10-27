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

// Media types (pure movie metadata, no physical ownership info)
export interface Media {
  id: number;
  title: string;
  tmdb_id?: number;
  synopsis?: string;
  cover_art_url?: string;
  release_date?: string;
  director?: string;
  cast?: string[];
  series?: Series[];
  created_at?: string;
  updated_at?: string;
  disc_number?: number; // For junction table data
  formats?: string[]; // For junction table data - per-movie formats
}

export interface CreateMediaDto {
  title: string;
  tmdb_id?: number;
  synopsis?: string;
  cover_art_url?: string;
  release_date?: string;
  director?: string;
  cast?: string[];
}

export type UpdateMediaDto = Partial<CreateMediaDto>;

// Unified Search types
export interface UnifiedSearchResult {
  id: number;
  title: string;
  release_date?: string;
  overview?: string;
  poster_path?: string | null;
  cover_art_url?: string | null;
  director?: string;
  source: 'database' | 'tmdb';
  tmdb_id?: number;
  originalData: Media | TMDbMovie;
}

// Physical Item types (what you actually own)
export interface PhysicalItem {
  id: number;
  name: string;
  physical_format: string[];
  edition_notes?: string;
  custom_image_url?: string;
  purchase_date?: string;
  store_links?: Array<{label: string; url: string}>;
  created_at?: string;
  updated_at?: string;
  media: Media[]; // Linked media entries
}

export interface CreatePhysicalItemDto {
  name: string;
  edition_notes?: string;
  custom_image_url?: string;
  purchase_date?: string;
  store_links?: Array<{label: string; url: string}>;
  media: {
    id?: number; // If linking to existing media
    title?: string; // If creating new media
    tmdb_id?: number;
    synopsis?: string;
    cover_art_url?: string;
    release_date?: string;
    director?: string;
    cast?: string[];
    disc_number?: number;
    formats?: string[]; // Per-movie formats
  }[] | {
    id?: number;
    title?: string;
    tmdb_id?: number;
    synopsis?: string;
    cover_art_url?: string;
    release_date?: string;
    director?: string;
    cast?: string[];
    disc_number?: number;
    formats?: string[];
  };
}

export type UpdatePhysicalItemDto = Partial<Omit<CreatePhysicalItemDto, 'media'>>;

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
export type PhysicalFormat = '4K UHD' | 'Blu-ray' | 'DVD' | 'LaserDisc' | 'VHS' | 'all';
export type SortField = 'title' | 'release_date' | 'created_at' | 'physical_format' | 'series_sort' | 'director_last_name';
export type SortOrder = 'asc' | 'desc';

export interface FilterOptions {
  format?: PhysicalFormat;
  sort_by?: SortField;
  sort_order?: SortOrder;
  search?: string;
  page?: number;
  limit?: number;
}

// Bulk operations types
export interface BulkSearchMatch {
  originalTitle: string;
  matches: TMDbMovieDetails[];
  selectedMatch: TMDbMovieDetails | null;
}

export interface BulkSearchUnmatched {
  originalTitle: string;
  error: string;
}

export interface BulkSearchResponse {
  matched: BulkSearchMatch[];
  unmatched: BulkSearchUnmatched[];
  summary: {
    total: number;
    matched: number;
    unmatched: number;
  };
}

export interface BulkPhysicalItemDto {
  name: string;
  physical_format: string[];
  edition_notes?: string;
  custom_image_url?: string;
  purchase_date?: string;
  media: {
    title: string;
    tmdb_id?: number;
    synopsis?: string;
    cover_art_url?: string;
    release_date?: string;
    director?: string;
    cast?: string[];
  };
}

export interface BulkCreatePhysicalItemsResponse {
  successful: Array<{
    success: true;
    physicalItem: PhysicalItem;
    originalName: string;
  }>;
  failed: Array<{
    originalName: string;
    error: string;
  }>;
  summary: {
    total: number;
    successful: number;
    failed: number;
  };
}

export interface CollectionStatistics {
  totalPhysicalItems: number;
  totalMovies: number;
  formatCounts: Record<string, number>;
}

