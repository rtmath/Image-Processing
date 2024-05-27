"use strict";

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

function CopyPixelsToImageData(srcPixels, destImage) {
  for (var i = 0; i < srcPixels.length; i++) {
    destImage.data[i] = srcPixels[i];
  }
}

function GaussianBlur() {
  let SrcCan  = document.getElementById("source");
  let SrcCtx  = SrcCan.getContext("2d");
  let SrcImg = SrcCtx.getImageData(0, 0, SrcCan.width, SrcCan.height);
  let DestCan = document.getElementById("destination");
  let DestCtx = DestCan.getContext("2d");

  let output = Convolve(SrcImg, MakeGaussianKernel(1));
  CopyPixelsToImageData(output, SrcImg);

  DestCtx.putImageData(SrcImg, 0, 0);
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

function SrcToDest() {
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

function ResetAlgorithmSelect() {
  document.getElementById("algo-select").value = "0";
}

function OnInputChange(e) {
  let PopulateCanvases = (img) => {
    let SrcCan  = document.getElementById("source");
    let SrcCtx  = SrcCan.getContext("2d");
    let DestCan = document.getElementById("destination");
    let DestCtx = DestCan.getContext("2d");

    SrcCtx.drawImage(img, 0, 0);
    DestCtx.drawImage(img, 0, 0);
    ResetAlgorithmSelect();
  }

  let CreateImage = () => {
    let img = new Image();
    img.onload = () => PopulateCanvases(img);
    img.src = fr.result;
  }

  let file = e.target.files[0];
  var fr = new FileReader();
  fr.onload = CreateImage;
  fr.readAsDataURL(file);
}

let options = [
  { name: "No Processing", fn: SrcToDest },
  { name: "Gaussian Blur", fn: GaussianBlur},
  { name: "Color Inversion", fn: CanvasColorInversion},
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

document.querySelector("input").onchange = OnInputChange;
document.querySelector("select").onchange = OnSelectChange;

BuildSelectOptions();
