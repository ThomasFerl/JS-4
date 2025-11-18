// train.js
import { LinearLayer } from "./myLayer.js";
import { mseLoss }     from "./myLayer.js";
import { Tensor }      from "./myTensor.js";
import { addNoise }    from "./myTensor.js";


export function trainDummy(epochs = 10, learningRate = 0.01) 
{
  // Dummy-Bild: Kreis im Tensor
  const tensor = new Tensor([50, 50]);
  tensor.fillRandom(); // später ersetzt durch drawCircleToTensor()

  const inputSize = tensor.data.length;
  const model     = new LinearLayer(inputSize, inputSize);

  for (let epoch = 0; epoch < epochs; epoch++) 
  {
    // 1. Rauschen hinzufügen
    const noisyTensor = addNoise(tensor, 0.5);

    // 2. Ziel = das echte Rauschen (Differenz)
    const target = new Float32Array(inputSize);
    for (let i = 0; i < inputSize; i++) target[i] = noisyTensor.data[i] - tensor.data[i];
    
    // 3. Vorwärtsdurchlauf
    const pred = model.forward(noisyTensor.data);

    // 4. Loss berechnen
    const { loss, grad } = mseLoss(pred, target);

    // 5. Rückwärtsdurchlauf
    model.backward(grad, learningRate);

    console.log(`Epoch ${epoch}: Loss = ${loss.toFixed(6)}`);
  }

  return model;
}
