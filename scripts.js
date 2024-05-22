"use strict";

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

  // TODO: Edge wrapping
  // TODO: Fix the hardcoding
  for (var i = 0; i < pixels.data.length; i += 4) {
    let NWr = (pixels.data[i - (pixels.width * 4) - 4] || 0) * kernel[0][0];
    let NWg = (pixels.data[i - (pixels.width * 4) - 3] || 0) * kernel[0][0];
    let NWb = (pixels.data[i - (pixels.width * 4) - 2] || 0) * kernel[0][0];
    let Nr  = (pixels.data[i - (pixels.width * 4) + 0] || 0) * kernel[0][1];
    let Ng  = (pixels.data[i - (pixels.width * 4) + 1] || 0) * kernel[0][1];
    let Nb  = (pixels.data[i - (pixels.width * 4) + 2] || 0) * kernel[0][1];
    let NEr = (pixels.data[i - (pixels.width * 4) + 4] || 0) * kernel[0][2];
    let NEg = (pixels.data[i - (pixels.width * 4) + 5] || 0) * kernel[0][2];
    let NEb = (pixels.data[i - (pixels.width * 4) + 6] || 0) * kernel[0][2];

    let Wr = (pixels.data[i - 4] || 0) * kernel[1][0];
    let Wg = (pixels.data[i - 3] || 0) * kernel[1][0];
    let Wb = (pixels.data[i - 2] || 0) * kernel[1][0];
    let r  = (pixels.data[i]     || 0) * kernel[1][1];
    let g  = (pixels.data[i+1]   || 0) * kernel[1][1];
    let b  = (pixels.data[i+2]   || 0)   * kernel[1][1];
    let Er = (pixels.data[i + 4] || 0) * kernel[1][2];
    let Eg = (pixels.data[i + 5] || 0) * kernel[1][2];
    let Eb = (pixels.data[i + 6] || 0) * kernel[1][2];

    let SWr = (pixels.data[i + (pixels.width * 4) - 4] || 0) * kernel[2][0];
    let SWg = (pixels.data[i + (pixels.width * 4) - 3] || 0) * kernel[2][0];
    let SWb = (pixels.data[i + (pixels.width * 4) - 2] || 0) * kernel[2][0];
    let Sr  = (pixels.data[i + (pixels.width * 4) + 0] || 0) * kernel[2][1];
    let Sg  = (pixels.data[i + (pixels.width * 4) + 1] || 0) * kernel[2][1];
    let Sb  = (pixels.data[i + (pixels.width * 4) + 2] || 0) * kernel[2][1];
    let SEr = (pixels.data[i + (pixels.width * 4) + 4] || 0) * kernel[2][2];
    let SEg = (pixels.data[i + (pixels.width * 4) + 5] || 0) * kernel[2][2];
    let SEb = (pixels.data[i + (pixels.width * 4) + 6] || 0) * kernel[2][2];

    pixels.data[i]   = NWr + Nr + NEr + Wr + r + Er + SWr + Sr + SEr;
    pixels.data[i+1] = NWg + Ng + NEg + Wg + g + Eg + SWg + Sg + SEg;
    pixels.data[i+2] = NWb + Nb + NEb + Wb + b + Eb + SWb + Sb + SEb;
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
