# VITON-HD integration

## What changed

FitLens now has a browser-side integration boundary in `src/lib/viton.ts` and a complete upload flow in `src/app/pages/StylePage.tsx`:

- The user uploads one person photo or video and one garment photo.
- Person photos support JPG, PNG, and WebP up to 12 MB; person videos support MP4, WebM, and MOV up to 80 MB.
- For video input, the browser extracts the first frame because VITON-HD is an image model, not a video model.
- The client sends both files as multipart form data to `VITE_VITON_API_URL`.
- A successful response displays the returned 2D image and hands it to the existing fit page.
- `src/app/pages/TryOnPage.tsx` keeps the exact measurements tab available, and overlays the generated result while the user adjusts the proportional 3D preview.

`src/app/App.tsx` owns the short-lived result URL and routes the user from Style Creator to the fit profile.

## Important model limitation

The `shadow2496/VITON-HD` repository generates a 2D virtual try-on image. It does not generate a 3D human mesh, garment mesh, depth map, or rig. FitLens therefore keeps its existing Three.js proportional mannequin for editable 3D measurements and uses the VITON-HD image as a visual reference. A true fitted 3D garment requires a separate 3D body/garment reconstruction service.

## Running the integration

1. Start the VITON-HD inference service outside the Vite app. The upstream repository's `test.py` is a command-line inference script and requires its checkpoints, dataset preprocessing, and a CUDA-capable PyTorch environment.
2. Expose an HTTP endpoint that accepts `multipart/form-data` fields named `person` and `garment`.
3. Return JSON in this shape:

```json
{ "resultUrl": "https://your-storage/result.png", "jobId": "optional-job-id" }
```

4. Copy `.env.example` to `.env.local` and set `VITE_VITON_API_URL` to the service endpoint.
5. Run `npm run dev`.

The result URL should be a browser-readable URL. For production, put the service behind authentication and validate ownership before returning result URLs. Do not put PyTorch, model checkpoints, or service credentials in the Vite client.

## Files

| File | Responsibility |
| --- | --- |
| `src/lib/viton.ts` | Input validation and HTTP contract for the inference service |
| `src/app/pages/StylePage.tsx` | Person/garment upload, generation state, and result display |
| `src/app/pages/TryOnPage.tsx` | Existing measurement controls and editable 3D preview; displays the 2D result reference |
| `src/app/App.tsx` | Passes the generated result between authenticated pages |
| `.env.example` | VITON endpoint configuration template |
| `docs/viton-integration.md` | Setup, model limitations, and API contract |