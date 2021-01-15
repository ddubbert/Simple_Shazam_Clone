<template>
  <canvas ref="waveCanvas" class="waveCanvas" :width="cWidth" :height="cHeight">

  </canvas>
</template>

<script lang="ts">
import {Component, Prop, Vue, Watch} from 'vue-property-decorator';
import {FreqMagPair} from '@/@types/Signal'

@Component
export default class FreqChart extends Vue {
  @Prop() private msg!: string;
  @Prop() private cWidth!: number;
  @Prop() private cHeight!: number;
  @Prop() private cellSize!: number;
  @Prop() private spectrumPairs!: FreqMagPair[];
  @Prop() private maxMag!: number;
  @Prop() private sampleRate!: number;

  drawTimeOut: number | null = null;

  fontSize = (this.cellSize >= 20) ? this.cellSize : this.cellSize * 2;

  drawWave(canvas: HTMLCanvasElement, context: CanvasRenderingContext2D) {
    const verticalBase = canvas.height - this.fontSize - this.cellSize * 2;
    const horizontalBase = this.fontSize + this.cellSize;
    const freqStepSize = (canvas.width - this.fontSize * 2 - this.cellSize * 2) / this.spectrumPairs.length;

    context.save();
    context.beginPath();
    context.strokeStyle = '#43b420';
    context.lineWidth = 2;

    context.moveTo(this.cellSize + this.fontSize, verticalBase);
    this.spectrumPairs.forEach(({ magnitude }, i) => {
      context.lineTo(
          horizontalBase + freqStepSize * i,
          verticalBase - (magnitude / this.maxMag * (verticalBase - this.fontSize - this.cellSize)),
      );
    });

    context.stroke();
    context.restore();

    this.drawAxis(canvas, context)
  }

  drawAxis(canvas: HTMLCanvasElement, context: CanvasRenderingContext2D) {
    const verticalBase = canvas.height - this.fontSize - this.cellSize * 2;
    const horizontalBase = this.fontSize + this.cellSize;

    context.save();
    context.beginPath();
    context.strokeStyle = '#000000';
    context.lineWidth = 2;
    context.font = `${this.fontSize / 1.5}px Arial`;
    context.textAlign = 'center';

    context.moveTo(this.fontSize, verticalBase);
    context.lineTo(canvas.width - this.fontSize, verticalBase);

    const spectrumLength = this.spectrumPairs.length;
    const maxDrawWidth = canvas.width - this.fontSize * 2 - this.cellSize * 2;

    if(spectrumLength > 0) {
      const binSize = this.sampleRate / 2 / spectrumLength;
      const xBinSize = maxDrawWidth / spectrumLength;
      const xStepSize = Math.max(xBinSize, this.cellSize * 2);
      const shownBinSize = xStepSize / xBinSize * binSize;

      for (let x = 1; x <= maxDrawWidth / xStepSize; x += 1) {
        context.moveTo(x * xStepSize + horizontalBase, verticalBase - this.cellSize / 2);
        context.lineTo(x * xStepSize + horizontalBase, verticalBase + this.cellSize / 2);

        context.fillText(
            Math.floor(x * shownBinSize),
            x * xStepSize + horizontalBase,
            verticalBase + this.fontSize / 1.5 + this.cellSize / 2,
        )
      }
    }

    context.moveTo(horizontalBase, canvas.height - this.fontSize);
    context.lineTo(horizontalBase, this.fontSize);

    for (let y = this.fontSize + this.cellSize; y < verticalBase; y += this.cellSize * 2) {
      context.moveTo(horizontalBase - this.cellSize / 2, y);
      context.lineTo(horizontalBase + this.cellSize / 2, y);
    }

    context.stroke();

    context.beginPath();
    context.moveTo(canvas.width - this.fontSize, verticalBase);
    context.lineTo(canvas.width - this.fontSize - this.cellSize, verticalBase + this.cellSize / 2);
    context.lineTo(canvas.width - this.fontSize - this.cellSize, verticalBase - this.cellSize / 2);
    context.fill()

    context.beginPath();
    context.moveTo(this.fontSize + this.cellSize, this.fontSize);
    context.lineTo(this.fontSize + 1.5 * this.cellSize, this.fontSize + this.cellSize);
    context.lineTo(this.fontSize + 0.5 * this.cellSize, this.fontSize + this.cellSize);
    context.fill()

    context.font = `${this.fontSize}px Arial`;
    context.fillText('Frequency (Hz)', canvas.width / 2, canvas.height - this.fontSize * 0.25);

    context.translate(this.fontSize, (verticalBase - this.fontSize) / 2);
    context.rotate(-Math.PI/2);
    context.fillText('Magnitude', 0, 0);
    context.restore();
  }

  drawGrid() {
    const canvas = this.$refs.waveCanvas as HTMLCanvasElement;
    const context = canvas.getContext('2d');

    if (context !== null) {
      context.beginPath();
      context.strokeStyle = '#ddd';

      for (let x = this.fontSize; x < canvas.width - this.fontSize; x += this.cellSize) {
        context.moveTo(x, this.fontSize);
        context.lineTo(x, canvas.height - this.fontSize);
      }

      for (let y = this.fontSize; y < canvas.height - this.fontSize; y += this.cellSize) {
        context.moveTo(this.fontSize, y);
        context.lineTo(canvas.width - this.fontSize, y);
      }

      context.moveTo(this.fontSize, this.fontSize);
      context.lineTo(canvas.width - this.fontSize, this.fontSize);
      context.lineTo(canvas.width - this.fontSize, canvas.height - this.fontSize);
      context.lineTo(this.fontSize, canvas.height - this.fontSize);
      context.lineTo(this.fontSize, this.fontSize);
      context.stroke();

      context.moveTo(0, 0);
      context.lineTo(canvas.width, 0);
      context.lineTo(canvas.width, canvas.height);
      context.lineTo(0, canvas.height);
      context.lineTo(0, 0);
      context.stroke();

      this.drawWave(canvas, context);
    }
  }

  clearGrid() {
    const canvas = this.$refs.waveCanvas as HTMLCanvasElement;
    const context = canvas.getContext('2d');

    if (context !== null) {
      context.clearRect(0, 0, canvas.width, canvas.height);
    }
  }

  onResize() {
    this.clearGrid();
    this.drawGrid();
  }

  mounted() {
    this.$nextTick(() => {
      this.onResize();
      window.addEventListener('resize', this.onResize);
    });
  }

  beforeDestroy() {
    window.removeEventListener('resize', this.onResize);
  }

  @Watch("spectrumPairs")
  updateSpec() {
    clearTimeout(this.drawTimeOut)
    this.drawTimeOut = setTimeout(() => {
      console.log("Change");
      this.onResize();
    }, 3000);
  }

  @Watch("maxMag")
  updateMaxMag() {
    clearTimeout(this.drawTimeOut)
    this.drawTimeOut = setTimeout(() => {
      console.log("Change");
      this.onResize();
    }, 3000);
  }
}
</script>

<!-- Add "scoped" attribute to limit CSS to this component only -->
<style scoped lang="scss">
</style>
