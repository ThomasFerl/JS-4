// myShapes.js
import { Tensor } from "./myTensor.js";

export function drawCircleToTensor(canvasId, radius) 
{
  const canvas = document.getElementById(canvasId);
  const ctx = canvas.getContext("2d");

  // Hintergrund weiß
  ctx.fillStyle = "white";
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // Kreis schwarz
  ctx.fillStyle = "black";
  ctx.beginPath();
  ctx.arc(canvas.width/2, canvas.height/2, radius, 0, 2*Math.PI);
  ctx.fill();

  // Pixel auslesen
  const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
  const pixels = imageData.data;

  // Tensor erzeugen
  const tensor = new Tensor([canvas.height, canvas.width]);

  for (let y = 0; y < canvas.height; y++) {
    for (let x = 0; x < canvas.width; x++) {
      const idx = (y * canvas.width + x) * 4;
      const r = pixels[idx];
      const g = pixels[idx+1];
      const b = pixels[idx+2];
      const gray = (r + g + b) / 3 / 255.0;
      tensor.set(y, x, gray);
    }
  }

  return tensor;
}
