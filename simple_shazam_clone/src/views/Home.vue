<template>
  <div class="home">
    <div>
      <button
          id="recordButton"
          @click="startRecording"
          :disabled="isRecording"
      >
        {{(isRecording) ? recordingTextBase + recordingCount : 'Start recording'}}
      </button>

      <a v-if="isRecording && countDown > 0" id="countdown">{{countDown}}</a>
    </div>

    <div>
      <WaveChart
          class="wave"
          :c-width="1500"
          :c-height="800"
          :cell-size="20"
          :time-domain="timeDomain"
          :maxTime="recordingTime"
          :sample-rate="sampleRate"
          :max-amp="maxAmp"
      ></WaveChart>
    </div>

    <div>
      <FreqChart
          class="wave"
          :c-width="1500"
          :c-height="400"
          :cell-size="20"
          :spectrum-pairs="spectrumPairs"
          :maxMag="maxMag"
          :sample-rate="sampleRate"
      ></FreqChart>
    </div>

    <div>
      <Spectrogram
          class="wave"
          :c-width="1500"
          :c-height="800"
          :cell-size="20"
          :spectrums="windowSpectrums"
          :maxMag="spectrogramMaxMag"
          :max-time="recordingTime"
      ></Spectrogram>
    </div>

    <div>
      <ConstellationMap
          class="wave"
          :c-width="1500"
          :c-height="800"
          :cell-size="20"
          :constellation-points="constellationPoints"
          :max-time="recordingTime"
          :sample-rate="sampleRate"
      ></ConstellationMap>
    </div>
  </div>
</template>

<script lang="ts">
import { Component, Vue } from 'vue-property-decorator';
import WaveChart from '@/components/WaveChart.vue';
import FreqChart from '@/components/FreqChart.vue';
import Spectrogram from '@/components/Spectrogram.vue';
import ConstellationMap from '@/components/ConstellationMap.vue';
import {FreqMagPair, SpectrumData, SpectrogramData, HashPair, HashToken} from '../@types/Signal'
const fft = require('fft-js').fft,
    fftUtil = require('fft-js').util;

Object.defineProperty(String.prototype, 'hashCode', {
  value: function() {
    let hash = 0, i, chr;
    for (i = 0; i < this.length; i++) {
      chr   = this.charCodeAt(i);
      hash  = ((hash << 5) - hash) + chr;
      hash |= 0; // Convert to 32bit integer
    }
    return hash;
  }
});

@Component({
  components: {
    WaveChart,
    FreqChart,
    Spectrogram,
    ConstellationMap,
  },
})
export default class Home extends Vue {
  isRecording = false;

  timeout: number | null = null;

  interval: number | null = null;

  timeDomain: number[] = [];

  spectrumPairs: FreqMagPair[] = [];

  recordingTime = 15;

  maxMag = 0;

  maxAmp = 0;

  sampleRate = 44100;

  bufferSize = 4096;

  windowSpectrums: FreqMagPair[][] = [];

  spectrogramMaxMag = 0;

  constellationPoints: FreqMagPair[] = [];

  stftWindowSize = 1024;

  stftHopSize = this.stftWindowSize / 2;

  countDown = 3;

  recordingTextBase = "Recording... ";

  recordingCount = this.recordingTime;

  fanOutFactor = 5;

  generateSinWave(amountSamples: number, samplingRate: number, amplitude: number, frequency: number): number[] {
    return Array.from(Array(amountSamples).keys()).map((x) => {
      return amplitude * Math.sin((x * samplingRate) * (frequency * 2 * Math.PI))
    })
  }

  generateCosWave(amountSamples: number, samplingRate: number, amplitude: number, frequency: number): number[] {
    return Array.from(Array(amountSamples).keys()).map((x) => {
      return amplitude * Math.cos((x * samplingRate) * (frequency * 2 * Math.PI))
    })
  }

  calculateSpectrum(amplitudes: number[]): SpectrumData {
    const phasors = fft(amplitudes);

    const frequencies = fftUtil.fftFreq(phasors, this.sampleRate),
        magnitudes = fftUtil.fftMag(phasors);

    const maxPair = { frequency: 0, magnitude: 0 };
    const freqMagPairs = frequencies.map(function (f, ix) {
      if (magnitudes[ix] > maxPair.magnitude) {
        maxPair.magnitude = magnitudes[ix];
        maxPair.frequency = f;
      }
      return { frequency: f, magnitude: Math.abs(magnitudes[ix]) };
    });

    return { maxPair, freqMagPairs }
  }

  calculateSpectrogram(amplitudes: number[]): SpectrogramData {
    const amountSamples = amplitudes.length;
    const amountSpectrums = Math.floor(amountSamples / this.stftHopSize) - 1;

    const windowSpectrums = [];
    let maxMag = 0;
    const maxPairs = [];
    for(let i = 0; i < amountSpectrums; i++) {
      const start = i * this.stftHopSize;
      const end = start + Math.min(amountSamples - start, this.stftWindowSize);
      const windowSpectrum = this.calculateSpectrum(amplitudes.slice(start, end));
      if (maxMag < windowSpectrum.maxPair.magnitude) maxMag = windowSpectrum.maxPair.magnitude;

      maxPairs.push(windowSpectrum.maxPair);
      const freqMagPairs = windowSpectrum.freqMagPairs;
      windowSpectrums.push(freqMagPairs);
    }

    return { maxMag, maxPairs, windowSpectrums };
  }

  createHashToken(pair: HashPair): HashToken {
    const deltaT = pair.second.time - pair.first.time;
    return {
      offset: pair.first.time,
      hash: `${pair.first.point.frequency}${pair.second.point.frequency}${deltaT}`.hashCode(),
    }
  }

  calculateHashes(constellationPoints: FreqMagPair[]): HashToken[] {
    const stepTime = (this.recordingTime * 1000) / constellationPoints.length;
    const amountPoints = constellationPoints.length - 1;

    return constellationPoints.reduce((acc, point, pointIndex) => {
      const newAcc = acc.slice(0);
      const cellsAfterCurrent = amountPoints - pointIndex;
      const amountConnections = (cellsAfterCurrent < this.fanOutFactor)
          ? cellsAfterCurrent
          : this.fanOutFactor;

      for (let i = 1; i <= amountConnections; i += 1) {
        const pair = {
          first: {
            point,
            time: pointIndex * stepTime,
          },
          second: {
            point: constellationPoints[pointIndex + i],
            time: stepTime * (pointIndex + i),
          },
        }

        newAcc.push(this.createHashToken(pair));
      }

      return newAcc;
    }, [] as HashToken[]);
  }

  startRecording() {
    if (!this.isRecording) {
      this.isRecording = true;
      this.recordingCount = this.recordingTime;

      navigator.mediaDevices.getUserMedia({ audio: true })
        .then(stream => {
          const audioContext = new (window.AudioContext || window.webkitAudioContext)({ sampleRate: this.sampleRate });
          this.sampleRate = audioContext.sampleRate;
          const latency = (this.bufferSize / this.sampleRate) * 2;
          const waitingTime = Math.max(latency + 1, 3);

          const history: number[] = [];

          const source = audioContext.createMediaStreamSource(stream);
          const node = audioContext.createScriptProcessor(
              this.bufferSize,
              1,
              1,
          );

          let maxAmp = 0;
          this.countDown = waitingTime;
          const countdownInterval = setInterval(() => {
            this.countDown -= 1;
            if (this.countDown < 0) clearInterval(countdownInterval);
          }, 1000)

          setTimeout(() => {
            const recordingInterval = setInterval(() => {
              this.recordingCount -= 1
              if (this.recordingCount < 0) clearInterval(recordingInterval);
            }, 1000);

            node.onaudioprocess = function(e) {
              const channelData = e.inputBuffer.getChannelData(0);
              channelData.forEach((value) => {
                if(maxAmp < value) maxAmp = value;
                history.push(value);
              })
            }
          }, waitingTime * 1000)

          source.connect(node);
          node.connect(audioContext.destination);

          this.timeout = setTimeout(() => {
            source.disconnect();
            node.disconnect();
            audioContext.close();

            this.maxAmp = maxAmp;

            let max = 1;
            while(max < history.length) {
              max *= 2;
            }

            history.splice(max / 2);
            this.timeDomain = [...history];

            const freqData = this.calculateSpectrum(history);

            this.maxMag = freqData.maxPair.magnitude;
            this.spectrumPairs = freqData.freqMagPairs;

            const spectrogram = this.calculateSpectrogram(history);

            this.windowSpectrums = spectrogram.windowSpectrums;
            this.spectrogramMaxMag = spectrogram.maxMag;

            this.constellationPoints = spectrogram.maxPairs;

            console.log(this.calculateHashes(spectrogram.maxPairs).length);

            this.isRecording = false;
          }, (this.recordingTime + waitingTime) * 1000);
        });
    }
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

#recordButton {
  width: 200px;
  height: 50px;
  color: white;
  font-weight: bold;
}

#recordButton:not(disabled) {
  background-color: #42b983;
  cursor: pointer;
}

#recordButton:disabled {
  background-color: rgba(16, 16, 16, 0.3);
  cursor: not-allowed;
}

#countdown {
  margin-left: 20px;
  font-size: 30px;
  font-weight: bold;
}
</style>
