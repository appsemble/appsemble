# Qr-Scan

A simple block that creates a video element, which streams the camera, and allows for QR-code
detection within this video element. Once a QR-code has been detected. Emits event `foundQr` which
holds only the QR URL as data.

## Parameters:

- `drawQr` (optional true/false) Whether detected QR-codes are highlighted with a red square.
- `videoHeight` (optional number) Height of the video that displays the camera-stream.
- `videoWidth` (optional number) Width of the video that displays the camera-stream.

## Events:

- Emits `foundQr` event upon detected a QR-code. foundQr event holds the QR URL as data.

## Dependencies

Relies on [jsQR](https://github.com/cozmo/jsQR) by `Cosmo Wolfe`.

## Images

![qr-scan_res](https://github.com/Redhot-Development/appsemble/blob/RedHotDev/config/assets/qr-scan_res.jpg)

![qr-scan_res2](https://github.com/Redhot-Development/appsemble/blob/RedHotDev/config/assets/qr-scan_res2.jpg)

Pictures above shows video stream. The text below is a text element that shows the content of the
`foundQr` event.

## Created by:

[Fontys ICT students](https://fontys.edu/Bachelors-masters/Bachelors/Information-Communication-Technology-Eindhoven.htm)
in collaboration with Appsemble
