import { hrtfData } from "./hrtfRaw.ts"
import * as Jsfft from "jsfft"


preprocess()


function preprocess()
{
    const res = []

    for (const left of hrtfData)
    {
        if (left.channel !== 0)
            continue

        const right = hrtfData.find(d =>
            d.channel === 1 &&
            d.elevation === left.elevation &&
            d.azimuth === left.azimuth)!

        const freqL = new Jsfft.ComplexArray(left.impulseResponse).FFT()
        const freqR = new Jsfft.ComplexArray(right.impulseResponse).FFT()

        let finalFreqL = "["
        let finalFreqR = "["
        for (let i = 0; i < freqL.length; i++)
        {
            finalFreqL += freqL.real[i].toFixed(5) + ", "
            finalFreqL += freqL.imag[i].toFixed(5) + ", "
            finalFreqR += freqR.real[i].toFixed(5) + ", "
            finalFreqR += freqR.imag[i].toFixed(5) + ", "
        }
        finalFreqL += "]"
        finalFreqR += "]"

        res.push({
            elevation: Math.round(left.elevation / 13 * 90),
            azimuth: left.azimuth,
            complexFreqRespL: finalFreqL,
            complexFreqRespR: finalFreqR,
        })
    }

    console.log(`
export interface HrtfEntry
{
    elevation: number
    azimuth: number
    complexFreqRespL: number[]
    complexFreqRespR: number[]
}

export const hrtfData: HrtfEntry[] = ` +
        JSON.stringify(res, null, 4).replace(/\"/g, ""))
}