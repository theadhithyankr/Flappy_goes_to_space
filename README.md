# Flappy goes to space

Flappy goes to space is a React + Canvas arcade game inspired by Flappy Bird. You start with classic obstacle dodging, then climb into deep space with zero-gravity movement and shooter segments.

## Features

- Three game modes: Classic, Blended, and Deep Space
- Smooth altitude transition from sky to space
- Zero-gravity thruster control in space
- Dynamic speed ramp as score increases
- Shooter mini-game events at score milestones
- Tailwind CSS powered overlays and UI

## Controls

- `Space` or `W`: flap in atmosphere, thrust up in space, and start/restart game
- `S`: thrust down in space
- `Enter` or `D`: shoot during shooter phase

## Tech Stack

- React
- Vite
- HTML5 Canvas
- Tailwind CSS v4

## Run Locally

1. Install dependencies:

```bash
npm install
```

2. Start dev server:

```bash
npm run dev
```

3. Open the local URL shown in terminal (usually `http://localhost:5173` or next free port).

## Build

```bash
npm run build
```

## Notes

- If the default port is occupied, Vite will automatically choose another port.
- Use the mode buttons on the start screen before pressing Space.
