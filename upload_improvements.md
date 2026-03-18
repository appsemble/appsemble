# Upload improvements

## Goal

Make form-block image and video uploads feel fast by treating the original upload as the only
synchronous requirement for success.

## Problem statement

Today, image uploads can feel slow because the request path does more than accept and persist the
original file.

The current path can include:

- optional client-side image resize in the form block,
- multipart parsing to temporary files on the server,
- server-side image conversion to AVIF,
- S3 upload of the processed asset,
- waiting for all of the above before returning success.

This makes the user wait for work that is not strictly needed to confirm that the upload was
accepted.

## Objectives

- Return success as soon as the original upload is durably stored and known-valid.
- Keep the original uploaded file unchanged in S3.
- Keep originals accessible after upload, including non-image assets such as PDFs.
- Generate resized image variants lazily on first read, then cache them.
- Keep validation strong enough to reject corrupt or wrong-format files.
- Avoid tying correctness to a background worker.

## Non-goals

- Do not redesign the entire asset model in one step.
- Do not require a queue to make uploads work.
- Do not remove the possibility of client-side optimization entirely.

## Current behavior

### Form block

The form block already contains client-side image processing controls on `FileField`:

- `maxWidth`
- `maxHeight`
- `quality`
- `maxSize`

Current semantics:

- `maxWidth`, `maxHeight`, and `quality` trigger client-side image resize/re-encode before upload.
- `maxSize` is validation only. It does not trigger compression or iterative shrinking.
- The resize logic is image-only.
- This is useful for bandwidth reduction, but it changes the uploaded file before the server sees
  it.

### Server upload path

Current server behavior for resource uploads:

- parse multipart request to temp files,
- validate and persist resource/asset metadata,
- convert uploaded images to AVIF synchronously,
- upload processed asset objects to S3,
- only then return success.

### Asset serving

There is already partial lazy resize logic in the asset read path:

- requests with `width` and `height` can generate a resized variant,
- generated variants may be cached as extra assets.

However, the canonical stored object for a freshly uploaded image is still currently shaped by
upload-time processing.

## Decisions made

- Default behavior is original untouched.
- Client-side resize stays explicitly opt-in.
- Originals remain accessible after upload, including PDFs and other non-image assets.
- Synchronous validation is strict for images and lightweight for videos.
- Derivatives are rebuildable cache entries, never the source of truth.
- EXIF orientation normalization happens in derivatives only. Originals stay untouched.
- Lazy generation is enough. No asset status field is needed for derivative readiness.
- Video thumbnails remain client-generated for now. Revisit this only as future work.
- No derivative preset prewarming is planned in the initial implementation.

## Main proposal

### 1. Original-first uploads

The original uploaded file becomes the canonical source asset.

Rules:

- Always store the original file in S3 unchanged.
- Persist metadata that reflects the original file:
  - original MIME,
  - original filename,
  - original dimensions where cheaply available,
  - original size.
- Return success once:
  - the multipart payload is parsed,
  - the file passes fast sanity validation,
  - the original object is durably stored,
  - the database transaction is complete.
- Upload of the original file is part of the synchronous success path for creates and
  binary-changing updates.
- The upload should not be performed inside the SQL transaction itself.
- Do not block success on thumbnails, AVIF conversion, or derivative generation.

This makes 'upload succeeded' mean 'the original is safely stored and usable as a source'.

### 2. Fast validation before success

We should still prevent obviously invalid data from being acknowledged.

#### Images

Accept success only if we can quickly prove the upload is a valid image:

- sniff the file type from content, not only declared MIME,
- decode metadata with `sharp`,
- reject corrupt or undecodable files,
- reject empty files,
- optionally record width and height during this step.

#### Videos

Accept success only if we can quickly prove the upload is a valid video container:

- sniff content,
- verify container support as far as practical,
- reject empty or clearly invalid files,
- avoid expensive thumbnail or transcode work in the request path.

#### Validation boundary

Validation should answer:

- Is this file truly an image/video?
- Is it decodable enough to use as a source asset?

Validation should not answer:

- Are all derivatives ready?
- Is the optimal delivery format already generated?

### 3. Resize on demand

Derived image variants should be created when first requested, not at upload time.

Rules:

- Read from the original source object.
- Generate requested variants on first `width` and `height` request.
- Store the derived result in S3 under a deterministic cache key.
- Reuse the cached derivative on later requests.
- If a derivative is missing or deleted, it can be regenerated from the original.

Benefits:

- upload is faster,
- no wasted work for variants nobody requests,
- original remains available for future reprocessing,
- derivative strategy can evolve later without data loss.

### 4. Background work is optional

A queue may still be useful, but only for best-effort optimizations.

Good queue candidates:

- video thumbnails if we later move them server-side,
- backfilling missing derivatives,
- cleanup or migration jobs.

The system must remain correct when the queue is down.

## Client-side behavior

### Recommendation

Client-side resize should stay optional, not mandatory.

Reasoning:

- It reduces upload time and bandwidth for large phone photos.
- It reduces server load.
- But it changes the original file, which conflicts with the original-first model when enabled by
  default.
- It may be slow on low-end devices.
- It can change quality or metadata in ways users do not expect.

Recommended product stance:

- default behavior: upload original untouched,
- optional behavior: allow app builders to request client-side optimization.

### Existing properties

Keep and clarify the current `FileField` properties.

| Property    | Current meaning                     | Proposed meaning                             |
| ----------- | ----------------------------------- | -------------------------------------------- |
| `maxWidth`  | Client-side resize width limit      | Optional client-side resize width limit      |
| `maxHeight` | Client-side resize height limit     | Optional client-side resize height limit     |
| `quality`   | Client-side image re-encode quality | Optional client-side image re-encode quality |
| `maxSize`   | Validation limit only               | Keep as validation limit only                |

### Possible extension

If we want a clearer API later, consider adding an explicit opt-in such as:

- `clientResize: true`
- or `uploadStrategy: 'original' | 'client-optimized'`

That would avoid the current implicit behavior where `maxWidth`, `maxHeight`, or `quality`
automatically means 'modify the upload in the browser'.

For now, we do not need a schema redesign to start the server-side improvements.

## Storage model

The original object should be first-class.

Suggested principles:

- Original asset record points to the original object.
- Derived variants are cache entries, not the source of truth.
- Derived variants should be reproducible from the original.
- Deleting or regenerating derived variants must not affect the original.
- Original downloads remain supported for all asset types, including PDFs.

## Request-time flow

### Upload create/update

Proposed request flow:

1. Receive multipart payload.
2. Write incoming file to temporary storage.
3. Perform fast content validation.
4. Persist original object to S3.
5. Start a short DB transaction.
6. Create or update the DB rows.
7. Commit DB transaction.
8. Return success.
9. If the DB commit fails after upload, do best-effort cleanup of the just-uploaded S3 object.
10. Optionally enqueue best-effort follow-up work.

### Image read with resize parameters

Proposed request flow:

1. Resolve the original asset.
2. Check whether a cached derivative exists for the requested variant.
3. If yes, return cached derivative.
4. If not, generate from original, persist cache entry, return derivative.

## Cache key shape

Use a deterministic key based on immutable inputs.

Possible inputs:

- original asset id,
- requested width,
- requested height,
- fit mode,
- output format,
- quality preset,
- version marker for future algorithm changes.

This avoids cache confusion when transformation logic changes.

## Important implementation changes

### 1. Stop synchronous upload-time AVIF conversion

The current upload path should no longer convert images before acknowledging success.

### 2. Keep upload in the synchronous request path, but out of the DB transaction

For both new items and binary-changing updates, the original upload should be completed before the
request is considered successful.

However, the S3 upload should not happen inside the SQL transaction. The preferred model is:

- validate quickly,
- upload original to S3,
- open a short DB transaction,
- create or update rows,
- commit,
- if commit fails, do best-effort S3 cleanup.

This keeps business semantics strict without holding a DB transaction open during network I/O.

### 3. Keep server-side validation authoritative

Even if client-side resize or validation is enabled, the server must still validate by content.

### 4. Preserve access to the original

Clients should still be able to request or download the untouched original asset when needed.

## Risks and trade-offs

| Trade-off              | Benefit                           | Cost / risk                                   |
| ---------------------- | --------------------------------- | --------------------------------------------- |
| Store original always  | Fast success, future-proof source | Higher S3 usage                               |
| Lazy derivatives       | No wasted work on unused sizes    | First read of a new size is slower            |
| Optional client resize | Lower bandwidth when wanted       | More behavioral complexity                    |
| Fast validation only   | Better upload latency             | Some deeper issues surface later at read-time |
| Queue optional         | Simpler correctness model         | Fewer eager optimizations                     |

## Relation to existing work

This likely overlaps with `appsemble/appsemble` work item `2083`. Confirm the intended direction
there before implementation so we do not solve the same caching/resizing problem twice.

## Rollout plan

### Phase 1: Make upload success original-first

- Keep the original file in S3.
- Remove synchronous upload-time AVIF conversion from create/update flows.
- Keep fast server-side validation.
- Keep original upload in the synchronous success path, but move it out of the SQL transaction.

### Phase 2: Make original the canonical resize source

- Change asset resize reads to always use the original asset as source.
- Generate and cache derived variants deterministically.
- Keep original retrieval available.

### Phase 3: Add optional async jobs

- Add a minimal queue only for best-effort derivative work if still useful.
- Do not prewarm preset derivatives in the initial implementation.
- Keep the platform correct without the queue.

### Phase 4: Future block API cleanup

- Keep this out of the first implementation.
- Revisit whether current client-side resize semantics are clear enough.
- If needed, introduce a more explicit opt-in for browser-side optimization.
- Consider separating file-field concerns more clearly into:
  - validation constraints,
  - client-side optimization,
  - server-side source storage semantics,
  - derivative behavior such as video thumbnails.
- A future direction could be an explicit `clientResize` configuration instead of relying on
  implicit transformation through `maxWidth`, `maxHeight`, and `quality`.

## Suggested first implementation slice

Implement the smallest useful vertical slice:

1. Keep originals untouched in S3.
2. Remove synchronous upload-time image conversion.
3. Keep strict image validation and lightweight video validation.
4. Keep video thumbnails client-generated for now.
5. Make resized image requests derive from the original and cache the result.
6. Leave client-side resize behavior unchanged for now, but document it clearly.

## First implementation slice status

Status: complete locally on 2026-03-18.

Completed:

- originals are stored unchanged in S3 for create and binary-changing update flows,
- synchronous upload-time image conversion is removed from create and update paths,
- strict image validation and lightweight video validation are enforced server-side,
- resized image reads derive from the original asset and cache the generated variant,
- asset export keeps the original uploaded file instead of an upload-time derivative,
- `FileField` docs now clarify that `maxWidth`, `maxHeight`, and `quality` are optional client-side
  transforms while `maxSize` is validation-only.

Still future work:

- Phase 3 optional async jobs remain out of scope for this slice.
- Phase 4 block API cleanup remains out of scope for this slice.

## Validation slice status

Status: complete locally on 2026-03-18.

Verified:

- `packages/node-utils/uploadValidation.test.ts`
- `packages/server/controllers/main/apps/assets/createAppAsset.test.ts`
- `packages/server/controllers/common/apps/resources/createAppResource.test.ts`
- `packages/server/controllers/common/apps/resources/updateAppResource.test.ts`
- `packages/server/controllers/common/apps/resources/patchAppResource.test.ts`
- `packages/server/controllers/common/apps/resources/updateAppResources.test.ts`

Local test services used:

- PostgreSQL on `127.0.0.1:54321`
- MinIO on `127.0.0.1:9009`

Notes:

- The validation slice is done.
- The remaining work in this document is outside validation.
- Upload tests that hit S3-compatible storage need real timers during the signed request path. Fake
  timers can trigger clock-skew errors from MinIO.
- Direct API coverage now covers both valid and invalid video uploads.
- Video signature support now covers a broader common set, including 3GPP, 3GPP2, and QuickTime
  headers.
- Original image uploads are verified to remain unchanged in S3.
- Resized image derivatives are verified to be cached and reused.

Nice-to-have follow-up:

- Add more edge-case video signatures in `packages/node-utils/uploadValidation.ts` if real-world
  samples require them.
