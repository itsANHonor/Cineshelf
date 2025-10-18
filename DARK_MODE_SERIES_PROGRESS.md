# Dark Mode and Series Implementation Progress

## Overview
This document tracks the implementation of two major features:
1. **Dark Mode**: Theme toggle with localStorage for public users and database persistence for admin
2. **Series**: Many-to-many relationship between movies and series, with TMDb collection import and advanced sorting

## Implementation Status

### ✅ Completed Tasks

#### Backend - Database
- [x] Created `003_create_series_tables.js` migration
  - `series` table with id, name, sort_name, tmdb_collection_id
  - `movie_series` junction table with media_id, series_id, sort_order, auto_sort
  - Proper indexes and foreign keys
- [x] Created `004_add_display_settings.js` migration
  - Added `default_theme` setting

####Backend - API Routes
- [x] Created `server/src/routes/series.routes.ts`
  - GET /api/series - List all series
  - GET /api/series/:id - Get single series
  - GET /api/series/:id/movies - Get movies in series
  - POST /api/series - Create series (admin)
  - PUT /api/series/:id - Update series (admin)
  - DELETE /api/series/:id - Delete series (admin)
- [x] Updated `server/src/routes/media.routes.ts`
  - Modified GET /api/media to join series data
  - Implemented series_sort (COALESCE series.sort_name, media.title)
  - Implemented director_last_name sorting (extract last word)
  - Updated POST to handle series_associations array
  - Updated PUT to handle series_associations array
- [x] Updated `server/src/services/tmdb.service.ts`
  - Added getMovieCollections() method
  - Added getCollectionDetails() method
- [x] Updated `server/src/routes/search.routes.ts`
  - Added GET /api/search/movies/:id/collections
  - Added GET /api/search/collections/:id
- [x] Updated `server/src/index.ts`
  - Imported and registered series routes

#### Frontend - Core Infrastructure
- [x] Updated `client/src/types/index.ts`
  - Added Series interface
  - Added MovieSeries interface
  - Updated Media to include series?: Series[]
  - Added 'series_sort' | 'director_last_name' to SortField
  - Updated Settings to include default_theme
- [x] Created `client/src/context/ThemeContext.tsx`
  - Theme state management ('light' | 'dark' | 'system')
  - localStorage persistence
  - System theme detection
  - Document class application
- [x] Updated `client/tailwind.config.js`
  - Enabled darkMode: 'class'
- [x] Updated `client/src/index.css`
  - Added dark mode variants to body
  - Updated .card, .btn-primary, .btn-secondary with dark: variants
- [x] Updated `client/src/App.tsx`
  - Wrapped with ThemeProvider
  - Added dark mode gradient to main container

#### Frontend - Components
- [x] Created `client/src/components/ThemeToggle.tsx`
  - Sun/Moon icon toggle
  - Connected to ThemeContext
- [x] Updated `client/src/components/FilterBar.tsx`
  - Added Series sort button
  - Added Director sort button
  - Added ThemeToggle component
  - Added dark mode styling to all elements
- [x] Created `client/src/components/SeriesManager.tsx`
  - List all series
  - Create/Edit/Delete series
  - Form with name, sort_name, tmdb_collection_id
- [x] Created `client/src/components/CollectionImportModal.tsx`
  - Fetch TMDb collection for a movie
  - Display collection details
  - Import as series

#### Frontend - Services
- [x] Updated `client/src/services/api.service.ts`
  - Added getTMDbCollections()
  - Added getCollectionDetails()
  - Added getSeries()
  - Added getSeriesById()
  - Added getSeriesMovies()
  - Added createSeries()
  - Added updateSeries()
  - Added deleteSeries()

### 🔄 In Progress / Remaining Tasks

#### Frontend - Components (Critical)
- [ ] Update `client/src/components/MediaForm.tsx`
  - Add series multi-select field
  - For each series: toggle auto_sort or manual sort_order
  - Add "Import from TMDb" button
  - Open CollectionImportModal
  - Handle collection import (create series, associate movie)
  - Update form submission to include series_associations array

#### Frontend - Pages (Critical)
- [ ] Update `client/src/pages/AdminPage.tsx`
  - Add tab/section for "Manage Series"
  - Render SeriesManager component
  - Add default_theme dropdown in settings section
  - Load default_theme from database on login
  - Save default_theme to database on change
  - Pass default_theme to ThemeContext if authenticated

- [ ] Update `client/src/pages/CollectionPage.tsx` (Minor)
  - Should already work with new sort options from FilterBar
  - May need to add series display in movie cards

#### Frontend - Components (Enhancement)
- [ ] Update `client/src/components/MediaCard.tsx`
  - Display series badges/tags if movie belongs to series
  - Add dark mode styling

- [ ] Update `client/src/components/MediaDetailModal.tsx`
  - Display series information in modal
  - Add dark mode styling

- [ ] Update `client/src/components/MediaGrid.tsx`
  - Add dark mode styling if needed

### 🧪 Testing Required
- [ ] Test dark mode toggle persistence (localStorage)
- [ ] Test system theme detection
- [ ] Test admin theme setting (database)
- [ ] Test series CRUD operations
- [ ] Test series-movie associations
- [ ] Test TMDb collection import
- [ ] Test series_sort sorting (intermixed alphabetically)
- [ ] Test director_last_name sorting
- [ ] Test filtering with series
- [ ] Test migrations on fresh database
- [ ] Test migrations on existing database

### 🐛 Known Issues / Notes
- None yet - implementation in progress

### 📝 Technical Notes

#### Series Sorting Logic
```sql
-- Series sort intermixes series and non-series movies alphabetically
ORDER BY COALESCE(series.sort_name, media.title) ASC|DESC
```

#### Director Last Name Sorting
```sql
-- Extract last word from director name
CASE 
  WHEN media.director IS NOT NULL AND media.director != '' 
  THEN SUBSTR(media.director, INSTR(media.director, ' ') + 1)
  ELSE media.director
END
```

#### Series Associations Data Structure
```json
{
  "series_associations": [
    {
      "series_id": 1,
      "auto_sort": true,
      "sort_order": null
    },
    {
      "series_id": 2,
      "auto_sort": false,
      "sort_order": 5
    }
  ]
}
```

## Next Steps
1. Update MediaForm with series selection and TMDb import
2. Update AdminPage with series tab and theme settings
3. Add series display to MediaCard and MediaDetailModal
4. Run migrations in development
5. Test all functionality
6. Update user documentation


