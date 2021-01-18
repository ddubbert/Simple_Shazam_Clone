<template>
  <div class="home">
    <div>
      <button
          class="recordButton"
          @click="recordFromMicrophone"
          :disabled="isRecording"
      >
        {{(isRecording) ? recordingTextBase + recordingCount : 'Start recording'}}
      </button>

      <a v-if="isRecording && countDown > 0" id="countdown">{{countDown}}</a>

      <button
          class="recordButton"
          @click="drawSin"
          :disabled="isRecording"
      >
        Draw Sinus-Wave
      </button>
    </div>

    <div class="spacer"></div>

    <div>
      <a id="stepText"> {{currentStep}} </a>
    </div>

    <div>
      <h1> Song is: </h1>
    </div>

    <div>
      <h2>
          {{currentSong}}
      </h2>
    </div>

    <div>
      <h1> Time domain: </h1>
    </div>

    <div>
      <WaveChart
          class="wave"
          :c-width="1200"
          :c-height="600"
          :cell-size="20"
          :time-domain="timeDomain"
          :maxTime="recordingTime"
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
      <h1> Spectrogram: </h1>
    </div>

    <div>
      <Spectrogram
          class="wave"
          :c-width="1200"
          :c-height="600"
          :cell-size="20"
          :spectrums="windowSpectrums"
          :maxMag="spectrogramMaxMag"
          :max-time="recordingTime"
      ></Spectrogram>
    </div>

    <div>
      <h1> Constellation map: </h1>
    </div>

    <div>
      <ConstellationMap
          class="wave"
          :c-width="1200"
          :c-height="600"
          :cell-size="20"
          :constellation-points="constellationPoints"
          :max-time="recordingTime"
          :sample-rate="sampleRate"
      ></ConstellationMap>
    </div>

    <div>
      <h1> Offset scatterplot for matching song: </h1>
    </div>

    <div>
      <OffsetScatterplot
          class="wave"
          :c-width="1200"
          :c-height="600"
          :cell-size="20"
          :points="scatterplotPoints"
      ></OffsetScatterplot>
    </div>

    <div>
      <h1> Offset histogram for matching song: </h1>
    </div>

    <div>
      <OffsetHistogram
          class="wave"
          :c-width="1200"
          :c-height="600"
          :cell-size="20"
          :histogram="histogramData"
      ></OffsetHistogram>
    </div>
  </div>
</template>

<script lang="ts">
import {Component, Prop, Vue} from 'vue-property-decorator';
import WaveChart from '@/components/WaveChart.vue';
import FreqChart from '@/components/FreqChart.vue';
import Spectrogram from '@/components/Spectrogram.vue';
import ConstellationMap from '@/components/ConstellationMap.vue';
import OffsetScatterplot from '@/components/OffsetScatterplot.vue';
import OffsetHistogram from '@/components/OffsetHistogram.vue';
import {
  FreqMagPair,
  SpectrogramPoint,
} from '../@types/Signal';
import { createAudioProcessor, AudioProcessor} from '@/models/AudioProcessor';
import {Histogram, MatchingPoint, MatchingSong, SongDatabase} from '@/models/SongDatabase'

@Component({
  components: {
    WaveChart,
    FreqChart,
    Spectrogram,
    ConstellationMap,
    OffsetScatterplot,
    OffsetHistogram,
  },
})
export default class RecordSample extends Vue {
  @Prop() private database!: SongDatabase;
  @Prop() private sampleRate!: number;
  @Prop() private bufferSize!: number;
  @Prop() private stftWindowSize!: number;
  @Prop() private stftHopSize!: number;
  @Prop() private fanOutFactor!: number;

  isRecording = false;

  timeout: number | null = null;

  interval: number | null = null;

  timeDomain: number[] = [];

  spectrumPairs: FreqMagPair[] = [];

  recordingTime = 15;

  maxMag = 0;

  maxAmp = 0;

  windowSpectrums: FreqMagPair[][] = [];

  spectrogramMaxMag = 0;

  constellationPoints: SpectrogramPoint[] = [];

  scatterplotPoints: MatchingPoint[] = []

  histogramData: Histogram = {
    maxCount: 0,
    maxValue: 0,
    valueAmounts: {},
  }

  countDown = 3;

  recordingTextBase = "Recording... ";

  recordingCount = this.recordingTime;

  currentStep = 'Start Recording...';

  currentSong = '...';

  audioProcessor: AudioProcessor = createAudioProcessor(
      this.sampleRate,
      this.stftWindowSize,
      this.stftHopSize,
      this.fanOutFactor,
  );

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

  processAudioData(decoded: AudioBuffer) {
    console.log('Calculating Time Domain...');
    this.currentStep = 'Calculating Time Domain...';
    const timeDomain = this.audioProcessor.getTimeDomainData(decoded);

    console.log('Calculating Time Domain...');
    this.currentStep = 'Calculating Spectrum...';
    const freqDomain = this.audioProcessor.calculateSpectrum(timeDomain);

    console.log('Calculating Spectrogram...');
    this.currentStep = 'Calculating Spectrogram...';
    const spectrogram = this.audioProcessor.calculateSpectrogram(timeDomain, decoded.duration);

    console.log('Calculating Hashes...');
    this.currentStep = 'Calculationg Hashes...';
    const hashTokens = this.audioProcessor.calculateHashes(spectrogram.maxPairs);

    console.log('Comparing Hashes And Finding Song...');
    this.currentStep = 'Comparing Hashes And Finding Song...';
    let song: MatchingSong;
    try {
      song = this.database.getSongFor(hashTokens);
      this.currentSong = `<b>${song.song.name}</b> (Duration: ${Math.round(song.song.duration)}  seconds).`;
    } catch(e) {
      this.currentStep = 'No Matching Song Found.';
    }

    this.currentStep = 'Drawing...';

    setTimeout(() => {
      console.log('Drawing time domain...');
      this.timeDomain = timeDomain;
      this.maxAmp = timeDomain.reduce((max, el) => (el > max) ? el : max);

      console.log('Drawing freq domain...');
      this.maxMag = freqDomain.maxPair.magnitude;
      this.spectrumPairs = freqDomain.freqMagPairs;

      console.log('Drawing spectrogram...');
      this.windowSpectrums = spectrogram.windowSpectrums;
      this.spectrogramMaxMag = spectrogram.maxMag;

      console.log('Drawing constellation map...');
      this.constellationPoints = spectrogram.maxPairs;

      if(song) {
        console.log('Drawing scatterplot...');
        this.scatterplotPoints = song.matchingPoints;

        console.log('Drawing histogram...');
        this.histogramData = song.histogram;
      }

      console.log('Finished...');
      this.isRecording = false;
    }, 1000)
  }

  recordFromMicrophone() {
    if (!this.isRecording) {
      this.currentSong = '...';
      this.isRecording = true;
      this.recordingCount = this.recordingTime;

      navigator.mediaDevices.getUserMedia({ audio: true })
        .then(stream => {
          const audioContext = new (window.AudioContext || window.webkitAudioContext)({ sampleRate: this.sampleRate });
          this.sampleRate = audioContext.sampleRate;
          const latency = (this.bufferSize / this.sampleRate) * 2;
          const waitingTime = Math.max(latency + 1, 3);
          this.countDown = waitingTime;

          const mediaRecorder = new MediaRecorder(stream);

          const countdownInterval = setInterval(() => {
            this.countDown -= 1;
            if (this.countDown < 0) clearInterval(countdownInterval);
          }, 1000)

          setTimeout(() => {
            mediaRecorder.start();
            const recordingInterval = setInterval(() => {
              this.recordingCount -= 1
              if (this.recordingCount < 0) clearInterval(recordingInterval);
            }, 1000);
          }, waitingTime * 1000)

          const audioChunks: BlobPart[] = [];

          mediaRecorder.addEventListener("dataavailable", (event: MediaRecorderDataAvailableEvent) => {
            audioChunks.push(event.data as BlobPart);
          });

          mediaRecorder.addEventListener("stop", () => {
            const audioBlob = new Blob(audioChunks);
            const fileReader = new FileReader();

            fileReader.onloadend = () => {
              audioContext.decodeAudioData(fileReader.result as ArrayBuffer, (decoded: AudioBuffer) => {
                this.processAudioData(decoded);
              });
            }

            fileReader.readAsArrayBuffer(audioBlob);

          });

          setTimeout(() => {
            mediaRecorder.stop();
          }, (waitingTime + this.recordingTime) * 1000);
        });
    }
  }

  drawSin() {
    const amountSamplesForRecordingTime = this.sampleRate * this.recordingTime;

    const sineWave = this.generateSinWave(
        amountSamplesForRecordingTime,
        this.sampleRate,
        1,
        1,
    );

    const cosineWave = this.generateCosWave(
        amountSamplesForRecordingTime,
        this.sampleRate,
        1,
        2,
    );

    const wave = sineWave.map((el, i) => el + cosineWave[i]);
    const max = wave.reduce((acc, el) => (acc > Math.abs(el)) ? acc : Math.abs(el));
    console.log(max);
    this.maxAmp = max;
    this.timeDomain = wave;
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

#countdown {
  margin-left: 20px;
  margin-right: 20px;
  font-size: 30px;
  font-weight: bold;
}

#stepText {
  font-size: 30px;
}

.spacer {
  height: 20px;
}
</style>
