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
 * POST /api/search/bulk-movies
 * Search for multiple movies on TMDb
 */
router.post('/bulk-movies', async (req: Request, res: Response) => {
  try {
    const { titles } = req.body;

    if (!titles || !Array.isArray(titles)) {
      return res.status(400).json({ error: 'titles must be an array of strings' });
    }

    if (titles.length === 0) {
      return res.status(400).json({ error: 'At least one title is required' });
    }

    if (titles.length > 50) {
      return res.status(400).json({ error: 'Maximum 50 titles allowed per request' });
    }

    const results = await Promise.allSettled(
      titles.map(async (title: string) => {
        if (typeof title !== 'string' || !title.trim()) {
          throw new Error('Invalid title');
        }
        
        const searchResults = await tmdbService.searchMovies(title.trim());
        
        // Fetch detailed information for each match
        const detailedMatches = await Promise.allSettled(
          searchResults.results.map(async (movie) => {
            try {
              const details = await tmdbService.getMovieDetails(movie.id);
              const director = tmdbService.getDirector(details.credits);
              const cast = tmdbService.getTopCast(details.credits, 10);
              const posterUrl = tmdbService.getImageUrl(details.poster_path);
              
              return {
                ...details,
                director,
                cast,
                poster_url: posterUrl,
              };
            } catch (error) {
              // If detailed fetch fails, return basic movie info
              console.warn(`Failed to fetch details for movie ${movie.id}:`, error);
              return movie;
            }
          })
        );
        
        const successfulMatches = detailedMatches
          .filter((result) => result.status === 'fulfilled')
          .map((result) => result.value);
        
        return {
          originalTitle: title.trim(),
          matches: successfulMatches,
          selectedMatch: successfulMatches[0] || null // Default to first result
        };
      })
    );

    const matched: any[] = [];
    const unmatched: any[] = [];

    results.forEach((result, index) => {
      if (result.status === 'fulfilled' && result.value.matches.length > 0) {
        matched.push(result.value);
      } else {
        unmatched.push({
          originalTitle: titles[index],
          error: result.status === 'rejected' ? result.reason.message : 'No matches found'
        });
      }
    });

    res.json({
      matched,
      unmatched,
      summary: {
        total: titles.length,
        matched: matched.length,
        unmatched: unmatched.length
      }
    });
  } catch (error) {
    console.error('Error in bulk movie search:', error);
    res.status(500).json({ error: 'Failed to search movies' });
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

