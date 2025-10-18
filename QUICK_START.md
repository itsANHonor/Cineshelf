# Display Case - Quick Start Guide

## 🚀 Get Running in 5 Minutes

### 1. Install Dependencies
```bash
# From project root
cd server && npm install
cd ../client && npm install
```

### 2. Set Up Environment
```bash
# In server directory
cd server
cp env.example .env
```

Edit `.env`:
```env
PORT=3001
TMDB_API_KEY=your_key_here          # Get from themoviedb.org
ADMIN_PASSWORD=your_password_here    # Choose a secure password
DATABASE_PATH=./database.sqlite
UPLOAD_DIR=./uploads
```

### 3. Initialize Database
```bash
# In server directory
npm run migrate:latest
```

### 4. Start Application
```bash
# From project root
npm run dev
```

### 5. Access the App
- Open http://localhost:3000
- Go to Admin Panel (http://localhost:3000/admin)
- Log in with your password from step 2

## 📝 Common Tasks

### Add Your First Media Item
1. Click "Add New Media" in admin panel
2. Click "Search TMDb"
3. Search for a movie (e.g., "The Matrix")
4. Click on the movie from search results
5. Select physical format (4K UHD, Blu-ray, or DVD)
6. Add edition notes (optional, e.g., "Steelbook")
7. Upload a photo of your physical copy (optional)
8. Click "Add Media"

### Edit an Item
1. In admin panel, find the item in the list
2. Click the edit icon (pencil)
3. Make your changes
4. Click "Update"

### Delete an Item
1. In admin panel, find the item
2. Click the delete icon (trash)
3. Confirm deletion

### Make Collection Public/Private
1. In admin panel, click "Settings"
2. Toggle "Collection Visibility"
3. Green = Public, Gray = Private

### View Your Collection
- Click "View Collection" or go to http://localhost:3000/collection
- Use filters to show only certain formats
- Click any item to see full details

## 🔧 Troubleshooting

### "Cannot connect to backend"
```bash
# Make sure backend is running
cd server
npm run dev
```

### "Invalid password"
- Check `.env` file in server directory
- Make sure `ADMIN_PASSWORD` is set correctly

### "TMDb search not working"
- Verify `TMDB_API_KEY` in `.env`
- Get API key from: https://www.themoviedb.org/settings/api

### Database errors
```bash
# Reset database
cd server
rm database.sqlite
npm run migrate:latest
```

## 📚 File Structure

```
DisplayCase/
├── server/
│   ├── src/
│   │   ├── routes/          # API endpoints
│   │   ├── services/        # TMDb integration
│   │   ├── middleware/      # Auth & uploads
│   │   └── database.ts      # DB config
│   ├── migrations/          # Database schema
│   └── .env                 # Configuration (create this)
│
└── client/
    ├── src/
    │   ├── pages/           # Main pages
    │   ├── components/      # Reusable UI
    │   ├── services/        # API calls
    │   ├── context/         # Auth state
    │   └── types/           # TypeScript types
    └── public/
```

## 🎯 Key Features

- **TMDb Integration**: Auto-populate movie info
- **Custom Photos**: Upload pics of your physical media
- **Filters & Sorting**: Organize your collection
- **Privacy Control**: Public or private gallery
- **Responsive Design**: Works on desktop, tablet, mobile
- **Secure Admin**: Password-protected management

## 💡 Tips

1. **Get TMDb API Key**: Sign up at themoviedb.org (it's free!)
2. **Organize Collections**: Use edition notes for variants (Steelbook, 4K, etc.)
3. **Upload Photos**: Take pictures of your actual discs/cases for authenticity
4. **Backup Database**: Copy `server/database.sqlite` regularly
5. **Share Collection**: Toggle to public and share the URL with friends

## 📞 Need More Help?

- See `SETUP.md` for detailed setup instructions
- See `README.md` for full documentation
- See `IMPLEMENTATION_SUMMARY.md` for technical details

---

**Ready to start? Run `npm run dev` from the project root and visit http://localhost:3000!** 🎬

