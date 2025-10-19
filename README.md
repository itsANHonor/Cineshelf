# Cineshelf 🎬

A simple, clean, and modern self-hosted web application for cataloging and displaying your personal collection of physical video media (Blu-rays, 4K UHDs, DVDs, LaserDiscs, and VHS).

## 🐳 Docker Quick Start (Recommended)

Deploy Cineshelf as a **single lightweight container** perfect for homelab use:

```bash
# 1. Copy and configure environment variables
cp env.docker.example .env.docker
# Edit .env.docker with your TMDb API key and admin password

# 2. Build and start
docker-compose --env-file .env.docker up -d

# 3. Access at http://localhost:3000
```

**That's it!** Your collection is now running in a single container (~100MB RAM, ~150MB disk) with:
- ✅ Automatic database migrations
- ✅ Persistent data storage  
- ✅ Frontend + Backend in one simple container
- ✅ All new features included (LaserDisc/VHS, CSV Import/Export)

**Optional**: Validate your Docker setup before building:
```bash
./validate-docker.sh
```

📖 See [DOCKER_QUICKSTART.md](DOCKER_QUICKSTART.md) for quick start guide, [DOCKER.md](DOCKER.md) for detailed Docker documentation.

---

## Features

- **Media Management**: Add, edit, and delete entries with TMDb API integration
- **Multiple Formats**: Support for 4K UHD, Blu-ray, DVD, LaserDisc, and VHS
- **Import/Export**: Backup and restore your collection via CSV files
- **Beautiful Gallery**: Responsive collection view with cover art and filtering
- **Privacy Control**: Public or private collection visibility
- **Custom Metadata**: Track physical format, edition details, and personal photos
- **Modern UI**: Built with React, TypeScript, and Tailwind CSS

## Tech Stack

- **Frontend**: React + Vite + TypeScript + Tailwind CSS
- **Backend**: Node.js + Express + TypeScript
- **Database**: SQLite with Knex.js
- **API**: The Movie Database (TMDb)

## Getting Started

Choose your preferred installation method:

- **🐳 Docker** (Recommended): See [Docker Quick Start](#-docker-quick-start-recommended) above or [DOCKER.md](DOCKER.md)
- **💻 Manual Installation**: Follow the instructions below

### Manual Installation

#### Prerequisites

- Node.js 18+ 
- NPM or Yarn
- TMDb API Key (free at https://www.themoviedb.org/settings/api)

#### Installation Steps

1. **Clone and install dependencies:**
   ```bash
   cd Cineshelf
   npm run install:all
   ```

2. **Set up environment variables:**
   ```bash
   # In the server directory
   cd server
   cp .env.example .env
   ```
   
   Edit the `.env` file with your configuration:
   ```env
   PORT=3001
   TMDB_API_KEY=your_tmdb_api_key_here
   ADMIN_PASSWORD=your_secure_password
   DATABASE_PATH=./database.sqlite
   UPLOAD_DIR=./uploads
   ```

3. **Initialize the database:**
   ```bash
   cd server
   npm run migrate:latest
   ```

4. **Start the development servers:**
   ```bash
   # From the root directory
   npm run dev
   ```

   This will start:
   - Backend server on http://localhost:3001
   - Frontend server on http://localhost:3000

## Project Structure

```
Cineshelf/
├── client/                 # React frontend
│   ├── src/
│   │   ├── components/     # Reusable components
│   │   ├── pages/         # Page components
│   │   ├── App.tsx        # Main app component
│   │   └── main.tsx       # Entry point
│   ├── package.json
│   └── vite.config.ts
├── server/                # Express backend
│   ├── src/
│   │   ├── index.ts       # Server entry point
│   │   └── database.ts    # Database setup
│   ├── migrations/        # Database migrations
│   ├── uploads/          # File uploads directory
│   ├── package.json
│   └── knexfile.ts
└── package.json          # Root package.json
```

## Development

- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:3001/api
- **Database**: SQLite file in server directory

### Available Scripts

- `npm run dev` - Start both frontend and backend in development mode
- `npm run build` - Build the frontend for production
- `npm run server:dev` - Start only the backend server
- `npm run client:dev` - Start only the frontend server

## Features Overview

### Implemented Features ✅

- **TMDb API Integration**: Search movies and automatically populate metadata
- **Media CRUD Operations**: Full create, read, update, and delete functionality
- **Multiple Physical Formats**: Support for 4K UHD, Blu-ray, DVD, LaserDisc, and VHS
- **CSV Import/Export**: Backup and restore your collection with full metadata
- **File Upload**: Upload custom images for your physical media
- **Authentication**: Password-protected admin panel
- **Collection Gallery**: Beautiful responsive grid view with cover art
- **Filtering & Sorting**: Filter by format, sort by title/year/date added
- **Privacy Control**: Toggle between public and private collection visibility
- **Settings Management**: Admin dashboard with collection statistics

### Usage

1. **First Time Setup**: Navigate to `/admin` and log in with your admin password
2. **Add Media**: Click "Add New Media", search TMDb, select a movie, and add physical media details
3. **Upload Custom Images**: Upload photos of your actual physical media
4. **Manage Collection**: Edit or delete items from the admin panel
5. **View Collection**: Browse your collection at `/collection` with filtering and sorting
6. **Privacy Settings**: Toggle collection visibility in admin settings
7. **Import/Export**: Backup your collection or import from CSV (Admin → Settings → Import/Export)

📄 See [CSV_FORMAT_GUIDE.md](CSV_FORMAT_GUIDE.md) for detailed CSV format documentation.

## API Endpoints

### Authentication
- `POST /api/auth/login` - Login with password
- `GET /api/auth/verify` - Verify authentication

### Media
- `GET /api/media` - Get all media (with optional filters)
- `GET /api/media/:id` - Get single media item
- `POST /api/media` - Create media (protected)
- `PUT /api/media/:id` - Update media (protected)
- `DELETE /api/media/:id` - Delete media (protected)
- `POST /api/media/upload` - Upload custom image (protected)

### TMDb Search
- `GET /api/search/movies?q=query` - Search movies on TMDb
- `GET /api/search/movies/:id` - Get movie details from TMDb

### Settings
- `GET /api/settings` - Get all settings
- `GET /api/settings/:key` - Get specific setting
- `PUT /api/settings/:key` - Update setting (protected)
- `POST /api/settings` - Update multiple settings (protected)

### Import/Export
- `GET /api/import-export/schema` - Get CSV format documentation
- `GET /api/import-export/export` - Export collection as CSV (protected)
- `POST /api/import-export/validate` - Validate CSV before import (protected)
- `POST /api/import-export/import` - Import CSV file (protected)

## License

MIT
