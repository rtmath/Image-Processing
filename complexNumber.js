function CheckProbablyZero(n) {
  let epsilon = 1e-10;
  return (Math.abs(n) <= epsilon) ? 0 : n;
}

function CPZ(n) {
  return CheckProbablyZero(n);
}

class ComplexNumber {
  constructor(real = 0, imaginary = 0) {
    this.real = CPZ(real);
    this.imag = CPZ(imaginary);
  }

  abs() {
    return Math.sqrt(CPZ(this.real * this.real) +
                     CPZ(this.imag * this.imag));
  }

  conjugate() {
    return new ComplexNumber(this.real, -this.imag);
  }

  add(cmplxN) {
    return new ComplexNumber(CPZ(this.real + cmplxN.real),
                             CPZ(this.imag + cmplxN.imag));
  }

  sub(cmplxN) {
    return new ComplexNumber(CPZ(this.real - cmplxN.real),
                             CPZ(this.imag - cmplxN.imag));
  }

  mult(cmplxN) {
    // FOIL (a + b)(c + d) = ac + ad + bc + bd
    let real = (this.real * cmplxN.real) +
               (this.imag * cmplxN.imag * -1);
    let imag = (this.real * cmplxN.imag) +
               (this.imag * cmplxN.real);
    return new ComplexNumber(CPZ(real), CPZ(imag));
  }

  multScalar(n) {
    return new ComplexNumber(CPZ(this.real * n), CPZ(this.imag * n));
  }

  div(cmplxN) {
    let numerator = this.mult(cmplxN.conjugate());
    let denominator = cmplxN.mult(cmplxN.conjugate());

    return new ComplexNumber(CPZ(numerator.real / denominator.real),
                             CPZ(numerator.imag / denominator.real));
  }

  divScalar(n) {
    return new ComplexNumber(CPZ(this.real / n),
                             CPZ(this.imag / n));
  }

  exp(n) {
    if (n === 0) {
      return new ComplexNumber(1, 0);
    }

    let product = new ComplexNumber(this.real, this.imag);
    for (var i = 1; i < n; i++) {
      product = product.mult(this);
    }
    return CPZ(product);
  }

  toString() {
    // print complex number in "a + bi" standard form
    return `${this.real} ${this.imag < 0 ? '-' : '+'} ${Math.abs(this.imag)}i`;
  }
}
