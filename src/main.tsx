import * as Solid from "solid-js"
import * as SolidWeb from "solid-js/web"
import * as Styled from "solid-styled-components"

import { AudioManager } from "./audioManager.ts"


function Page()
{
    const [synth, setSynth] = Solid.createSignal<AudioManager>(undefined!)
    AudioManager.create().then(setSynth)

    const applyParams = () => {
        const x = parseFloat((document.getElementById("rangeX") as HTMLInputElement).value)
        const y = -parseFloat((document.getElementById("rangeY") as HTMLInputElement).value)
    
        const label = document.getElementById("rangeLabel")!
        label.innerText = `(${x.toFixed(2)}, ${y.toFixed(2)})`

        synth().setParams(x, y)
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
                Start
            </button>

            <div style={{
                display: "grid",
                "grid-template": "20em 1em / 20em 1em",
            }}>
                <div>
                    <span id="rangeLabel"/>
                </div>
                <input
                    id="rangeY"
                    type="range"
                    min={-4}
                    max={4}
                    step={0.1}
                    onInput={ applyParams }
                    style={{
                        "writing-mode": "vertical-lr",
                    }}
                />
                <input
                    id="rangeX"
                    type="range"
                    min={-4}
                    max={4}
                    step={0.1}
                    onInput={ applyParams }
                />
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