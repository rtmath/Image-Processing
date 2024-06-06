class ComplexNumber {
  constructor(real, imaginary) {
    this.real = real;
    this.imag = imaginary;
  }

  abs() {
    return Math.sqrt(this.real * this.real +
                     this.imag * this.imag);
  }

  conjugate() {
    return new ComplexNumber(this.real, -this.imag);
  }

  add(cmplxN) {
    return new ComplexNumber(this.real + cmplxN.real,
                             this.imag + cmplxN.imag);
  }

  sub(cmplxN) {
    return new ComplexNumber(this.real - cmplxN.real,
                             this.imag - cmplxN.imag);
  }

  mult(cmplxN) {
    // FOIL (a + b)(c + d) = ac + ad + bc + bd
    let real = (this.real * cmplxN.real) +
               (this.imag * cmplxN.imag * -1);
    let imag = (this.real * cmplxN.imag) +
               (this.imag * cmplxN.real);
    return new ComplexNumber(real, imag);
  }

  multScalar(n) {
    return new ComplexNumber(this.real * n, this.imag * n);
  }

  div(cmplxN) {
    let numerator = this.mult(cmplxN.getConjugate());
    let denominator = cmplxN.mult(cmplxN.getConjugate());

    return new ComplexNumber(numerator.real / denominator.real,
                             numerator.imag / denominator.real);
  }

  exp(n) {
    if (n === 0) {
      return new ComplexNumber(1, 0);
    }

    let product = new ComplexNumber(this.real, this.imag);
    for (var i = 1; i < n; i++) {
      product = product.mult(this);
    }
    return product;
  }

  toString() {
    // print complex number in "a + bi" standard form
    return `${this.real} ${this.imag < 0 ? '-' : '+'} ${Math.abs(this.imag)}i`;
  }
}
