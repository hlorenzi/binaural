export interface Complex
{
    real: number
    imag: number
}


export function complexMagnitude(c: Complex): number
{
    return Math.sqrt(c.real * c.real + c.imag * c.imag)
}


export function complexConjugate(c: Complex): Complex
{
    return {
        real: c.real,
        imag: -c.imag,
    }
}


export function complexMultiply(c1: Complex, c2: Complex): Complex
{
    const a = c1.real
    const b = c1.imag
    const c = c2.real
    const d = c2.imag
    return {
        real: a * c - b * d,
        imag: a * d + b * c,
    }
}


export function complexDivide(a: Complex, b: Complex): Complex
{
    const d = (b.imag * b.imag + b.real * b.real)
    return {
        real: (a.real * b.real - a.imag * b.imag) / d,
        imag: (a.imag * b.real - a.real * b.imag) / d,
    }
}