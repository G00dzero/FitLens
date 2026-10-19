# Video-to-3D body integration

## Workflow

The Try-On page now follows this order:

1. The user uploads a short full-body video.
2. FitLens validates the file and sends it as multipart field `video` to `VITE_BODY_3D_API_URL`.
3. The body service reconstructs a 3D human model and returns a browser-readable glTF or GLB URL.
4. Three.js loads that model into the preview.
5. The S/M/L and exact measurement controls become available.
6. The user saves the fit and continues to garment selection and VITON-HD.

## Service contract

Request:

```text
POST multipart/form-data
video=<body video>
```

Response:

```json
{
  "modelUrl": "https://storage.example/body.glb",
  "previewUrl": "https://storage.example/body-preview.png",
  "jobId": "optional-job-id"
}
```

`modelUrl` is required and must be accessible by the browser. `previewUrl` is optional and is shown as a subtle loading/reference image. The service should authenticate the request, validate ownership, and return signed or otherwise protected URLs in production.

## Custom measurements

The controls are deliberately locked until a model is returned, so users do not edit a placeholder before the scan is ready. The current Three.js integration applies the selected height scale and uses the measurement-driven proportional preview as a fallback when no generated model exists. A production body service should return a rigged model with blend shapes or measurement parameters if waist, bust, shoulder, and hip edits need to deform the scanned geometry rather than only update fit metadata.

The current client does not claim that VITON-HD performs this body reconstruction. VITON-HD remains the later 2D garment try-on step and requires its own separate inference service.

## Garment and merge stages

After the body model is saved, FitLens opens the Style workspace. The user can open the separate garment page and upload either:

- A GLB or glTF garment model, which can be used directly.
- A JPG, PNG, or WebP garment image, which is sent to `VITE_GARMENT_3D_API_URL` for 3D reconstruction.

When both model URLs are available, the Style workspace sends them to `VITE_MERGE_3D_API_URL`. That service returns the final combined model URL shown in the Style workspace.

VITON-HD can still be used as an optional 2D visual try-on comparison, but it cannot create the 3D garment or merge two 3D meshes. Those responsibilities belong to the garment reconstruction and merge services.