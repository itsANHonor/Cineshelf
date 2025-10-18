import { Router, Request, Response } from 'express';
import { tmdbService } from '../services/tmdb.service';

const router = Router();

/**
 * GET /api/search/movies
 * Search for movies on TMDb
 */
router.get('/movies', async (req: Request, res: Response) => {
  try {
    const { q, page = '1' } = req.query;

    if (!q || typeof q !== 'string') {
      return res.status(400).json({ error: 'Query parameter "q" is required' });
    }

    const pageNum = parseInt(page as string, 10);
    const results = await tmdbService.searchMovies(q, pageNum);

    res.json(results);
  } catch (error) {
    console.error('Error searching movies:', error);
    res.status(500).json({ error: 'Failed to search movies' });
  }
});

/**
 * GET /api/search/movies/:id
 * Get detailed information about a movie from TMDb
 */
router.get('/movies/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const movieId = parseInt(id, 10);

    if (isNaN(movieId)) {
      return res.status(400).json({ error: 'Invalid movie ID' });
    }

    const movieDetails = await tmdbService.getMovieDetails(movieId);

    // Enhance with helper methods
    const director = tmdbService.getDirector(movieDetails.credits);
    const cast = tmdbService.getTopCast(movieDetails.credits, 10);
    const posterUrl = tmdbService.getImageUrl(movieDetails.poster_path);

    res.json({
      ...movieDetails,
      director,
      cast,
      poster_url: posterUrl,
    });
  } catch (error) {
    console.error('Error fetching movie details:', error);
    res.status(500).json({ error: 'Failed to fetch movie details' });
  }
});

/**
 * GET /api/search/movies/:id/collections
 * Get collections that a movie belongs to
 */
router.get('/movies/:id/collections', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const movieId = parseInt(id, 10);

    if (isNaN(movieId)) {
      return res.status(400).json({ error: 'Invalid movie ID' });
    }

    const collection = await tmdbService.getMovieCollections(movieId);

    res.json(collection);
  } catch (error) {
    console.error('Error fetching movie collections:', error);
    res.status(500).json({ error: 'Failed to fetch movie collections' });
  }
});

/**
 * GET /api/search/collections/:id
 * Get collection details including all movies
 */
router.get('/collections/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const collectionId = parseInt(id, 10);

    if (isNaN(collectionId)) {
      return res.status(400).json({ error: 'Invalid collection ID' });
    }

    const collectionDetails = await tmdbService.getCollectionDetails(collectionId);

    res.json(collectionDetails);
  } catch (error) {
    console.error('Error fetching collection details:', error);
    res.status(500).json({ error: 'Failed to fetch collection details' });
  }
});

export default router;

