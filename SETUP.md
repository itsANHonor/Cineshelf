# Cineshelf - Setup Guide

## Prerequisites

Before you begin, ensure you have:

- Node.js 18+ installed
- NPM or Yarn package manager
- A TMDb API key (free at https://www.themoviedb.org/settings/api)

## Installation Steps

### 1. Install Dependencies

From the project root directory:

```bash
# Install root dependencies
npm install

# Install server dependencies
cd server
npm install

# Install client dependencies
cd ../client
npm install
```

### 2. Configure Environment Variables

Create a `.env` file in the `server` directory:

```bash
cd server
cp env.example .env
```

Edit the `.env` file with your configuration:

```env
PORT=3001
TMDB_API_KEY=your_actual_tmdb_api_key_here
ADMIN_PASSWORD=your_secure_password_here
DATABASE_PATH=./database.sqlite
UPLOAD_DIR=./uploads
```

**Important**: Replace `your_actual_tmdb_api_key_here` with your TMDb API key and set a secure admin password.

### 3. Initialize the Database

```bash
cd server
npm run migrate:latest
```

This will create the SQLite database and run all migrations to set up the required tables.

### 4. Start the Application

From the root directory:

```bash
npm run dev
```

This will start both the backend server (port 3001) and frontend development server (port 3000).

Alternatively, you can start them separately:

```bash
# Terminal 1 - Backend
cd server
npm run dev

# Terminal 2 - Frontend
cd client
npm run dev
```

## Accessing the Application

- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:3001/api
- **Admin Panel**: http://localhost:3000/admin

## First-Time Usage

1. Navigate to http://localhost:3000
2. Click "Admin Panel" or go to http://localhost:3000/admin
3. Log in with the password you set in the `.env` file
4. Click "Add New Media" to add your first item
5. Search for a movie on TMDb
6. Select the movie and fill in your physical media details
7. Optionally upload a photo of your physical copy
8. Save the item
9. View your collection at http://localhost:3000/collection

## Troubleshooting

### Database Issues

If you encounter database errors:

```bash
cd server
rm database.sqlite  # Remove existing database
npm run migrate:latest  # Recreate database
```

### Port Conflicts

If ports 3000 or 3001 are already in use, you can change them:

- Backend: Edit `PORT` in `server/.env`
- Frontend: Edit `vite.config.ts` in the client directory

### TMDb API Errors

- Verify your TMDb API key is correct
- Ensure your API key has the necessary permissions
- Check that you're not exceeding the API rate limits

### Upload Issues

Make sure the `uploads` directory exists and is writable:

```bash
cd server
mkdir -p uploads
chmod 755 uploads
```

## Production Deployment

For production deployment:

1. Build the frontend:
   ```bash
   cd client
   npm run build
   ```

2. Build the backend:
   ```bash
   cd server
   npm run build
   ```

3. Configure your web server to:
   - Serve the client build folder as static files
   - Proxy API requests to the Node.js backend
   - Set proper environment variables
   - Use a process manager like PM2 for the backend

## Security Notes

- Change the default `ADMIN_PASSWORD` to something secure
- In production, use HTTPS
- Consider implementing rate limiting for the API
- Keep your TMDb API key private
- Regularly backup your database file

## Need Help?

If you encounter issues:

1. Check that all dependencies are installed
2. Verify environment variables are set correctly
3. Ensure the database migrations have run successfully
4. Check the browser console and server logs for error messages

