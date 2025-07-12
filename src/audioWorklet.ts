interface AudioWorkletProcessor {
    readonly port: MessagePort;
}

interface AudioWorkletProcessorImpl extends AudioWorkletProcessor {
    process(
        inputs: Float32Array[][],
        outputs: Float32Array[][],
        parameters: Record<string, Float32Array>
    ): boolean;
}

declare var AudioWorkletProcessor: {
    prototype: AudioWorkletProcessor;
    new (options?: AudioWorkletNodeOptions): AudioWorkletProcessor;
};

type AudioParamDescriptor = {
    name: string,
    automationRate: AutomationRate,
    minValue: number,
    maxValue: number,
    defaultValue: number
}

interface AudioWorkletProcessorConstructor {
    new (options?: AudioWorkletNodeOptions): AudioWorkletProcessorImpl;
    parameterDescriptors?: AudioParamDescriptor[];
}

declare function registerProcessor(
    name: string,
    processorCtor: AudioWorkletProcessorConstructor,
): void;


import * as Jsfft from "jsfft"
import { hrtfData, HrtfEntry } from "./hrtf.ts"
import * as Complex from "./complex.ts"


const SAMPLING_FREQUENCY = 44100
const HRTF_SIZE = 512
const INPUT_BUFFER_SIZE = HRTF_SIZE * 2
const OUTPUT_BUFFER_SIZE = HRTF_SIZE * 8
const RAD_TO_DEG = 180 / Math.PI


class HrtfProcessor extends AudioWorkletProcessor
{
    inputBuffer: Float32Array
    inputHead: number
    outputBufferL: Float32Array
    outputBufferR: Float32Array
    outputWrite: number
    outputRead: number

    xParam: number
    yParam: number
    zParam: number


    constructor()
    {
        super()
        this.inputBuffer = new Float32Array(INPUT_BUFFER_SIZE)
        this.inputHead = HRTF_SIZE
        this.outputBufferL = new Float32Array(OUTPUT_BUFFER_SIZE)
        this.outputBufferR = new Float32Array(OUTPUT_BUFFER_SIZE)
        this.outputWrite = 0
        this.outputRead = 0
        this.xParam = 0
        this.yParam = 0
        this.zParam = 0
    }


    queueInput(value: number)
    {
        this.inputBuffer[this.inputHead] = value
        this.inputHead += 1

        if (this.inputHead >= this.inputBuffer.length)
        {
            this.applyFilter()

            for (let i = 0; i < HRTF_SIZE; i++)
                this.inputBuffer[i] = this.inputBuffer[i + HRTF_SIZE]

            this.inputHead = HRTF_SIZE
        }
    }


    writeOutput(
        left: number, leftOffset: number,
        right: number, rightOffset: number)
    {
        const indexL = (this.outputWrite + leftOffset + HRTF_SIZE) % this.outputBufferL.length
        const indexR = (this.outputWrite + rightOffset + HRTF_SIZE) % this.outputBufferR.length
        this.outputBufferL[indexL] = left
        this.outputBufferR[indexR] = right
        this.outputWrite = (this.outputWrite + 1) % this.outputBufferL.length
    }


    sendOutput(to: Float32Array[])
    {
        const drainLength = to[0].length

        for (let i = 0; i < drainLength; i++)
        {
            to[0][i] = this.outputBufferL[(this.outputRead + i) % this.outputBufferL.length]
            to[1][i] = this.outputBufferR[(this.outputRead + i) % this.outputBufferR.length]
        }

        this.outputRead = (this.outputRead + drainLength) % this.outputBufferL.length
    }


    distanceTo(
        ax: number, ay: number, az: number,
        bx: number, by: number, bz: number)
    {
        const xx = bx - ax
        const yy = by - ay
        const zz = bz - az
        return Math.sqrt(xx * xx + yy * yy + zz * zz)
    }


    get3dParams(x: number, y: number, z: number)
    {
        const azimuth = Math.atan2(x, y)
        const distance = this.distanceTo(0, 0, 0, x, y, z)
        const elevation = Math.atan2(y, Math.sqrt(x * x + z * z) + 0.001)

        const headSize = 0.20
        const speedOfSound = 343
        const timeToEarL = this.distanceTo(-headSize, 0, 0, x, y, z) / speedOfSound
        const timeToEarR = this.distanceTo(headSize, 0, 0, x, y, z) / speedOfSound

        return {
            azimuth: azimuth * RAD_TO_DEG,
            elevation: elevation * RAD_TO_DEG,
            distance,
            timeToEarL,
            timeToEarR,
        }
    }


    getClosestHrtfEntry(elevation: number, azimuth: number)
    {
        const angleDiff = (from: number, to: number) => {
            return Math.min(
                Math.abs(from - to),
                Math.abs(from + 360 - to),
                Math.abs(from - (to + 360))
            )
        }

        const calcScore = (entry: HrtfEntry) => {
            return angleDiff(entry.elevation, elevation) + angleDiff(entry.azimuth, azimuth)
        }

        hrtfData.sort((a, b) => calcScore(a) - calcScore(b))

        return hrtfData[0]
    }


    applyFilter()
    {
        const params = this.get3dParams(
            this.xParam,
            this.yParam,
            this.zParam)

        const delaySamplesL = Math.round(params.timeToEarL * SAMPLING_FREQUENCY)
        const delaySamplesR = Math.round(params.timeToEarR * SAMPLING_FREQUENCY)

        const srcL = new Jsfft.ComplexArray(this.inputBuffer)
        const srcR = new Jsfft.ComplexArray(this.inputBuffer)

        const hrtfEntry = this.getClosestHrtfEntry(params.elevation, params.azimuth)
        //console.log(params, hrtfEntry, delaySamplesL, delaySamplesR)

        const filteredL = srcL.frequencyMap((value, i, n) => {
            const res = Complex.complexMultiply(
                value,
                {
                    real: hrtfEntry.complexFreqRespL[i * 2 + 0],
                    imag: hrtfEntry.complexFreqRespL[i * 2 + 1],
                })

            value.real = res.real
            value.imag = res.imag
        })

        const filteredR = srcR.frequencyMap((value, i, n) => {
            const res = Complex.complexMultiply(
                value,
                {
                    real: hrtfEntry.complexFreqRespR[i * 2 + 0],
                    imag: hrtfEntry.complexFreqRespR[i * 2 + 1],
                })

            value.real = res.real
            value.imag = res.imag
        })

        //const filtered = window.frequencyMap((value, i, n) => {
        //    value.real = i < n / 16 ? value.real : 0
        //    value.imag = i < n / 16 ? value.imag : 0
        //})

        const gain = 4
        const distanceAttenuation = Math.pow(10, -20 * Math.log10(Math.max(1, params.distance)) / 10)

        for (let i = 0; i < HRTF_SIZE; i++)
            this.writeOutput(
                filteredL.real[i] * gain * distanceAttenuation, delaySamplesL,
                filteredR.real[i] * gain * distanceAttenuation, delaySamplesR)
    }
    
    
    static get parameterDescriptors(): AudioParamDescriptor[]
    {
        return [
            {
                name: "x",
                defaultValue: 0,
                minValue: -1000,
                maxValue: 1000,
                automationRate: "a-rate",
            },
            {
                name: "y",
                defaultValue: 0,
                minValue: -1000,
                maxValue: 1000,
                automationRate: "a-rate",
            },
            {
                name: "z",
                defaultValue: 0,
                minValue: -1000,
                maxValue: 1000,
                automationRate: "a-rate",
            },
        ];
    }


    process(
        inputs: Float32Array[][],
        outputs: Float32Array[][],
        parameters: Record<string, Float32Array>)
    {
        if (inputs.length !== 1 ||
            inputs[0].length !== 1 ||
            outputs.length !== 1 ||
            outputs[0].length !== 2)
        {
            console.error("wrong setup for HrtfProcessor")
            return false
        }

        for (let w = 0; w < inputs[0][0].length; w += 1)
            this.queueInput(inputs[0][0][w])

        this.sendOutput(outputs[0])

        this.xParam = parameters["x"][0]
        this.yParam = parameters["y"][0]
        this.zParam = parameters["z"][0]
        
        return true
    }
}

registerProcessor("hrtf", HrtfProcessor)