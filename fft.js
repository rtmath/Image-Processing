"use strict";

function FixDecimal(n) {
  return +(n.toFixed(3));
}

function DFT(signal) {
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

function FFT(signal) {
  let N = signal.length;
  if (N === 1) { return signal }

  let Xeven = [];
  let Xodd  = [];

  for (var i = 0; i < N / 2; i++) {
    Xeven[i] = signal[2 * i];
    Xodd [i] = signal[2 * i + 1];
  }

  let Feven = FFT(Xeven);
  let Fodd  = FFT(Xodd);
  let f = [];

  for (var j = 0; j < N / 2; j++) {
    let exp = -(2 * Math.PI * (j / N));
    let eulersForm = new ComplexNumber(Math.cos(exp), Math.sin(exp));
    let Fodd_prime = Fodd[j].mult(eulersForm);
    f[j] = Feven[j].add(Fodd_prime);
    f[j + (N / 2)] = Feven[j].sub(Fodd_prime);
  }

  for (var l = 0; l < f.length; l++) {
    f[l].real = FixDecimal(f[l].real);
    f[l].imag = FixDecimal(f[l].imag);
  }

  return f;
}

function IFFT(signal) {
  function InverseFastFourierTransform(_signal) {
    let N = _signal.length;
    if (N === 1) { return _signal }

    let Xeven = [];
    let Xodd  = [];

    for (var i = 0; i < N / 2; i++) {
      Xeven[i] = _signal[2 * i];
      Xodd [i] = _signal[2 * i + 1];
    }

    let Feven = InverseFastFourierTransform(Xeven);
    let Fodd  = InverseFastFourierTransform(Xodd);
    let f = [];

    for (var j = 0; j < N / 2; j++) {
      let exp = (2 * Math.PI * (j / N));
      let eulersForm = new ComplexNumber(Math.cos(exp), Math.sin(exp));
      let Fodd_prime = Fodd[j].mult(eulersForm);
      f[j] = Feven[j].add(Fodd_prime);
      f[j + (N / 2)] = Feven[j].sub(Fodd_prime);
    }

    for (var l = 0; l < f.length; l++) {
      f[l].real = FixDecimal(f[l].real);
      f[l].imag = FixDecimal(f[l].imag);
    }

    return f;
  }

  return InverseFastFourierTransform(signal).map((n) =>
    new ComplexNumber(FixDecimal(n.real / signal.length),
                      FixDecimal(n.imag / signal.length))
  );
}
