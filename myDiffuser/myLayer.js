// Beispiel: ein einfaches Lineares Layer
export class LinearLayer 
/*
forward : multipliziert Eingabe mit Gewichten → Ausgabe.
backward: berechnet die Gradienten und passt die Gewichte an.
Das ist die Basis für Backpropagation in reinem JS.
*/
{
  constructor(inputSize, outputSize) 
  {
    this.weights    = new Float32Array(inputSize * outputSize).map(() => Math.random() * 0.01);
    this.biases     = new Float32Array(outputSize).map(() => 0);
    this.inputSize  = inputSize;
    this.outputSize = outputSize;
  }

  forward(input) 
  {
    const output = new Float32Array(this.outputSize);
    for (let j = 0; j < this.outputSize; j++) 
    {
      let sum = this.biases[j];
      for (let i = 0; i < this.inputSize; i++)  sum += input[i] * this.weights[j * this.inputSize + i];
      output[j] = sum;
    }
    this.lastInput  = input;
    this.lastOutput = output;
    return output;
  }

  backward(gradOutput, learningRate) 
  {
    const gradInput = new Float32Array(this.inputSize);
    for (let j = 0; j < this.outputSize; j++) 
    {
       for (let i = 0; i < this.inputSize; i++) 
       {
          const gradW                            = gradOutput[j] * this.lastInput[i];
           this.weights[j * this.inputSize + i] -= learningRate  * gradW;
           gradInput[i]                         += gradOutput[j] * this.weights[j * this.inputSize + i];
        }
      this.biases[j] -= learningRate * gradOutput[j];
    }
    return gradInput;
  }
}



export function mseLoss(pred, target) 
{
  let sum = 0;
  const grad = new Float32Array(pred.length);
  for (let i = 0; i < pred.length; i++) 
  {
    const diff     = pred[i] - target[i];
          sum     += diff * diff;
          grad[i]  = 2 * diff;               // Ableitung für Backprop
  }
  return { loss: sum / pred.length, grad };
}

