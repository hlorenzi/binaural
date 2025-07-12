export class AudioManager
{
    ctx: AudioContext
    nodeSource: AudioBufferSourceNode
    nodeFilter: AudioWorkletNode


    static async create(): Promise<AudioManager>
    {
        const audio = new AudioManager()

        audio.ctx = new AudioContext({ sampleRate: 44100 })
        await audio.ctx.audioWorklet.addModule("build/audioWorklet.js")

        audio.nodeFilter = new AudioWorkletNode(audio.ctx, "hrtf", { outputChannelCount: [2] })
        audio.nodeFilter.connect(audio.ctx.destination)

        const srcWav = await fetch("./sample.wav")
        const srcArrayBuffer = await srcWav.arrayBuffer()
        const srcAudioBuffer = await audio.ctx.decodeAudioData(srcArrayBuffer)

        audio.nodeSource = audio.ctx.createBufferSource()
        audio.nodeSource.buffer = srcAudioBuffer
        audio.nodeSource.loop = true
        audio.nodeSource.connect(audio.nodeFilter)
        audio.nodeSource.start()
        
        return audio
    }


    private constructor()
    {

    }


    async resume()
    {
        await this.ctx.resume()
    }


    setParams(x: number, y: number, z: number)
    {
        const xParam = this.nodeFilter.parameters.get("x")!
        const yParam = this.nodeFilter.parameters.get("y")!
        const zParam = this.nodeFilter.parameters.get("z")!

        xParam.setValueAtTime(x, this.ctx.currentTime)
        yParam.setValueAtTime(y, this.ctx.currentTime)
        zParam.setValueAtTime(z, this.ctx.currentTime)
    }
}