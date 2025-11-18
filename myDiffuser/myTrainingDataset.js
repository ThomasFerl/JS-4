// dataset.js
import { Tensor } from "./myTensor.js";

// Hilfsfunktion: Zufallszahl im Bereich [min, max]
function rand(min, max) 
{
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

// Zeichnet ein zufälliges Shape ins Canvas und gibt Tensor zurück
export function randomShapeToTensor(canvasId) 
{
  const canvas = document.getElementById(canvasId);
  const ctx    = canvas.getContext("2d");

  // Hintergrund weiß
  ctx.fillStyle = "white";
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // Zufällige Farbe (schwarz oder grau)
  ctx.fillStyle = "black";

  // Zufällige Form wählen
  const shapeType = rand(0, 4); // 0=Kreis, 1=Rechteck, 2=Dreieck, 3=Linie, 4=Ellipse

  ctx.beginPath();

  switch (shapeType) 
  {
    case 0: // Kreis
      ctx.arc(rand(10,40), rand(10,40), rand(5,15), 0, 2*Math.PI);
      ctx.fill();
    break;
  
    case 1: // Rechteck
      ctx.fillRect(rand(0,30), rand(0,30), rand(10,20), rand(10,20));
    break;

    case 2: // Dreieck
      ctx.moveTo(rand(0,50), rand(0,50));
      ctx.lineTo(rand(0,50), rand(0,50));
      ctx.lineTo(rand(0,50), rand(0,50));
      ctx.closePath();
      ctx.fill();
    break;

    case 3: // Linie
      ctx.moveTo(rand(0,50), rand(0,50));
      ctx.lineTo(rand(0,50), rand(0,50));
      ctx.stroke();
    break;

    case 4: // Ellipse
      ctx.ellipse(rand(10,40), rand(10,40), rand(5,15), rand(5,15), 0, 0, 2*Math.PI);
      ctx.fill();
    break;
  }

  // Pixel auslesen
  const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
  const pixels    = imageData.data;

  // Tensor erzeugen
  const tensor = new Tensor([canvas.height, canvas.width]);

  for (let y = 0; y < canvas.height; y++) 
  {
    for (let x = 0; x < canvas.width; x++) 
    {
      const idx  = (y * canvas.width + x) * 4;
      const r    = pixels[idx];
      const g    = pixels[idx+1];
      const b    = pixels[idx+2];
      const gray = (r + g + b) / 3 / 255.0;
      
      tensor.set(y, x, gray);
    }
  }

  return { tensor, label: shapeType };
}
