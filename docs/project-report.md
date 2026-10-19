# FitLens Project Report

## 1. Project Overview

FitLens is a web application for exploring virtual clothing fit. Its current experience combines user authentication, fit-profile measurements, a video-to-3D-body service contract, a Three.js preview, style-image uploads, and a planned connection to an external VITON-HD inference service.

The project is in an active prototype stage. The interface and core data flow are implemented, while the production-grade computer-vision pipeline, true 3D garment reconstruction, persistent generated media, and broader validation are still being researched.

This report describes the project from its initial repository state to the current implementation snapshot. The repository currently contains one recorded Git commit, so exact dates for each feature milestone cannot be reconstructed from Git history. The milestone descriptions below are therefore based on the source code and configuration currently in the project.

## 2. Project Starting Point

The initial project was created as a Vite-powered React application. The first repository commit established the main frontend structure, Firebase configuration, styling system, authentication screens, fit pages, URL-safety utilities, and the initial test setup.

The original product direction was a virtual try-on experience where a user could:

- Enter a fit profile.
- Select a preset size or provide exact measurements.
- View an approximate 3D body and garment preview.
- Save fit information to a personal account.
- Review previous try-on records.
- Upload style images through the Style page.

The current repository history records the initial commit only. Subsequent development, including the VITON-HD browser integration described below, should be committed as separate milestones in the public GitHub repository so the project history becomes easier to audit.

## 3. Current Technology Stack

### Application framework and language

- **React 18** provides the component-based user interface.
- **TypeScript** provides static typing for pages, components, Firebase data, measurements, and inference responses.
- **Vite** provides local development, module bundling, and the production build.
- **Tailwind CSS 4** provides utility-based styling.
- **Motion** provides page transitions and interaction animation.

### 3D and interaction tools

- **Three.js** renders the current interactive proportional mannequin.
- **OrbitControls** supplies camera interaction for the 3D preview.
- **Lucide React** supplies interface icons.
- **Radix UI, Material UI, and supporting packages** are installed for reusable interface primitives. Some of these packages are available for future refinement and are not all central to the current rendered flows.

### Testing and development tools

- **Vitest** runs the automated tests.
- **jsdom** supplies a browser-like environment for utility tests.
- **TypeScript compiler and Vite build** provide the current production validation command.
- Main commands are defined in `package.json`:

```text
npm run dev
npm run build
npm test -- --run
npm run preview
```

## 4. Database, Authentication, and Cloud Services

FitLens currently uses the Firebase JavaScript SDK.

### Firebase tools in use

- **Firebase Authentication** manages user identity.
- **Anonymous authentication** allows a visitor to use the app without registering immediately.
- **Email/password authentication** is available through the login and registration modal.
- **Firebase Realtime Database** stores user-scoped fit profiles and try-on records.
- **Firebase security rules** restrict reads and writes to the authenticated owner of each `users/{uid}` path.
- The configured Firebase project is `fitlens-bf542`.

### Current data model

Fit profile data is stored under:

```text
users/{uid}/profile
```

Try-on metadata is stored under:

```text
users/{uid}/tryOns/{tryOnId}
```

The saved profile includes sizing mode, selected preset, measurements, and update time. Try-on records include measurements, fit estimate, rotation, and creation time.

### Firebase limitations in the current prototype

- Firebase Storage is not currently initialized in the application.
- Generated VITON images are passed between pages temporarily and are not yet stored in try-on history.
- Production media storage, signed URLs, retention, deletion, and ownership checks still need to be designed.
- Anonymous users may need an account migration strategy if their browser session is lost or upgraded.

## 5. VITON-HD Integration

The project references the external `shadow2496/VITON-HD` repository as a research and inference dependency. The current FitLens code does not bundle the PyTorch model, checkpoints, or a Python server. Instead, it defines a browser-to-service contract.

### Important VITON-HD points

- **VITON-HD is an image-based virtual try-on model.** It produces a 2D synthesized try-on image.
- **It is not a 3D body or garment reconstruction system.** It does not directly provide a mesh, rig, depth map, or cloth simulation.
- **The external inference service requires a separate environment.** The upstream repository uses Python/PyTorch and typically requires model checkpoints, preprocessing, and suitable GPU resources.
- **FitLens uploads a person input and garment image.** Person photos are accepted directly; videos are converted to a first-frame image in the browser because VITON-HD is not a video model.
- **The browser client sends multipart form data** using the fields `person` and `garment`.
- **The expected response is JSON** containing a browser-readable `resultUrl` and an optional `jobId`.
- **The generated 2D result is shown as a reference** while the existing Three.js proportional preview remains the editable 3D approximation.

The client-side implementation is in `src/lib/viton.ts`. The upload and result interface is in `src/app/pages/StylePage.tsx`. The handoff to custom measurements is coordinated by `src/app/App.tsx` and displayed in `src/app/pages/TryOnPage.tsx`.

The setup contract and limitations are documented separately in `docs/viton-integration.md`.

## 6. Current Product Progress

### Foundation completed

- Vite and React application structure established.
- TypeScript configuration and production build established.
- Responsive page layout and theme system established.
- Authenticated and unauthenticated navigation paths established.
- Firebase Authentication and Realtime Database connected.
- UID-scoped database rules added.

### Fit-profile experience completed

- S, M, and L sizing presets added.
- Exact height, waist, shoulder, bust, hip, and weight fields added.
- Fit estimate calculated from the entered measurements.
- Scroll-wheel preset selection added.
- Preview rotation control added.
- Three.js proportional mannequin added.
- Profile and try-on metadata persistence added.
- History page added for saved try-on records.

### Style and VITON integration completed at prototype level

- Person photo upload added.
- Person video upload added with first-frame extraction.
- Garment image upload added.
- File type and file size validation added.
- Configurable `VITE_VITON_API_URL` added.
- Multipart request contract added.
- Generated result display added.
- Custom measurement handoff preserved after generation.
- Integration documentation added.

### Video-to-3D body workflow completed at integration level

- Body video upload added to the Try-On page.
- MP4, WebM, and MOV validation added with a 100 MB limit.
- Configurable `VITE_BODY_3D_API_URL` added.
- glTF/GLB model response contract added.
- Three.js glTF loading added.
- Custom measurements remain locked until a generated model is returned.
- Body reconstruction service documentation added.

### Security and reliability work completed

- Redirect, query-string, and hash parameter sanitization utilities added.
- Tests cover the current URL-hardening utilities.
- Firebase Realtime Database rules restrict access by authenticated user ID.
- Content Security Policy configuration is present in `index.html`.
- Upload inputs reject unsupported file types and oversized files before inference.

## 7. Prototype and Research Areas

Several parts of the product are intentionally still experimental. They should be described as prototypes rather than production guarantees.

- **True 3D virtual try-on:** The current mannequin is procedural and proportional. A future system may use body reconstruction, a 3D avatar, garment meshes, rigging, or cloth simulation.
- **Body reconstruction service:** The browser workflow is implemented, but the actual video-to-3D service, model choice, pose reconstruction, calibration, storage, and deployment are still external research work.
- **Garment reconstruction and merging:** Style now has separate service contracts for direct 3D garment upload, image-to-garment reconstruction, and body-garment merging. The external services and their mesh-fitting quality remain under research.
- **VITON-HD deployment:** The browser contract exists, but the external inference service, model checkpoints, preprocessing pipeline, authentication, queueing, and deployment are not included in this repository.
- **Video processing:** The current implementation uses only the first frame. Temporal video fitting and movement-aware rendering remain under research.
- **Fit estimation:** The current score is a heuristic comparison against hard-coded size presets. It is not a medically or commercially validated sizing model.
- **Garment combination:** The existing Style page currently targets a person-plus-garment workflow. Multi-garment composition and layering are future work.
- **Media persistence:** Generated images are not yet attached to Firebase history records.
- **Automated UI testing:** The current automated tests focus on URL and parameter utilities. Upload behavior, Firebase flows, inference responses, and 3D rendering need dedicated tests.
- **Performance optimization:** The production build currently reports a large JavaScript bundle because of the Three.js and UI dependency graph. Code splitting and dependency reduction may improve load time.
- **UX and accessibility refinement:** The interface is functional, but additional keyboard, screen-reader, loading, error, and mobile-flow testing is still needed.

More tools may be added as these areas mature. Potential additions include a dedicated inference API, a job queue, Firebase Storage or another object store, image preprocessing services, 3D body reconstruction, model monitoring, analytics, and expanded automated testing.

## 8. Current Architecture Summary

```text
React + TypeScript + Vite frontend
              |
              +--> Firebase Auth
              |
              +--> Firebase Realtime Database
              |       +--> user profile
              |       +--> try-on metadata/history
              |
              +--> VITON-HD inference service contract
                      +--> person photo or first video frame
                      +--> garment image
                      +--> 2D result URL

Three.js proportional preview remains local in the browser.
```

## 9. Recommended Next Milestones

1. Add the VITON-HD Python inference service in a separate deployment or service directory with pinned dependencies.
2. Add authentication and request ownership checks to the inference service.
3. Add Firebase Storage or an equivalent object store for input and output media.
4. Persist inference job status, result URL, model version, and failure details in the database.
5. Add contract tests for the inference endpoint and component tests for upload states.
6. Replace first-frame video handling with a deliberate frame-selection workflow.
7. Evaluate a genuine 3D body and garment reconstruction approach.
8. Split the production bundle and measure loading performance.
9. Commit future work as focused Git milestones so project progress is visible in the public repository.

## 10. Documentation Index

- `docs/project-report.md`: this project history, architecture, tools, progress, and research status.
- `docs/viton-integration.md`: VITON-HD service contract and setup instructions.
- `docs/body-3d-integration.md`: video-to-3D body service contract and measurement workflow.
- `docs/url-hardening.md`: URL and parameter safety behavior.
- `.env.example`: local environment variable template.