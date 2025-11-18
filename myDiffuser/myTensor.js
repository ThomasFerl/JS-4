// Unsere eigene Tensor-Klasse
export class Tensor 
{
  constructor(shape, data = null) 
  {
    this.shape = shape;                             // z.B. [50, 50] für ein Bild
    const size = shape.reduce((a, b) => a * b, 1);  // Gesamtanzahl Elemente
    this.data  = data || new Float32Array(size);    // Speicher für Werte
  }

  // Zugriff auf ein Element (2D Beispiel)
  get(i, j) 
  {
    const index = i * this.shape[1] + j;
    return this.data[index];
  }

  set(i, j, value) {
    const index = i * this.shape[1] + j;
    this.data[index] = value;
  }

  // Fülle den Tensor mit Zufallswerten (z.B. für Rauschen)
  fillRandom() 
  {
    for (let i = 0; i < this.data.length; i++) { this.data[i] = Math.random(); } // Werte zwischen 0 und 1
    
  }
}


// Beispiel: Erzeuge ein 50x50 Bild-Tensor
const img = new Tensor([50, 50]);
img.fillRandom();

console.log("Pixelwert an (10,10):", img.get(10, 10));





// Mische Bild mit Rauschen
export function addNoise(tensor, noiseLevel = 0.5) 
{
  const noisy = new Tensor(tensor.shape);

  for (let i = 0; i < tensor.data.length; i++) 
  {
    const pixel   = tensor.data[i];
    const noise   = Math.random(); // Zufallswert [0,1]
    noisy.data[i] = (1 - noiseLevel) * pixel + noiseLevel * noise;
  }

  return noisy;
}





export function tensorToCanvas(tensor, canvasId) 
{
  const canvas = document.getElementById(canvasId);
  const ctx    = canvas.getContext("2d");
  const width  = tensor.shape[1];
  const height = tensor.shape[0];

  // Neues ImageData erzeugen
  const imageData = ctx.createImageData(width, height);

  for (let y = 0; y < height; y++) 
  {
    for (let x = 0; x < width; x++) 
    {
      const idx = (y * width + x) * 4;
      const gray = tensor.get(y, x); // Wert zwischen 0 und 1

      const value = Math.floor(gray * 255); // zurück zu [0..255]
      imageData.data[idx]     = value; // R
      imageData.data[idx + 1] = value; // G
      imageData.data[idx + 2] = value; // B
      imageData.data[idx + 3] = 255;   // Alpha
    }
  }

  // Bild ins Canvas schreiben
  ctx.putImageData(imageData, 0, 0);
}



// noiseAnimation.js
export function animateNoise(tensor, canvasId, steps = 10, delay = 500) 
{
  let currentStep = 0;

  function step() 
  {
    const noiseLevel  = currentStep / steps; // von 0 bis 1
    const noisyTensor = addNoise(tensor, noiseLevel);
    tensorToCanvas(noisyTensor, canvasId);

    currentStep++;
    if (currentStep <= steps) { setTimeout(step, delay);  }// nächsten Schritt nach "delay" ms
    
  }

  step();
}

