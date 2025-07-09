type Complex = { real: number, imag: number };

declare module "jsfft" {
  function FFT(input: ComplexArray): ComplexArray;
  function InvFFT(input: ComplexArray): ComplexArray;
  function frequencyMap(input: ComplexArray, filterer: (value: Complex, i: number, n: number) => Complex): ComplexArray;

  class ComplexArray<TypedArray extends ArrayLike<number> = Float32Array> {
    real: TypedArray;
    imag: TypedArray;
    length: number;
    ArrayType: TypedArray;
    constructor(other: ComplexArray | number | ArrayLike<number> | ArrayBufferLike, arrayType?: TypedArray);
    toSting(): string;
    forEach(iterator: (value: Complex, i: number, n: number) => void): void;
    map(iterator: (value: Complex, i: number, n: number) => void): ComplexArray<TypedArray>;
    conjugate(): ComplexArray<TypedArray>;
    magnitude(): TypedArray;
    FFT(): ComplexArray<TypedArray>;
    InvFFT(): ComplexArray<TypedArray>;
    frequencyMap(filterer: (value: Complex, i: number, n: number) => void): ComplexArray<TypedArray>;
  }
}