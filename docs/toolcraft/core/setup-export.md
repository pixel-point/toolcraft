# Setup, Background, And Export

Read this module before changing Setup, canvas sizing, background, image export, video export, sticky actions, render scale, or timeline visibility.

## Runtime Setup

- Runtime `Setup` is always the first visible controls block in generated product apps.
- `Setup` is headerless, not collapsible, and has no section reset action.
- `Setup` always contains `Export Settings` and `Import Settings`.
- Do not implement settings import/export through `panelActions`, route-local file inputs, or app-authored controls.
- Do not gate settings import/export by app complexity.
- Product-output, exportable, shader, procedural, reference-clone, and uploaded-background/source apps use `editable-output`.
- With `editable-output`, Setup contains `Aspect ratio`, `Canvas width`, and `Canvas height` after settings transfer.
- App-authored sections must not declare runtime Setup targets: `runtime.settingsTransfer`, `canvas.aspectRatio`, `canvas.size.width`, `canvas.size.height`, `canvas.renderScale`, or `panels.timeline.extended`.

## Canvas Size Defaults

- When no explicit product size is provided, the default canvas size is `16:9` / `1920x1080`.
- Runtime aspect presets apply canonical canvas sizes; `16:9` is `1920x1080`.
- A prompt-provided, reference, fixed-format, or base/default size is only the initial `canvas.size`.
- Fixed/reference/base dimensions are not reasons to hide `Aspect ratio`, `Canvas width`, or `Canvas height`.
- Manual Canvas width/height edits keep the typed dimension, keep the other dimension unchanged, switch Aspect ratio to Custom, and show the reduced current ratio in the custom ratio inputs.

## Resolution Scale

- Non-vector raster, Canvas 2D, WebGL, and WebGPU previews set `canvas.renderScale: true`.
- Runtime then appends `Resolution scale` after canvas sizing.
- `Resolution scale` changes backing pixels from `1` to `2` without changing visible CSS size or product output dimensions.
- DOM/SVG/vector-native previews should not use render scale.
- Performance fixes must preserve the user's selected render scale. Do not pass budgets by silently downsampling, stretching a lower-resolution backing canvas, blurring output, or clamping render scale below the chosen value.

## Timeline Setup Switch

- When `panels.timeline` is enabled, runtime appends a `Timeline` switch as the last Setup control.
- Off shows compact Play-only transport.
- On shows the extended timeline with scrubber, duration, loop, and keyframe UI.
- The switch controls runtime presentation only. It does not pause playback, change product values, remove keyframes, alter export, or reset with `Reset controls`.
- When `panels.timeline` is omitted, the Timeline switch must not appear.

## Background

- Every product app exposes a required `Background` section directly before the first export settings section.
- The section contains one equal-width inline row:
  - `export.includeBackground` as a switch labeled `Include`;
  - the product background color control with `label: false`.
- Use a schema `color` target such as `appearance.background` or `scene.background`.
- Do not hardcode a configurable background in CSS, Canvas `fillStyle`, or WebGL clear color.
- Live preview calls `shouldIncludeToolcraftPreviewBackground(state)` and hides only the product-rendered background when Include is off.
- PNG export passes the Include value to the standard PNG export helper.
- Video export keeps the background even when Include is off.

## Image Export

- Every app with `Export PNG` exposes a separate `Image Export` section.
- `Image Export` uses two `select` controls in one compact two-column inline row:
  - `export.image.format`, default `png`, with baseline `PNG` and `JPG` options;
  - `export.image.resolution`, default `4k`, with baseline `2K`, `4K`, and `8K` options.
- Still-output apps place `Image Export` directly above sticky footer actions.
- Animated apps with both image and video export place `Image Export` immediately before `Video Export`.
- PNG export calls `createToolcraftPngExportCanvas({ includeBackground, resolution, state, render })`.
- The selected `export.image.resolution` must produce real 2048/4096/8192px long-edge PNG output for 2K/4K/8K. Retina sizing is only the fallback for current/omitted resolution.

## Video Export

- Animated product apps expose `Export Video` and `Export PNG`.
- Any app with `Export Video` must enable the top Toolcraft timeline.
- Animated apps expose a separate `Video Export` section directly above sticky footer export buttons, after `Image Export`.
- `Video Export` uses two `select` controls in one compact two-column inline row by default:
  - `export.video.format`, default `mp4`, with baseline `MP4` and `WebM` options;
  - `export.video.resolution`, default `current`, with baseline `Current` and `4K` options.
- Stack the pair only when labels or selected values would clip, and record that fit reason in the worklog.
- Use `MediaRecorder.isTypeSupported(...)` or an explicit encoder/transcoder capability check before choosing the actual MIME/container.
- `MOV` and `ProRes` are not baseline browser outputs; use them only with a custom encoder/transcoder plus acceptance and performance coverage.
- Use `getToolcraftVideoExportSize` for video dimensions. `current` uses current canvas/output size with even encoder-safe rounding; `4k` fits inside 3840x2160, preserves aspect ratio, and returns even dimensions.
- Offline rendered-frame video export must write timeline-based timestamps. `canvas.captureStream()` plus `MediaRecorder` records wall-clock time and cannot be the only duration mechanism for heavy renderers.
- Browser acceptance must load the exported blob as a video, wait for metadata, and compare `video.duration` with the runtime timeline duration.

## Sticky Product Actions

- Product apps always expose export in sticky `panelActions`.
- Still products expose `Export PNG`.
- Animated products expose `Export Video` plus `Export PNG`.
- Clipboard copy is optional and never replaces export.
- Export PNG and Export Video use `icon: "upload-simple"` to match the runtime `Export Settings` action.
- Async export/download/copy/generate/apply handlers return the real Promise from `onPanelAction`. The runtime shows the sticky footer top accent indicator while the Promise is pending.
- Use `reportProgress(0..1)` for determinate progress when available.
