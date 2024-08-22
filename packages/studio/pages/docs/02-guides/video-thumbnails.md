# Video Thumbnails Generation

In Appsemble, thumbnails are automatically generated when a video is uploaded using the form block
and a `resource.create`, `resource.update` or `resource.patch` action.

## Process

The thumbnail is generated on the client using a video tag by taking the first frame of the uploaded
video file. The generated `.png` file is added to the form payload with its name being in the format
`<video-file-name>-thumbnail.png`.

On the backend, the thumbnail is processed along with other assets and is associated with the
resource created by the resource action.

## Usage

The generated thumbnail is used in the `list` and `detail-viewer` blocks. Check their documentation
for further details.
