<template>
  <div class="home">

    <div>
      <h1 class="stepText"> Convert Song to hashes: </h1>
    </div>

    <div>
      <button class="recordButton" @click="$refs.songInput.click()">Choose Songs</button>
    </div>

    <div>
      <input
          class="recordInput"
          ref="songInput"
          type="file"
          name="files[]"
          multiple
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

    <div class="spacer"></div>

    <div>
      <h1> Songs in Database: </h1>
    </div>

    <div v-for="song in songs" :key="song.name">
      <h3>
        {{`${song.name} (${Math.round(song.duration)} Sekunden)`}}
      </h3>
    </div>
  </div>
</template>

<script lang="ts">
import {Component, Prop, Vue} from 'vue-property-decorator';
import {AudioProcessor, createAudioProcessor} from '@/models/AudioProcessor';
import {Song, SongDatabase} from '@/models/SongDatabase'

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
  @Prop() private constellationYGroupAmount!: number;
  @Prop() private constellationXGroupSize!: number;
  @Prop() private fanOutStepFactor!: number;
  @Prop() private magnitudeThreshhold!: number;
  @Prop() private targetZoneHeight!: number;

  isRecording = false;

  currentStep = 'Select Song or Song Hashes File...';

  songs: Song[] = this.database.getSongs();

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

  selectFile(e?: HTMLInputEvent) {
    if(e && e.target.files) {
      this.isRecording = true;
      this.currentStep = `Uploading ${e.target.files.length} songs...`;

      for(let i = 0; i < e.target.files.length; i++) {
        const file = e.target.files[i];
        this.recordFromFile(file, file.name);
      }
    }
  }

  decodeFile(buffer: ArrayBuffer, songName: string) {
    this.currentStep = `Decoding Song: ${songName}`;
    const audioContext = new (window.AudioContext || window.webkitAudioContext)({ sampleRate: this.sampleRate });

    audioContext.decodeAudioData(buffer, (decoded: AudioBuffer) => {
      console.log('Calculating Time Domain...');
      const timeDomain = this.audioProcessor.getTimeDomainData(decoded);

      console.log('Calculating Spectrogram...');
      const spectrogram = this.audioProcessor.calculateSpectrogram(timeDomain);

      console.log('Calculating Constellation Map...');
      const constellation = this.audioProcessor.getConstellationPoints(spectrogram);

      console.log('Calculating Hashes...');
      const hashTokens = this.audioProcessor.calculateHashes(constellation);

      console.log('Saving Hashes...');
      this.database.addSong(songName, decoded.duration, hashTokens);

      console.log('Finished...');

      this.isRecording = false;

      this.songs.splice(0);
      this.database.getSongs().forEach((s) => {
        this.songs.push(s);
      }, () => {
        this.currentStep = 'Wrong File Type...';
      });
    });
  }

  recordFromFile(file: File, songName: string) {
    this.currentStep = 'Recording Song...';
    const fReader = new FileReader();
    const audio = this.$refs.audio as HTMLAudioElement;

    fReader.onload = (e?: ProgressEvent<FileReader>) => {
      if(e && fReader.result) {
        try {
          audio.src = fReader.result as string;
        } catch {
          this.currentStep = 'Wrong File Type...';
        }
        this.decodeFile(fReader.result as ArrayBuffer, songName);
      }
    };

    fReader.readAsArrayBuffer(file);
  }

  readHeashFile(file: File) {
    const fReader = new FileReader();
    fReader.readAsText(file, 'UTF-8');
    fReader.onload = (e?: ProgressEvent<FileReader>) => {
      if(e && fReader.result) {
        try{
          this.database.uploadHashes(JSON.parse(fReader.result as string));
        } catch {
          this.currentStep = 'Wrong File Type...';
        }

        this.songs.splice(0);
        this.database.getSongs().forEach((s) => {
          this.songs.push(s);
        });
      }
    }
  }

  uploadHeashFiles(e?: HTMLInputEvent) {
    if(e && e.target.files) {
      this.isRecording = true;
      this.currentStep = `Uploading hashes of ${e.target.files.length} songs...`;

      for(let i = 0; i < e.target.files.length; i++) {
        this.readHeashFile(e.target.files[i]);
      }

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
