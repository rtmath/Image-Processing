"use strict";

function CopyPixels(srcPixels, destPixels) {
  for (var i = 0; i < srcPixels.length; i++) {
    destPixels[i] = srcPixels[i];
  }
}

function GaussianBlur(imgData, pixel_radius) {
  function MakeGaussianKernel(px_radius) {
    // MakeGaussianKernel(1) will make a 3x3 grid,
    // MakeGaussianKernel(2) will make a 5x5 grid, and so on

    let min = -px_radius;
    let max =  px_radius;

    let kernel = [];
    let sum = 0;
    for (var y = min; y <= max; y++) {
      kernel.push([]);
      for (var x = min; x <= max; x++) {
        let e = Math.exp(-(Math.pow(y, 2) / (px_radius * 2) +
                           Math.pow(x, 2) / (px_radius * 2)));
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

  let output = new ImageData(imgData.width, imgData.height);
  let blurredPixels = Convolve(imgData, MakeGaussianKernel(pixel_radius));
  CopyPixels(blurredPixels, output.data);
  return output;
}

function GrayscalePixels(imgData) {
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

  let output = new ImageData(imgData.width, imgData.height);

  for (var i = 0; i < imgData.data.length; i += 4) {
    let linearLuminance = (GammaExpansion(imgData.data[i])   * 0.2126) +
                          (GammaExpansion(imgData.data[i+1]) * 0.7156) +
                          (GammaExpansion(imgData.data[i+2]) * 0.0722);

    let standardRGB = GammaCompression(linearLuminance);

    output.data[i]   = standardRGB;
    output.data[i+1] = standardRGB;
    output.data[i+2] = standardRGB;
    output.data[i+3] = 255;
  }

  return output;
}

function Convolve(imgData, kernel) {
  function NotWithin(n, lowerBound, upperBound) {
    return (n < lowerBound || n > upperBound);
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

  kernel = ReverseKernel(kernel);
  let min = -Math.floor(kernel.length / 2);
  let max =  Math.floor(kernel.length / 2);
  let colorChannels = 4;
  let rowWidth = imgData.width * colorChannels;
  let output = [];

  for (var i = 0; i < imgData.data.length; i += 4) {
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
        if (NotWithin(i + yOffset, 0, imgData.data.length - 1)) {
          yOffset *= -1;
        }

        let redIdx = i + yOffset + xOffset;

        redChannel   += (imgData.data[redIdx])     * kernel[y + max][x + max];
        greenChannel += (imgData.data[redIdx + 1]) * kernel[y + max][x + max];
        blueChannel  += (imgData.data[redIdx + 2]) * kernel[y + max][x + max];
      }
    }

    output[i]   = redChannel;
    output[i+1] = greenChannel;
    output[i+2] = blueChannel;
    output[i+3] = 255;
  }

  return output;
}

function PixelProcessing(processingFn) {
  let SrcCan  = document.getElementById("source");
  let SrcCtx  = SrcCan.getContext("2d");
  let SrcImg  = SrcCtx.getImageData(0, 0, SrcCan.width, SrcCan.height);
  let DestCan = document.getElementById("destination");
  let DestCtx = DestCan.getContext("2d");
  let DestImg = DestCtx.getImageData(0, 0, DestCan.width, DestCan.height);

  processingFn(SrcImg, DestImg);
  DestCtx.putImageData(DestImg, 0, 0);
}

function CanvasSrcToDest() {
  PixelProcessing((src, dest) => {
    for (var i = 0; i < src.data.length; i += 4) {
      dest.data[i]   = src.data[i];
      dest.data[i+1] = src.data[i+1];
      dest.data[i+2] = src.data[i+2];
    }
  });
}

function CanvasColorInversion() {
  PixelProcessing((src, dest) => {
    for (var i = 0; i < src.data.length; i += 4) {
      dest.data[i]   = 255 - src.data[i];
      dest.data[i+1] = 255 - src.data[i+1];
      dest.data[i+2] = 255 - src.data[i+2];
    }
  });
}

function CanvasGrayscale() {
  PixelProcessing((src, dest) => {
    let GrayImg = GrayscalePixels(src);
    CopyPixels(GrayImg.data, dest.data);
  });
}

function CanvasGaussianBlur() {
  PixelProcessing((src, dest) => {
    let blurredImg = GaussianBlur(src, 1);
    CopyPixels(blurredImg.data, dest.data);
  });
}

function CanvasSobelEdgeDetection() {
  PixelProcessing((src, dest) => {
    let kernelX = [[-1, -2, -1],
                   [ 0,  0,  0],
                   [ 1,  2,  1]];
    let kernelY = [[-1,  0,  1],
                   [-2,  0,  2],
                   [-1,  0,  1]];

    let GrayImg = GrayscalePixels(src);
    let magnitudeX = Convolve(GrayImg, kernelX);
    let magnitudeY = Convolve(GrayImg, kernelY);
    let magnitude2d = [];

    for (var i = 0; i < magnitudeX.length; i++) {
      magnitude2d[i] = Math.sqrt(Math.pow(magnitudeX[i], 2) +
                                 Math.pow(magnitudeY[i], 2));
    }

    CopyPixels(magnitude2d, dest.data);
  });
}

function CanvasLaplacianEdgeDetection() {
  PixelProcessing((src, dest) => {
    let kernel = [[1,   4, 1],
                  [4, -20, 4],
                  [1,   4, 1]];

    src = GrayscalePixels(src);
    let edges = Convolve(src, kernel);
    CopyPixels(edges, dest.data);
  });
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
