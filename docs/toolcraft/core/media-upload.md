# Media Upload

Read this module before changing image upload, file upload, source material import, media defaults, source images, sorting, or image transform actions.

## FileDrop Ownership

- Use `fileDrop` for source material uploads in the controls panel.
- Do not place upload UI on the canvas.
- Do not build custom file lists, custom upload buttons, or custom sorting when `fileDrop` can represent the source set.
- Use `assetKind: "image"` for image-only source uploads.
- Use `assetKind: "file"` for arbitrary uploaded files.
- Image mode accepts images only by default.
- File mode accepts any file by default unless `accept` narrows extensions or MIME types.

## Empty Source State

- When upload/import is part of the source-material flow, the empty product canvas stays neutral.
- Do not invent canvas placeholder artwork, CTA copy, helper text, fake sample output, decorative placeholder, or agent-made source preset before real content exists.
- A default procedural/reference source is allowed only when the prompt or reference explicitly defines it and the worklog records the evidence.

## Image Uploads

- In single-layer apps, the runtime shows uploaded image preview and clear button in the file control.
- Clearing removes the attached source from the renderer and canvas.
- With exactly one uploaded image, image transform actions are visible immediately.
- With multiple uploaded images, users select a thumbnail first; until then transform actions are hidden.
- Once selected, transform actions apply only to that selected image.
- The FileDrop panel preview is not product canvas rendering. It keeps a stable preview frame across rotate/flip actions and contains the transformed bitmap inside that frame.
- Horizontal or vertical uploads must not be cropped by the control preview.

## Image Transform Actions

- Runtime owns image transform actions directly below image uploaders.
- Actions render through the built-in `actions` control, not through a custom image action grid.
- Use one row of three compact action buttons:
  - `90°` for rotate right;
  - `Flip H`;
  - `Flip V`.
- Keep a 6px vertical gap between uploader and action row.
- Product preview/export consumes `state.mediaAssets[].transform`.
- Do not keep separate product-only image transform state.

## Multiple Uploads And Sorting

- Use `multiple: true` when the app needs several uploaded images or files as one source set.
- Multiple image uploads render as a sortable four-column thumbnail grid.
- The add-more tile is last.
- Per-image removal stays inside the file control.
- Dragging thumbnails updates runtime media order.
- Product renderers and exports consume runtime media order instead of keeping a separate product-only order.

## File Uploads

- In file mode, uploaded files render as a sortable list with a paperclip icon, filename, remove button, and `--border/5` separators.
- Long filenames fade/truncate at the end instead of hard-clipping.
- The last item has no bottom separator.
- The add row is part of the file control and uses the same width and hover behavior as list rows.
- When an app contains both image and file uploaders, canvas drops route by asset kind:
  - image files prefer visible image uploaders;
  - non-image files prefer visible file uploaders;
  - file uploaders may accept images only when no image uploader matches.
- Product renderers filter `state.mediaAssets` by `sourceTarget`.

## Canvas Source Images

- Uploaded background/source images inside product canvases use `editable-output`.
- Uploaded source images do not change `canvas.size`.
- Setup canvas controls remain visible.
- Draw source/background images as cover/crop inside current canvas bounds without letterbox or aspect distortion.
- Scale proportionally until the current canvas bounds are fully covered, then crop overflow at canvas bounds.
- Reserve `intrinsic-media` for true media-viewer/source-native products where imported media natural dimensions intentionally own `canvas.size`, and prove that with acceptance coverage.

## Default Assets

- Use `media.defaultAssets` when an app starts with predefined files, source images, masks, symbol sets, or background images.
- Each default asset sets `sourceTarget` to the matching `fileDrop` target.
- Runtime treats these as attached files: users see them in the uploader, can remove them, and Reset restores them.
- If removal, reorder, or transforms of predefined media should survive reload, add `"media"` to `persistence.include`.
- Do not mirror the file list into product `values`.
- Do not hard-code default source files inside `canvasContent` or the renderer.

## Layers

- In multi-layer apps, deletion and visibility belong to the Layers panel.
- `fileDrop` stays an upload target.
