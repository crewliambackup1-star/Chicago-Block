# CHICAGO BLOCK — Open-World Prototype

A browser-based 3D neighborhood exploration prototype built with Three.js. The setting is an original, fictionalized Chicago-inspired district rather than a precise recreation of a real residential property.

## Play locally

Open the repository's GitHub Pages site after Pages is enabled, or run a local server:

```bash
python3 -m http.server 8080
```

Then open http://localhost:8080 in your browser. An internet connection is required because Three.js is loaded from jsDelivr.

## Controls

- WASD / arrow keys: walk or drive
- Shift: sprint while walking
- E: enter or exit the sedan when nearby
- V: switch first-person / third-person camera
- Mouse: look around (click the scene to capture the mouse; press Esc to release)
- Space: brake while driving
- N: advance the displayed time

## Prototype notes

This is an early playable slice, not a finished commercial game. It includes a courtyard, apartment buildings, a small shop shell, pedestrians, a drivable sedan, and two camera perspectives. Models, collision, traffic, and interactions are simplified. Performance varies by device and browser.

The initial public browser build is a single `index.html` file.