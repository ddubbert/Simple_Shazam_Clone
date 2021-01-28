<template>
  <div class="home">
    <div>
      <h4>Select Microphone:</h4>
      <select v-model="selectedMic">
        <option v-for="device in deviceList" :key="device.text" :value="device.value">
          {{ device.text }}
        </option>
      </select>
    </div>

    <div>
      <button
          class="recordButton"
          @click="recordFromMicrophone"
          :disabled="isRecording"
      >
        {{(isRecording) ? recordingTextBase + recordingCount : 'Start recording'}}
      </button>

      <a v-if="isRecording && countDown > 0" id="countdown">{{countDown}}</a>
    </div>

    <div class="spacer"></div>

    <div>
      <a id="stepText"> {{currentStep}} </a>
    </div>

    <div>
      <h1> Song might be: </h1>
    </div>

    <div v-for="(song, i) in currentSongs" :key="song">
      <h3>
          {{`${i + 1}: ${song}`}}
      </h3>
    </div>

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
          :spectrogram="spectrogram"
          :max-time="recordingTime"
          :sample-rate="sampleRate"
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
          :max-spectrogram-freq="maxSpectrogramFreq"
          :magnitude-threshhold="magnitudeThreshhold"
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
          :max-time="recordingTime"
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
  FreqMagPair, SpectrogramData,
  SpectrogramPoint,
} from '../@types/Signal';
import { createAudioProcessor, AudioProcessor} from '@/models/AudioProcessor';
import {Histogram, MatchingPoint, MatchingSong, SongDatabase} from '@/models/SongDatabase';

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
  @Prop() private constellationYGroupAmount!: number;
  @Prop() private constellationXGroupSize!: number;
  @Prop() private fanOutStepFactor!: number;
  @Prop() private magnitudeThreshhold!: number;
  @Prop() private targetZoneHeight!: number;

  isRecording = false;

  timeDomain: number[] = [];

  spectrumPairs: FreqMagPair[] = [];

  recordingTime = 15;

  maxMag = 0;

  maxAmp = 0;

  spectrogram: SpectrogramData = {
    maxMag: 0,
    windowSpectrums: [],
    maxFreq: 0,
  };

  constellationPoints: SpectrogramPoint[][] = [];

  scatterplotPoints: MatchingPoint[] = []

  histogramData: Histogram = {
    maxCount: 0,
    maxValue: '0',
    valueAmounts: {},
  }

  maxSpectrogramFreq = 0;

  countDown = 3;

  recordingTextBase = "Recording... ";

  recordingCount = this.recordingTime;

  currentStep = 'Start Recording...';

  currentSongs: string[] = [];

  deviceList: { value: string; text: string }[] = [];

  selectedMic = '';

  audioProcessor: AudioProcessor = createAudioProcessor(
      this.sampleRate,
      this.stftWindowSize,
      this.stftHopSize,
      this.fanOutFactor,
      this.constellationYGroupAmount,
      this.constellationXGroupSize,
      this.fanOutStepFactor,
      this.magnitudeThreshhold,
      this.targetZoneHeight,
  );

  processAudioData(decoded: AudioBuffer) {
    console.log('Calculating Time Domain...');
    const timeDomain = this.audioProcessor.getTimeDomainData(decoded);

    console.log('Calculating Spectrogram...');
    const spectrogram = this.audioProcessor.calculateSpectrogram(timeDomain);

    console.log('Calculating Constellation Points...');
    const constellation = this.audioProcessor.getConstellationPoints(spectrogram);

    console.log('Calculating Hashes...');
    const hashTokens = this.audioProcessor.calculateHashes(constellation);

    console.log('Comparing Hashes And Finding Song...');
    let songs: MatchingSong[];
    try {
      songs = this.database.getSongFor(hashTokens);
      this.currentSongs = songs.map((it) =>
          `${it.song.name} (Duration: ${Math.round(it.song.duration)} seconds).
          Max offset count ${it.histogram.maxCount} at ${Math.round(Number(it.histogram.maxValue)) / 1000} seconds.`);
    } catch(e) {
      this.currentStep = 'No Matching Song Found.';
    }

    this.currentStep = 'Drawing...';

    setTimeout(() => {
      console.log('Calculating Frequency Domain...');
      const freqDomain = this.audioProcessor.calculateSpectrum(timeDomain);

      console.log('Drawing time domain...');
      this.timeDomain = timeDomain;
      this.maxAmp = timeDomain.reduce((max, el) => (Math.abs(el) > max) ? Math.abs(el) : max);

      console.log('Drawing freq domain...');
      this.maxMag = freqDomain.maxPair.magnitude;
      this.spectrumPairs = freqDomain.freqMagPairs;

      console.log('Drawing spectrogram...');
      this.spectrogram = spectrogram;

      console.log('Drawing constellation map...');
      this.maxSpectrogramFreq = spectrogram.maxFreq;
      this.constellationPoints = constellation;

      if(songs) {
        console.log('Drawing scatterplot...');
        this.scatterplotPoints = songs[0].matchingPoints;

        console.log('Drawing histogram...');
        this.histogramData = songs[0].histogram;
      }

      console.log('Finished...');
      this.currentStep = 'Start Recording...';
      this.isRecording = false;
    }, 1000)
  }

  recordFromMicrophone() {
    if (!this.isRecording) {
      this.currentStep = 'Recording...';
      this.currentSongs.splice(0);
      this.isRecording = true;
      this.recordingCount = this.recordingTime;

      navigator.mediaDevices.getUserMedia({ audio: { deviceId: this.selectedMic }})
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
            this.currentStep = 'Decoding Sample...';
            const audioBlob = new Blob(audioChunks);
            const fileReader = new FileReader();

            fileReader.onloadend = () => {
              audioContext.decodeAudioData(fileReader.result as ArrayBuffer, (decoded: AudioBuffer) => {
                this.currentStep = 'Decoding Sample...';
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

  showDeviceList(deviceInfos: MediaDeviceInfo[]) {
    for (let i = 0; i !== deviceInfos.length; ++i) {
      const deviceInfo = deviceInfos[i];
      if (deviceInfo.kind === 'audioinput') {
        const text = deviceInfo.label ||
            'Microphone ' + (this.deviceList.length + 1);
        this.deviceList.push({ value: deviceInfo.deviceId, text });
        if(i === 0) this.selectedMic = deviceInfo.deviceId;
      }
    }
  }

  mounted() {
    navigator.mediaDevices.enumerateDevices()
        .then(this.showDeviceList)
        .catch((e) => {
          console.log(e);
        });
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
