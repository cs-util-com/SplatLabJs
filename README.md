# SplatLabJs

**3D Gaussian Splat Viewer – Multiple Scenes**

SplatLabJs is a web-based viewer for 3D Gaussian Splat scenes, supporting multiple scene loading, interactive measurement tools, and transform controls. Built with [Three.js](https://threejs.org/) and [gaussian-splats-3d](lib/gaussian-splats-3d.module.js), it provides a modern UI for exploring and analyzing splat-based 3D data.

**Live Demo:**  
👉 [https://cs-util-com.github.io/SplatLabJs/](https://cs-util-com.github.io/SplatLabJs/)

---

## Features

- **Multiple Scene Support:** Load and switch between several 3D Gaussian Splat scenes in one session.
- **Interactive 3D Controls:**
  - Orbit, pan, and zoom with mouse (Three.js OrbitControls)
  - Field of View (FOV) slider for camera adjustment
  - Background color picker
- **Transform Gizmo:**
  - Move, rotate, and scale loaded splat scenes with a visual gizmo (TransformControls)
  - Toggle transform mode and select operation (translate/rotate/scale)
- **Measurement Tools:**
  - Place reference points in 3D space
  - Measure distances and areas interactively
  - Set real-world scale using reference labels
  - Clear points and measurements with dedicated buttons
- **Scene List Panel:**
  - View and select loaded scenes
  - Highlight active scene for transformation or measurement
- **Modern UI:**
  - Responsive layout with [Tailwind CSS](https://tailwindcss.com/)
  - Minimal, accessible controls

---

## Usage

1. **Open `index.html` in a modern browser.**
2. **Load a 3D Gaussian Splat file:**
   - Use the file input to select a `.splat` or compatible file.
   - Adjust options like alpha removal threshold and spherical harmonics degree if needed.
   - Multiple files can be loaded and managed from the scene list.
3. **Navigate the scene:**
   - Use mouse to orbit, pan, and zoom.
   - Adjust FOV and background color as desired.
4. **Transform scenes:**
   - Enable transform mode to move, rotate, or scale the selected scene.
   - Use the transform mode buttons to switch between operations.
5. **Make measurements:**
   - Double-click to place reference points.
   - Click to start/extend measurements; close a polygon to measure area.
   - Set scale by clicking a distance label and entering the real-world value.
   - Use clear buttons to remove points or measurements.

---

## Development

- Main logic is in `index.html` (uses ES modules and import maps)
- 3D Gaussian Splat loading via `lib/gaussian-splats-3d.module.js`
- UI styled with Tailwind CSS CDN
- No build step required; works as a static site

---

## License
See [LICENSE](LICENSE).