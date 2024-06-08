"use strict";

function DFT(signal) {
  function FixDecimal(n) {
    return +(n.toFixed(3));
  }

  let N = signal.length;
  let xks = [];

  for (var i = 0; i < N; i++) {
    let x = new ComplexNumber(0, 0);
    for (var n = 0; n < N; n++) {
      let exp = -(2 * Math.PI * n * (i / N));
      let eulersForm = new ComplexNumber(Math.cos(exp), Math.sin(exp));
      x = x.add(eulersForm.multScalar(signal[n]));
    }

    xks[i] = new ComplexNumber(FixDecimal(x.real), FixDecimal(x.imag));
  }

  return xks;
}

function IDFT(signal) {
  function FixDecimal(n) {
    return +(n.toFixed(3));
  }

  let N = signal.length;
  let xks = [];

  for (var i = 0; i < N; i++) {
    let x = new ComplexNumber(0, 0);
    for (var n = 0; n < N; n++) {
      let exp = (2 * Math.PI * n * (i / N));
      let eulersForm = new ComplexNumber(Math.cos(exp), Math.sin(exp));
      x = x.add(eulersForm.mult(signal[n]));
    }

    xks[i] = new ComplexNumber(FixDecimal(x.real / N), FixDecimal(x.imag / N));
  }

  return xks.map((xk) => xk.real);
}

function MakeGaussianKernel(pixel_radius) {
  // MakeGaussianKernel(1) will make a 3x3 grid,
  // MakeGaussianKernel(2) will make a 5x5 grid, and so on

  let min = -pixel_radius;
  let max =  pixel_radius;

  let kernel = [];
  let sum = 0;
  for (var y = min; y <= max; y++) {
    kernel.push([]);
    for (var x = min; x <= max; x++) {
      let e = Math.exp(-(Math.pow(y, 2) / (pixel_radius * 2) +
                         Math.pow(x, 2) / (pixel_radius * 2)));
      kernel[y + max][x + max] = e;
      sum += e;
    }
  }

  for (y = min; y <= max; y++) {
    for (x = min; x <= max; x++) {
      kernel[y + max][x + max] /= sum;
    }
  }

  return kernel;
}

function ReverseKernel(kernel) {
  let newKernel = [];
  for (var z = 0; z < kernel.length; z++) {
    newKernel.push([]);
  }

  for (var y = 0; y < kernel.length; y++) {
    for (var x = 0; x < kernel.length; x++) {
      newKernel[x][y] = kernel[y][x];
    }
  }

  return newKernel;
}

function CopyPixelsToImageData(srcPixels, destPixels) {
  for (var i = 0; i < srcPixels.length; i++) {
    destPixels[i] = srcPixels[i];
  }
}

function GrayscalePixels(pixels) {
  function GammaExpansion(channel) {
    channel /= 255;
    return (channel <= 0.04045)
           ? channel / 12.92
           : Math.pow((channel + 0.055) / 1.055, 2.4);
  }

  function GammaCompression(channel) {
    channel = (channel <= 0.0031308)
              ? channel * 12.92
              : 1.055 * Math.pow(channel, 1.0/2.4) - 0.055;
    return channel * 255;
  }

  for (var i = 0; i < pixels.data.length; i += 4) {
    let linearLuminance = (GammaExpansion(pixels.data[i])   * 0.2126) +
                          (GammaExpansion(pixels.data[i+1]) * 0.7156) +
                          (GammaExpansion(pixels.data[i+2]) * 0.0722);

    let standardRGB = GammaCompression(linearLuminance);

    pixels.data[i]   = standardRGB;
    pixels.data[i+1] = standardRGB;
    pixels.data[i+2] = standardRGB;
  }
}

function Convolve(pixels, kernel) {
  function NotWithin(n, lowerBound, upperBound) {
    return (n < lowerBound || n > upperBound);
  }

  kernel = ReverseKernel(kernel);
  let min = -Math.floor(kernel.length / 2);
  let max =  Math.floor(kernel.length / 2);
  let colorChannels = 4;
  let rowWidth = pixels.width * colorChannels;
  let output = [];

  for (var i = 0; i < pixels.data.length; i += 4) {
    let redChannel   = 0;
    let greenChannel = 0;
    let blueChannel  = 0;

    let leftHorizontalBound  = Math.floor(i / rowWidth) * rowWidth;
    let rightHorizontalBound = leftHorizontalBound + (rowWidth - 1);
    for (var y = min; y <= max; y++) {
      for (var x = min; x <= max; x++) {
        let yOffset = (y * rowWidth);
        let xOffset = (x * colorChannels);

        if (NotWithin(i + xOffset, leftHorizontalBound, rightHorizontalBound)) {
          xOffset *= -1;
        }
        if (NotWithin(i + yOffset, 0, pixels.data.length - 1)) {
          yOffset *= -1;
        }

        let redIdx = i + yOffset + xOffset;

        redChannel   += (pixels.data[redIdx])     * kernel[y + max][x + max];
        greenChannel += (pixels.data[redIdx + 1]) * kernel[y + max][x + max];
        blueChannel  += (pixels.data[redIdx + 2]) * kernel[y + max][x + max];
      }
    }

    output[i]   = redChannel;
    output[i+1] = greenChannel;
    output[i+2] = blueChannel;
    output[i+3] = 255;
  }

  return output;
}

function CanvasSrcToDest() {
  let SrcCan  = document.getElementById("source");
  let SrcCtx  = SrcCan.getContext("2d");
  let SrcImg = SrcCtx.getImageData(0, 0, SrcCan.width, SrcCan.height);
  let DestCan = document.getElementById("destination");
  let DestCtx = DestCan.getContext("2d");
  let DestImg = DestCtx.getImageData(0, 0, DestCan.width, DestCan.height);

  for (var i = 0; i < SrcImg.data.length; i += 4) {
    DestImg.data[i]   = SrcImg.data[i];
    DestImg.data[i+1] = SrcImg.data[i+1];
    DestImg.data[i+2] = SrcImg.data[i+2];
  }

  DestCtx.putImageData(DestImg, 0, 0);
}

function CanvasColorInversion() {
  let SrcCan  = document.getElementById("source");
  let SrcCtx  = SrcCan.getContext("2d");
  let SrcImg = SrcCtx.getImageData(0, 0, SrcCan.width, SrcCan.height);
  let DestCan = document.getElementById("destination");
  let DestCtx = DestCan.getContext("2d");
  let DestImg = DestCtx.getImageData(0, 0, DestCan.width, DestCan.height);

  for (var i = 0; i < SrcImg.data.length; i += 4) {
    DestImg.data[i]   = 255 - SrcImg.data[i];
    DestImg.data[i+1] = 255 - SrcImg.data[i+1];
    DestImg.data[i+2] = 255 - SrcImg.data[i+2];
  }

  DestCtx.putImageData(DestImg, 0, 0);
}

function CanvasGrayscale() {
  let SrcCan  = document.getElementById("source");
  let SrcCtx  = SrcCan.getContext("2d");
  let SrcImg = SrcCtx.getImageData(0, 0, SrcCan.width, SrcCan.height);
  let DestCan = document.getElementById("destination");
  let DestCtx = DestCan.getContext("2d");
  let DestImg = DestCtx.getImageData(0, 0, DestCan.width, DestCan.height);

  GrayscalePixels(SrcImg);

  DestCtx.putImageData(SrcImg, 0, 0);
}

function CanvasGaussianBlur() {
  let SrcCan  = document.getElementById("source");
  let SrcCtx  = SrcCan.getContext("2d");
  let SrcImg = SrcCtx.getImageData(0, 0, SrcCan.width, SrcCan.height);
  let DestCan = document.getElementById("destination");
  let DestCtx = DestCan.getContext("2d");

  let output = Convolve(SrcImg, MakeGaussianKernel(1));
  CopyPixelsToImageData(output, SrcImg.data);

  DestCtx.putImageData(SrcImg, 0, 0);
}

function CanvasSobelEdgeDetection() {
  let SrcCan  = document.getElementById("source");
  let SrcCtx  = SrcCan.getContext("2d");
  let SrcImg = SrcCtx.getImageData(0, 0, SrcCan.width, SrcCan.height);
  let DestCan = document.getElementById("destination");
  let DestCtx = DestCan.getContext("2d");

  let kernelX = [[-1, -2, -1],
                 [ 0,  0,  0],
                 [ 1,  2,  1]];
  let kernelY = [[-1,  0,  1],
                 [-2,  0,  2],
                 [-1,  0,  1]];

  GrayscalePixels(SrcImg);
  let xOutput = Convolve(SrcImg, kernelX);
  let yOutput = Convolve(SrcImg, kernelY);
  let output = [];

  for (var i = 0; i < xOutput.length; i++) {
    output[i] = Math.sqrt(Math.pow(xOutput[i], 2) +
                          Math.pow(yOutput[i], 2));
  }

  CopyPixelsToImageData(output, SrcImg.data);
  DestCtx.putImageData(SrcImg, 0, 0);
}

function CanvasLaplacianEdgeDetection() {
  let SrcCan  = document.getElementById("source");
  let SrcCtx  = SrcCan.getContext("2d");
  let SrcImg = SrcCtx.getImageData(0, 0, SrcCan.width, SrcCan.height);
  let DestCan = document.getElementById("destination");
  let DestCtx = DestCan.getContext("2d");

  let kernel = [[1,   4, 1],
                [4, -20, 4],
                [1,   4, 1]];

  GrayscalePixels(SrcImg);
  let output = Convolve(SrcImg, kernel);
  CopyPixelsToImageData(output, SrcImg.data);

  DestCtx.putImageData(SrcImg, 0, 0);
}

let options = [
  { name: "No Processing", fn: CanvasSrcToDest },
  { name: "Gaussian Blur", fn: CanvasGaussianBlur },
  { name: "Color Inversion", fn: CanvasColorInversion },
  { name: "Grayscale", fn: CanvasGrayscale },
  { name: "Edge Detection (Sobel)", fn: CanvasSobelEdgeDetection },
  { name: "Edge Detection (Laplacian)", fn: CanvasLaplacianEdgeDetection }
]

function BuildSelectOptions() {
  let select = document.getElementById("algo-select");
  for (var i = 0; i < options.length; i++) {
    let option = document.createElement("option");
    option.value = i;
    option.text = options[i].name;
    select.append(option);
  }
}

function OnSelectChange(e) {
  let selectedOption = parseInt(e.target.value);
  options[selectedOption].fn();
}

function OnInputChange(e) {
  function ResetAlgorithmSelect() {
    document.getElementById("algo-select").value = "0";
  }

  function PopulateCanvases(img) {
    let SrcCan  = document.getElementById("source");
    let SrcCtx  = SrcCan.getContext("2d");
    let DestCan = document.getElementById("destination");
    let DestCtx = DestCan.getContext("2d");

    SrcCtx.drawImage(img, 0, 0);
    DestCtx.drawImage(img, 0, 0);
    ResetAlgorithmSelect();
  }

  function CreateImage() {
    let img = new Image();
    img.onload = () => PopulateCanvases(img);
    img.src = fr.result;
  }

  let file = e.target.files[0];
  var fr = new FileReader();
  fr.onload = CreateImage;
  fr.readAsDataURL(file);
}

document.querySelector("input").onchange = OnInputChange;
document.querySelector("select").onchange = OnSelectChange;

BuildSelectOptions();
