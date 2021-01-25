<template>
  <div class="home">
    <div>
      <label class="inputLabel">Sample Rate:</label>
      <input type="number" v-model="sampleRate"/>
    </div>

    <div class="spacer"></div>

    <div>
      <button
          class="recordButton"
          @click="addSinusWave"
      >
        Add Sine-Wave
      </button>

      <label class="inputLabel">Wave-Frequency:</label>
      <input id="freqInput" type="number" v-model="frequency"/>

      <button
          class="recordButton"
          @click="addCosinusWave"
      >
        Add Cosine-Wave
      </button>
    </div>

    <div class="spacer"></div>

    <div>
      <button
          class="recordButton"
          @click="clear"
      >
        Clear
      </button>
    </div>

    <div class="spacer"></div>

    <div>
      <h1> Time domain: </h1>
    </div>

    <div>
      <WaveChart
          class="wave"
          :c-width="1200"
          :c-height="400"
          :cell-size="20"
          :time-domain="timeDomain"
          :maxTime="time"
          :sample-rate="sampleRate"
          :max-amp="maxAmp"
      ></WaveChart>
    </div>

    <div>
      <h1> Frequency domain: </h1>
    </div>

    <div>
      <FreqChart
        class="wave"
        :c-width="1200"
        :c-height="400"
        :cell-size="20"
        :spectrum-pairs="spectrumPairs"
        :maxMag="maxMag"
        :sample-rate="sampleRate"
      ></FreqChart>
    </div>

    <div>
      <h1> Visualize DFT for different Frequencies: </h1>
    </div>

    <div class="spacer">
      <label class="inputLabel">Test-Frequency:</label>
      <input type="number" v-model="testFrequency" :step='0.01'/>
    </div>

    <div>
      <Fourier
          class="wave"
          :c-width="1200"
          :c-height="600"
          :cell-size="20"
          :time-domain="timeDomain"
          :sample-rate="sampleRate"
          :max-amp="maxAmp"
          :test-frequency="testFrequency"
      ></Fourier>
    </div>
  </div>
</template>

<script lang="ts">
import {Component, Vue, Watch} from 'vue-property-decorator';
import WaveChart from '@/components/WaveChart.vue';
import FreqChart from '@/components/FreqChart.vue';
import Fourier from '@/components/Fourier.vue';
import {FreqMagPair} from '@/@types/Signal';
import {dft} from '@/models/DFT';

@Component({
  components: {
    WaveChart,
    FreqChart,
    Fourier,
  },
})
export default class SinusiodDrawer extends Vue {
  sampleRate = 100;

  time = 5;

  timeDomain: number[] = [];

  waves: number[][] = [];

  maxMag = 0;

  maxAmp = 0;

  frequency = 1;

  spectrumPairs: FreqMagPair[] = [];

  testFrequency = 1;

  generateSinWave(amountSamples: number, samplingRate: number, amplitude: number, frequency: number): number[] {
    return Array.from(Array(amountSamples).keys()).map((x) => {
      return amplitude * Math.sin(((x / samplingRate)) * (frequency * (2 * Math.PI)));
    });
  }

  generateCosWave(amountSamples: number, samplingRate: number, amplitude: number, frequency: number): number[] {
    return Array.from(Array(amountSamples).keys()).map((x) => {
      return amplitude * Math.cos(((x / samplingRate)) * (frequency * (2 * Math.PI)));
    });
  }

  addSinusWave() {
    const sineWave = this.generateSinWave(
        this.time * this.sampleRate,
        this.sampleRate,
        1,
        this.frequency,
    );

    this.waves.push(sineWave);

    this.draw();
  }

  addCosinusWave() {
    const cosWave = this.generateCosWave(
        this.time * this.sampleRate,
        this.sampleRate,
        1,
        this.frequency,
    );

    this.waves.push(cosWave);

    this.draw();
  }

  clear() {
    this.waves.splice(0);
    this.draw();
  }

  draw() {
    if (this.waves.length > 0) {
      const amplitudes: number[] = this.waves[0].slice(0);

      for (let i = 1; i < this.waves.length; i++){
        for (let j = 0; j < amplitudes.length; j++){
          amplitudes[j] += this.waves[i][j];
        }
      }

      this.timeDomain.splice(0);
      for(let i = 0; i < amplitudes.length; i++) {
        this.timeDomain.push(amplitudes[i]);
      }
      this.maxAmp = this.waves.length;

      this.spectrumPairs.splice(0);
      const spec = dft(amplitudes, this.sampleRate);
      for(let i = 0; i < spec.freqMagPairs.length / 2; i++) {
        const pair = spec.freqMagPairs[i];
        pair.magnitude *= 2;
        this.spectrumPairs.push(pair);
      }
      this.maxMag = spec.maxPair.magnitude * 2;
    } else {
      this.maxAmp = 0;
      this.timeDomain.splice(0);
      this.spectrumPairs.splice(0);
    }
  }

  @Watch('sampleRate')
  watchRate() {
    this.clear();
  }
}
</script>
<style scoped lang="scss">
.wave {
  top: 10%;
  left: 10%;
}

.home {
  display: flex;
  flex-direction: column;
}

.recordButton {
  width: 200px;
  height: 50px;
  color: white;
  font-weight: bold;
}

.recordButton:not(disabled) {
  background-color: #42b983;
  cursor: pointer;
}

.recordButton:disabled {
  background-color: rgba(16, 16, 16, 0.3);
  cursor: not-allowed;
}

.spacer {
  height: 20px;
}

#freqInput {
  margin-right: 20px;
}

.inputLabel {
  margin-left: 20px;
  margin-right: 10px;
}
</style>
