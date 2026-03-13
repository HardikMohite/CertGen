export const pixelToPercent = (x, y, imageWidth, imageHeight) => ({
  x_percent: (x / imageWidth) * 100,
  y_percent: (y / imageHeight) * 100,
});

export const percentToPixel = (xPercent, yPercent, imageWidth, imageHeight) => ({
  pixelX: (xPercent / 100) * imageWidth,
  pixelY: (yPercent / 100) * imageHeight,
});