# Cineshelf 🎬

A simple, clean, and modern self-hosted web application for cataloging and displaying your personal collection of physical video media (Blu-rays, 4K UHDs, DVDs, LaserDiscs, and VHS).

## Features

- **Media Management**: Add, edit, and delete entries with TMDb API integration
- **Multiple Formats**: Support for 4K UHD, Blu-ray, DVD, LaserDisc, and VHS
- **CSV Import/Export**: Backup and restore your collection with full metadata
- **Beautiful Gallery**: Responsive collection view with cover art and filtering
- **Two-Port Architecture**: Read-only public port and full admin port for enhanced security
- **Privacy Control**: Public or private collection visibility
- **Custom Metadata**: Track physical format, edition details, and personal photos

## Quick Start with Docker

### Prerequisites

- Docker and Docker Compose
- TMDb API key (free at https://www.themoviedb.org/settings/api)

### Setup Steps

1. **Copy the docker-compose example:**
   ```bash
   cp docker-compose.example.yml docker-compose.yml
   ```

2. **Edit `docker-compose.yml` and replace the placeholders:**
   - Replace `${TMDB_API_KEY}` with your TMDb API key
   - Replace `${ADMIN_PASSWORD}` with your admin password
   - Optionally adjust the ports if needed (default: 3000 for read-only, 3001 for admin)

   Alternatively, you can create a `.env` file in the same directory with:
   ```env
   TMDB_API_KEY=your_tmdb_api_key_here
   ADMIN_PASSWORD=your_secure_password
   ```

3. **Start the container:**
   ```bash
   docker compose up -d
   ```

4. **Access the application:**
   - Read-only (public): http://localhost:3000
   - Admin (internal): http://localhost:3001

### Two-Port Architecture

Cineshelf runs two servers in one container:

- **Read-Only Port** (default 3000): Public-facing server with collection viewing only
- **Admin Port** (default 3001): Full API with all CRUD operations - keep this restricted to VPN/internal network

Both servers share the same database, but the read-only server cannot modify data by design.

## License

MIT
