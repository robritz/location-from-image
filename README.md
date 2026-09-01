# Location from Image

> ⚠️ **Proof of Concept.** 

A small web app that guesses **where a photo was taken** by reading the image's embedded GPS coordinates (EXIF), then lists nearby food-and-drink businesses using the Mapbox Search API.

## How it works

1. You select an image in the browser.
2. The app reads the photo's EXIF GPS data **client-side** (via [`exifr`](https://github.com/MikeKovarik/exifr)) — no upload of the raw image to a server.
3. The coordinates are sent to an internal API route (`/api/nearby`), which queries the [Mapbox Search Box API](https://docs.mapbox.com/api/search/search-box/) for `food_and_drink` businesses near that point.
4. The five closest businesses within ~100 feet are shown.

If the image has no GPS data (common for screenshots, downloaded images, or photos with location tagging disabled), the app tells you so.

## Tech stack

- **Next.js 15** (App Router) + **React 18**
- **Material UI 6** with a dark theme
- **exifr** for client-side EXIF parsing
- **Mapbox Search Box API** for nearby-business lookup
- **IndexedDB** for passing the selected image/coordinates between pages

## Getting started

### Prerequisites

- Node.js 18+
- A free [Mapbox access token](https://account.mapbox.com/access-tokens/)

### Setup

```bash
# 1. Install dependencies
npm install

# 2. Configure your Mapbox token
cp .env.local.example .env.local
# then edit .env.local and set MAPBOX_TOKEN=...

# 3. Run the dev server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) and select a photo that has location data.

> **Tip:** Photos taken on a phone with location services enabled are the best test cases. Images shared via most messaging apps or social platforms have their EXIF/GPS stripped.

## Environment variables

| Variable       | Description                                              |
| -------------- | ------------------------------------------------------- |
| `MAPBOX_TOKEN` | Mapbox access token, used **server-side** only.         |

`MAPBOX_TOKEN` is read only inside the `/api/nearby` route, so it is never exposed to the browser.

## Scripts

| Command         | Description                       |
| --------------- | --------------------------------- |
| `npm run dev`   | Start the development server      |
| `npm run build` | Production build                  |
| `npm run start` | Serve the production build        |
| `npm run lint`  | Run ESLint                        |

## Project structure

```
src/
├── app/
│   ├── api/nearby/route.ts   # Server route: coords -> nearby businesses (Mapbox)
│   ├── layout.tsx            # Root layout, MUI theme provider
│   ├── page.tsx              # Home: image select + EXIF read + results
│   └── image/                # Secondary image view page
├── lib/
│   └── imageStore.ts         # IndexedDB helpers for image + GPS
└── theme.ts                  # MUI dark theme
```

## Known limitations (it's a POC)

- Only surfaces `food_and_drink` businesses within a fixed ~100 ft radius.
- No tests, no auth, minimal error handling.
- Relies entirely on EXIF GPS — images without it produce no result.
- Not optimized or hardened for production use.
