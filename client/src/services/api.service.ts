import axios, { AxiosInstance } from 'axios';
import {
  Media,
  CreateMediaDto,
  UpdateMediaDto,
  TMDbSearchResponse,
  TMDbMovieDetails,
  Settings,
  AuthResponse,
  FilterOptions,
  Series,
} from '../types';

class ApiService {
  private api: AxiosInstance;
  private token: string | null = null;

  constructor() {
    this.api = axios.create({
      baseURL: '/api',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    // Load token from localStorage
    this.token = localStorage.getItem('auth_token');
    if (this.token) {
      this.setAuthToken(this.token);
    }
  }

  // Auth methods
  setAuthToken(token: string) {
    this.token = token;
    this.api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    localStorage.setItem('auth_token', token);
  }

  clearAuthToken() {
    this.token = null;
    delete this.api.defaults.headers.common['Authorization'];
    localStorage.removeItem('auth_token');
  }

  async login(password: string): Promise<AuthResponse> {
    const response = await this.api.post<AuthResponse>('/auth/login', { password });
    if (response.data.success) {
      this.setAuthToken(response.data.token);
    }
    return response.data;
  }

  async verifyAuth(): Promise<boolean> {
    try {
      await this.api.get('/auth/verify');
      return true;
    } catch {
      return false;
    }
  }

  logout() {
    this.clearAuthToken();
  }

  // Media methods
  async getMedia(filters?: Partial<FilterOptions>): Promise<Media[]> {
    const response = await this.api.get<Media[]>('/media', { params: filters });
    return response.data;
  }

  async getMediaById(id: number): Promise<Media> {
    const response = await this.api.get<Media>(`/media/${id}`);
    return response.data;
  }

  async createMedia(data: CreateMediaDto): Promise<Media> {
    const response = await this.api.post<Media>('/media', data);
    return response.data;
  }

  async updateMedia(id: number, data: UpdateMediaDto): Promise<Media> {
    const response = await this.api.put<Media>(`/media/${id}`, data);
    return response.data;
  }

  async deleteMedia(id: number): Promise<void> {
    await this.api.delete(`/media/${id}`);
  }

  async uploadImage(file: File): Promise<{ url: string; filename: string }> {
    const formData = new FormData();
    formData.append('image', file);

    const response = await this.api.post<{ url: string; filename: string }>(
      '/media/upload',
      formData,
      {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      }
    );
    return response.data;
  }

  // TMDb search methods
  async searchMovies(query: string, page: number = 1): Promise<TMDbSearchResponse> {
    const response = await this.api.get<TMDbSearchResponse>('/search/movies', {
      params: { q: query, page },
    });
    return response.data;
  }

  async getMovieDetails(tmdbId: number): Promise<TMDbMovieDetails> {
    const response = await this.api.get<TMDbMovieDetails>(`/search/movies/${tmdbId}`);
    return response.data;
  }

  async getTMDbCollections(tmdbId: number): Promise<any> {
    const response = await this.api.get(`/search/movies/${tmdbId}/collections`);
    return response.data;
  }

  async getCollectionDetails(collectionId: number): Promise<any> {
    const response = await this.api.get(`/search/collections/${collectionId}`);
    return response.data;
  }

  // Series methods
  async getSeries(): Promise<Series[]> {
    const response = await this.api.get<Series[]>('/series');
    return response.data;
  }

  async getSeriesById(id: number): Promise<Series> {
    const response = await this.api.get<Series>(`/series/${id}`);
    return response.data;
  }

  async getSeriesMovies(id: number): Promise<Media[]> {
    const response = await this.api.get<Media[]>(`/series/${id}/movies`);
    return response.data;
  }

  async createSeries(data: Omit<Series, 'id' | 'created_at' | 'updated_at'>): Promise<Series> {
    const response = await this.api.post<Series>('/series', data);
    return response.data;
  }

  async updateSeries(id: number, data: Partial<Omit<Series, 'id' | 'created_at' | 'updated_at'>>): Promise<Series> {
    const response = await this.api.put<Series>(`/series/${id}`, data);
    return response.data;
  }

  async deleteSeries(id: number): Promise<void> {
    await this.api.delete(`/series/${id}`);
  }

  // Settings methods
  async getSettings(): Promise<Settings> {
    const response = await this.api.get<Settings>('/settings');
    return response.data;
  }

  async getSetting(key: string): Promise<{ key: string; value: string }> {
    const response = await this.api.get<{ key: string; value: string }>(`/settings/${key}`);
    return response.data;
  }

  async updateSetting(key: string, value: string): Promise<{ key: string; value: string }> {
    const response = await this.api.put<{ key: string; value: string }>(`/settings/${key}`, {
      value,
    });
    return response.data;
  }

  async updateSettings(settings: Record<string, string>): Promise<Settings> {
    const response = await this.api.post<Settings>('/settings', settings);
    return response.data;
  }

  // Import/Export methods
  async getImportExportSchema(): Promise<any> {
    const response = await this.api.get('/import-export/schema');
    return response.data;
  }

  async exportCollection(): Promise<Blob> {
    const response = await this.api.get('/import-export/export', {
      responseType: 'blob',
    });
    return response.data;
  }

  async validateCSV(csvData: string): Promise<any> {
    const response = await this.api.post('/import-export/validate', { csv_data: csvData });
    return response.data;
  }

  async importCollection(csvData: string, mode: 'add' | 'replace' = 'add'): Promise<any> {
    const response = await this.api.post('/import-export/import', { 
      csv_data: csvData,
      mode,
    });
    return response.data;
  }
}

export const apiService = new ApiService();

