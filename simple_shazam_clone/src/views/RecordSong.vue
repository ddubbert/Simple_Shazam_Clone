<template>
  <div class="home">
<!--    <div>
      <button
          id="recordButton"
          @click="recordFromMicrophone"
          :disabled="isRecording"
      >
        {{(isRecording) ? recordingTextBase + recordingCount : 'Select a file'}}
      </button>

      <a v-if="isRecording && countDown > 0" id="countdown">{{countDown}}</a>
    </div>-->

    <div>
      <h1 class="stepText"> Convert Song to hashes: </h1>
    </div>

    <div>
      <button class="recordButton" @click="$refs.songInput.click()">Choose Song</button>
    </div>

    <div>
      <input
          class="recordInput"
          ref="songInput"
          type="file"
          name="files[]"
          @change="selectFile"
          :disabled="isRecording"
      />
    </div>

    <div>
      <h1> Upload Song Hashes: </h1>
    </div>

    <div>
      <button class="recordButton" @click="$refs.hashInput.click()">Choose Hash-Files</button>
    </div>

    <div>
      <input
          class="recordInput"
          ref="hashInput"
          type="file"
          name="files[]"
          multiple
          @change="uploadHeashFiles"
          :disabled="isRecording"
      />
    </div>

    <div class="spacer">
      <audio ref="audio"></audio>
    </div>

    <div>
      <a id="stepText"> {{currentStep}} </a>
    </div>
  </div>
</template>

<script lang="ts">
import {Component, Prop, Vue} from 'vue-property-decorator';
import {AudioProcessor, createAudioProcessor} from '@/models/AudioProcessor';
import {SongDatabase} from '@/models/SongDatabase'

@Component({
  components: {
  },
})
export default class RecordSong extends Vue {
  @Prop() private database!: SongDatabase;
  @Prop() private sampleRate!: number;
  @Prop() private bufferSize!: number;
  @Prop() private stftWindowSize!: number;
  @Prop() private stftHopSize!: number;
  @Prop() private fanOutFactor!: number;

  isRecording = false;

  timeout: number | null = null;

  interval: number | null = null;

  songName = '';

  currentStep = 'Select Song or Song Hashes File...';

  audioProcessor: AudioProcessor = createAudioProcessor(
      this.sampleRate,
      this.stftWindowSize,
      this.stftHopSize,
      this.fanOutFactor,
  );

  selectFile(e?: HTMLInputEvent) {
    if(e && e.target.files) {
      this.isRecording = true;
      const file = e.target.files[0];
      this.songName = file.name;
      this.recordFromFile(file);
    }
  }

  decodeFile(buffer: ArrayBuffer) {
    this.currentStep = 'Decoding Song...';
    const audioContext = new (window.AudioContext || window.webkitAudioContext)({ sampleRate: this.sampleRate });

    audioContext.decodeAudioData(buffer, (decoded: AudioBuffer) => {
      console.log('Calculating Time Domain...');
      this.currentStep = 'Calculating Time Domain...';
      const timeDomain = this.audioProcessor.getTimeDomainData(decoded);

      console.log('Calculating Spectrogram...');
      this.currentStep = 'Calculating Spectrogram...';
      const spectrogram = this.audioProcessor.calculateSpectrogram(timeDomain, decoded.duration);

      console.log('Calculating Hashes...');
      this.currentStep = 'Calculationg Hashes...';
      const hashTokens = this.audioProcessor.calculateHashes(spectrogram.maxPairs);

      console.log('Saving Hashes...');
      this.currentStep = 'Saving Hashes...';
      this.database.addSong(this.songName, decoded.duration, hashTokens);

      console.log('Finished...');
      this.currentStep = 'Select Song or Song Hashes File...';

      this.isRecording = false;
    });
  }

  recordFromFile(file: File) {
    this.currentStep = 'Recording Song...';
    const fReader = new FileReader();
    const audio = this.$refs.audio as HTMLAudioElement;

    fReader.onload = (e?: ProgressEvent<FileReader>) => {
      if(e && fReader.result) {
        audio.src = fReader.result as string;
        this.decodeFile(fReader.result as ArrayBuffer);
      }
    };

    fReader.readAsArrayBuffer(file);
  }

  readHeashFile(file: File) {
    const fReader = new FileReader();
    fReader.readAsText(file, 'UTF-8');
    fReader.onload = (e?: ProgressEvent<FileReader>) => {
      if(e && fReader.result) this.database.uploadHashes(JSON.parse(fReader.result as string));
    }
  }

  uploadHeashFiles(e?: HTMLInputEvent) {
    if(e && e.target.files) {
      this.isRecording = true;
      this.currentStep = 'Uploading Hashes...';

      for(let i = 0; i < e.target.files.length; i++) {
        this.readHeashFile(e.target.files[i]);
      }

      this.currentStep = `Hashes of ${e.target.files.length} songs uploaded...`;
      this.isRecording = false;
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

.recordButton {
  width: 300px;
  height: 50px;
  color: white;
  font-weight: bold;
  font-size: 20px;
}

.recordButton:not(disabled) {
  background-color: #42b983;
  cursor: pointer;
}

.recordButton:disabled {
  background-color: rgba(16, 16, 16, 0.3);
  cursor: not-allowed;
}

.recordInput {
  width: 300px;
  text-align: center;
  margin: auto;
}

.recordInput::-webkit-file-upload-button {
  visibility: hidden;
  width: 0px;
}
.recordInput::before {
  visibility: hidden;
  width: 0px;
}

#stepText {
  font-size: 30px;
}

.spacer {
  height: 100px;
}
</style>
