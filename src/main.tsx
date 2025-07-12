import * as Solid from "solid-js"
import * as SolidWeb from "solid-js/web"
import * as Styled from "solid-styled-components"

import { AudioManager } from "./audioManager.ts"


let rotateInterval: number | undefined = undefined


function Page()
{
    const [synth, setSynth] = Solid.createSignal<AudioManager>(undefined!)
    AudioManager.create().then(setSynth)

    const [x, setX] = Solid.createSignal(0)
    const [y, setY] = Solid.createSignal(0)
    const [z, setZ] = Solid.createSignal(0)

    const applyParams = () => {
        const x = parseFloat((document.getElementById("rangeX") as HTMLInputElement).value)
        const y = parseFloat((document.getElementById("rangeY") as HTMLInputElement).value)
        const z = parseFloat((document.getElementById("rangeZ") as HTMLInputElement).value)
        
        setX(x)
        setY(y)
        setZ(z)

        synth().setParams(x, y, z)
        window.clearInterval(rotateInterval)
    }

    const startRotating = () => {
        let angle = 0
        const update = () => {
            angle += Math.PI / 180
            const x = -Math.cos(angle) * 2
            const y = Math.sin(angle) * 2

            setX(x)
            setY(y)

            synth().setParams(x, y, z())
        }
        window.clearInterval(rotateInterval)
        rotateInterval = window.setInterval(update, 1000 / 60)
    }

    return <Solid.Show when={ !!synth() }>
        <div style={{
            "width": "min(700px, calc(100dvw - 2em))",
            "height": "100dvh",
            "margin": "auto",
            "margin-top": "1em",
            "text-align": "center",
        }}>
            <button onclick={ () => synth().resume() }>
                Start Playing
            </button>

            { " " }

            <button onclick={ startRotating }>
                Rotate Emitter
            </button>

            <div style={{
                display: "grid",
                "grid-template": "20em 1em / 20em 1em 1em",
            }}>
                <div>
                    <span>({x().toFixed(1)}, {y().toFixed(1)}, {z().toFixed(1)})</span>
                </div>
                <input
                    id="rangeY"
                    type="range"
                    min={-4}
                    max={4}
                    step={0.1}
                    value={ y() }
                    onInput={ applyParams }
                    style={{
                        "writing-mode": "vertical-rl",
                        direction: "rtl",
                    }}
                />
                <input
                    id="rangeZ"
                    type="range"
                    min={-4}
                    max={4}
                    step={0.1}
                    value={ z() }
                    onInput={ applyParams }
                    style={{
                        "writing-mode": "vertical-rl",
                        direction: "rtl",
                    }}
                />

                <input
                    id="rangeX"
                    type="range"
                    min={-4}
                    max={4}
                    step={0.1}
                    value={ x() }
                    onInput={ applyParams }
                />
                <div/>
                <div/>
            </div>

            {/*Click and drag around the top chart to synthesize vowel sounds via formant frequencies.<br/>
            <br/>
            Red: extracted frequency-domain data from waveform<br/>
            Blue: extracted formant frequencies from waveform<br/>
            <br/>
            <VowelChart synth={ synth() }/>
            <br/>
            <AnalysisChart synth={ synth() }/>
            <br/>
            <RecordingPanel synth={ synth() }/>
            { " " }
            <button onclick={ () => synth().toggleMic() }>
                Toggle Microphone
            </button>*/}
        </div>
    </Solid.Show>
}


SolidWeb.render(
    Page,
    document.getElementById("app")!)