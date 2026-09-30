# 💖 19-Day Romantic Birthday Journey

A cute, emotional, premium romantic birthday surprise web application crafted with React, Vite, Tailwind CSS, Framer Motion, and Node.js.

The journey spans **October 1 to October 19, 2026**:
- **October 1 – 18:** 18 daily personal video surprises unlocked day-by-day with voluntary camera reaction recording.
- **October 19:** A grand, emotionally rich Birthday finale featuring a birthday video, photo memories gallery, "19 Things I Love About You" cards, and a reaction review gallery.

---

## 📋 Table of Contents
1. [Prerequisites & Node.js Installation](#1-prerequisites--nodejs-installation)
2. [Project Installation](#2-project-installation)
3. [Running the Application](#3-running-the-application)
4. [Customization (Name, Dates, Music)](#4-customization-name-dates-music)
5. [Testing & Dev Mode (Date Simulation)](#5-testing--dev-mode-date-simulation)
6. [Adding Media Files (Videos, Photos, Music)](#6-adding-media-files-videos-photos-music)
7. [Backend & Database Setup (Phases 6–7)](#7-backend--database-setup-phases-67)
8. [Preparing for Deployment](#8-preparing-for-deployment)

---

## 1. Prerequisites & Node.js Installation
- Ensure **Node.js (v18 or higher)** is installed. You can check your version:
  ```bash
  node -v
  npm -v
  ```
- If not installed, download the LTS release from [https://nodejs.org](https://nodejs.org).

---

## 2. Project Installation
Inside the project root directory:
```bash
npm install
```

---

## 3. Running the Application

### Frontend Development Server
```bash
npm run dev
```
Open [http://localhost:5173](http://localhost:5173) in your browser.

### Backend Server (Node/Express)
```bash
npm run server
```

### Run Both Together
```bash
npm run dev:all
```

---

## 4. Customization (Name, Dates, Music)
All high-level settings are centralized in [`src/data/config.js`](file:///src/data/config.js):

```javascript
export const config = {
  boyfriendName: "My Love",        // Change to his name or nickname
  journeyStart: "2026-10-01",      // Journey countdown start
  birthday: "2026-10-19",          // Grand birthday finale date
  timezone: "Asia/Kolkata",        // Timezone for date locking
  finalMessage: "Happy Birthday, My Love ❤️",
  music: "/music/our-song.mp3",    // Background music track

  devMode: true,                   // Set to false before sending it to him
  testDate: "2026-09-30"           // Simulated date for testing
};
```

---

## 5. Testing & Dev Mode (Date Simulation)
Because you cannot wait until October to test everything, the application includes a **Dev Mode Date Simulator**:

1. In [`src/data/config.js`](file:///src/data/config.js), ensure `devMode: true`.
2. Look at the bottom-left corner of the screen when running `npm run dev`:
   - Click the **Dev Test Mode** badge.
   - Choose any date preset:
     - `2026-09-30` → Test Home page countdown before the journey starts.
     - `2026-10-01` → Day 1 unlocked.
     - `2026-10-05` → Day 5 unlocked (Days 1–4 completed, future days locked).
     - `2026-10-18` → Day 18 unlocked.
     - `2026-10-19` → Grand Birthday celebration experience.
3. **Before deploying to your boyfriend**, set:
   ```javascript
   devMode: false
   ```
   This completely removes the testing banner and uses the actual device/server date in `Asia/Kolkata`.

---

## 6. Adding Media Files (Videos, Photos, Music)

### Daily Surprise Videos
Store your personal MP4 videos in `public/videos/`:
- `public/videos/day-01.mp4`
- `public/videos/day-02.mp4`
- ...
- `public/videos/day-18.mp4`
- `public/videos/birthday.mp4` (October 19 grand birthday video)

### Romantic Background Song
Place an MP3 file at:
- `public/music/our-song.mp3`

### Photo Memories
Place photos in:
- `public/images/`

---

## 7. Backend & Database Setup (Phases 6–7)
Create your `.env` file (copied from `.env.example`):
```env
PORT=5000
MONGODB_URI=mongodb://localhost:27017/birthday_journey
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
CLIENT_URL=http://localhost:5173
```

---

## 8. Preparing for Deployment
1. Run `npm run build` to verify the frontend production build.
2. Ensure `devMode: false` in `src/data/config.js`.
3. Provide your production Cloudinary and MongoDB credentials in production environment variables.
