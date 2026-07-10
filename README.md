# Elaine Shadowing Studio

Elaine Shadowing Studio is a mobile-first PWA for English shadowing practice. It is built with plain HTML, CSS, and JavaScript, and can be deployed directly to GitHub Pages.

## Features

- One sentence per screen, card-style reading flow
- Sentence playback with `0.75x` and `1x` speed
- Single-sentence loop
- Previous and next sentence navigation
- English subtitles and hideable Chinese subtitles
- Favorite sentences
- Mark sentences as mastered
- Local learning records with `localStorage`
- Mobile microphone recording
- Recording playback
- Original audio and recording comparison playback
- Dark mode
- Large-text reading mode
- PWA install support for iPhone home screen
- Offline app shell and course JSON cache
- Data-driven course architecture

## Project Structure

```text
.
├── index.html
├── styles.css
├── app.js
├── manifest.webmanifest
├── service-worker.js
├── .nojekyll
├── .github/
│   └── workflows/
│       └── deploy.yml
├── assets/
│   ├── audio/
│   └── icons/
└── courses/
    ├── voa/
    │   └── course.json
    ├── twilight/
    │   └── course.json
    ├── friends/
    │   └── course.json
    └── ted/
        └── course.json
```

## Local Preview

Because the app loads course JSON with `fetch`, preview it through a local web server:

```bash
python3 -m http.server 5173
```

Open:

```text
http://localhost:5173
```

Microphone recording requires a secure context. It works on `localhost` during development and on `https://` after GitHub Pages deployment.

## GitHub Pages Deployment

### Option 1: Deploy from GitHub Actions

1. Push this project to a GitHub repository.
2. In the repository, open `Settings > Pages`.
3. Set `Build and deployment > Source` to `GitHub Actions`.
4. Push to `main`.
5. The included workflow publishes the static site.

### Option 2: Deploy from Branch

1. Push this project to GitHub.
2. Open `Settings > Pages`.
3. Choose `Deploy from a branch`.
4. Select the `main` branch and `/root`.

## Course Data Format

Each course lives in:

```text
courses/{course-id}/course.json
```

Example sentence:

```json
{
  "id": "voa-001",
  "english": "Many learners improve their speaking by listening carefully and repeating short sentences.",
  "chinese": "许多学习者通过认真聆听并重复短句来提高口语。",
  "startTime": 0,
  "endTime": 6.2,
  "audioPath": "assets/audio/voa/001.mp3",
  "tags": ["news", "learning", "clear"],
  "vocabulary": [
    { "word": "improve", "meaning": "提高" },
    { "word": "carefully", "meaning": "认真地" }
  ]
}
```

Required fields:

- `id`: Stable sentence ID. Do not change it after users start learning.
- `english`: English subtitle text.
- `chinese`: Chinese subtitle text.
- `startTime`: Start position in seconds.
- `endTime`: End position in seconds.
- `audioPath`: Audio URL or relative asset path.
- `tags`: Topic, level, source, or practice labels.
- `vocabulary`: Word list for the sentence.

The first sample courses use empty `audioPath` values so the app can run without bundled copyrighted audio. When `audioPath` is empty or unavailable, the app falls back to browser speech synthesis for preview.

## Adding a Course

1. Create a folder under `courses/`.
2. Add a `course.json` using the schema above.
3. Add audio files under `assets/audio/{course-id}/`.
4. Add the course to the `COURSES` array in `app.js`.
5. Add the course JSON path to `APP_SHELL` in `service-worker.js` if it should be available offline immediately.

## Future Extension Points

The current structure leaves clear places for:

- AI pronunciation scoring
- Connected-speech and linking analysis
- Vocabulary notebook
- Cloud sync
- Multi-device sync
- GitHub Actions deployment improvements

Suggested implementation direction:

- Keep course content in JSON.
- Keep user state behind a storage adapter so `localStorage` can later be replaced by IndexedDB or a cloud API.
- Add pronunciation scoring as a separate module that receives original sentence text and recorded audio.
- Add account and sync features without changing the course schema.

## iPhone Installation

After deploying to GitHub Pages:

1. Open the site in Safari.
2. Tap Share.
3. Tap Add to Home Screen.
4. Launch Elaine Shadowing Studio from the home screen.

