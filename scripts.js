"use strict";

//TODO: change 'size' to 'radius' or 'halfwidth'
function MakeGaussianKernel(size) {
  let min = -Math.floor(size / 2);
  let max =  Math.floor(size / 2);

  let kernel = [];
  let sum = 0;
  for (var y = min; y < max + 1; y++) {
    kernel.push([]);
    for (var x = min; x < max + 1; x++) {
      let e = Math.exp(-(Math.pow(y, 2) / size +
                         Math.pow(x, 2) / size));
      kernel[y + max][x + max] = e;
      sum += e;
    }
  }

  for (y = min; y < max + 1; y++) {
    for (x = min; x < max + 1; x++) {
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

function GaussianBlur() {
  let SrcCan  = document.getElementById("source");
  let SrcCtx  = SrcCan.getContext("2d");
  let DestCan = document.getElementById("destination");
  let DestCtx = DestCan.getContext("2d");

  let SrcImg = SrcCtx.getImageData(0, 0, SrcCan.width, SrcCan.height);
  let DestImg = DestCtx.getImageData(0, 0, DestCan.width, DestCan.height);

  let kernel = MakeGaussianKernel(3);
  Convolve(DestImg, kernel);

  DestCtx.putImageData(DestImg, 0, 0);
}

function Convolve(pixels, kernel) {
  kernel = ReverseKernel(kernel);
  let min = -Math.floor(kernel.length / 2);
  let max =  Math.floor(kernel.length / 2);

  // TODO: Edge wrapping
  for (var i = 0; i < pixels.data.length; i += 4) {
    let red_channel   = 0;
    let green_channel = 0;
    let blue_channel  = 0;

    for (var y = min; y < max + 1; y++) {
      for (var x = min; x < max + 1; x++) {
        let redIdx   = i + (y * pixels.width * 4) + (x * 4);
        let greenIdx = redIdx + 1;
        let blueIdx  = redIdx + 2;

        red_channel   += (pixels.data[redIdx]   || 0) * kernel[y + max][x + max];
        green_channel += (pixels.data[greenIdx] || 0) * kernel[y + max][x + max];
        blue_channel  += (pixels.data[blueIdx]  || 0) * kernel[y + max][x + max];

      }
    }

    pixels.data[i]   = red_channel;
    pixels.data[i+1] = green_channel;
    pixels.data[i+2] = blue_channel;
  }
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

function OnSelectChange(e) {
  if (e.target.value === "0") {
    SrcToDest();
  }
  if (e.target.value === "1") {
    GaussianBlur();
  }
}

document.querySelector("input").onchange = OnInputChange;
document.querySelector("select").onchange = OnSelectChange;
