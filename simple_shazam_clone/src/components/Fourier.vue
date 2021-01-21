<template>
  <canvas ref="waveCanvas" class="waveCanvas" :width="cWidth" :height="cHeight">

  </canvas>
</template>

<script lang="ts">
import {Component, Prop, Vue, Watch} from 'vue-property-decorator';
import {dftStepWithFrequency} from '@/models/DFT';

@Component
export default class Fourier extends Vue {
  @Prop() private cWidth!: number;
  @Prop() private cHeight!: number;
  @Prop() private cellSize!: number;
  @Prop() private timeDomain!: number[];
  @Prop() private sampleRate!: number;
  @Prop() private maxAmp!: number;
  @Prop() private testFrequency!: number;

  drawTimeOut: number | undefined;

  fontSize = (this.cellSize >= 20) ? this.cellSize : this.cellSize * 2;

  drawWave(canvas: HTMLCanvasElement, context: CanvasRenderingContext2D, maxR: number) {
    const horizontalBase = canvas.width / 2;
    const verticalBase = canvas.height / 2;

    context.save();
    context.beginPath();
    context.strokeStyle = '#43b420';
    context.lineWidth = 4;

    const step = dftStepWithFrequency(
        this.timeDomain.map((it) => (it + this.maxAmp) / (2 * this.maxAmp) * maxR),
        this.sampleRate,
        this.testFrequency,
    );

    for(let i = 0; i < step.complexValues.length; i++) {
      const vector = step.complexValues[i];

      if(i === 0) {
        context.moveTo(horizontalBase + vector.x, verticalBase + vector.y);
      } else {
        context.lineTo(horizontalBase + vector.x, verticalBase + vector.y);
      }
    }

    context.stroke();
    context.restore();

    context.save();
    context.beginPath();
    context.fillStyle = '#000000';

    for(let i = 0; i < step.complexValues.length; i++) {
      const vector = step.complexValues[i];
      context.fillRect(horizontalBase + vector.x - 2, verticalBase + vector.y - 2, 4, 4);
    }

    context.restore();

    context.save();
    context.beginPath();
    context.strokeStyle = '#000000';
    context.lineWidth = 2;
    context.fillStyle = '#FF6600';
    context.arc(
        horizontalBase + step.center.x / this.timeDomain.length,
        verticalBase + step.center.y / this.timeDomain.length,
        maxR / 20,
        0,
        2 * Math.PI,
    );
    context.fill();
    context.stroke();
    context.restore();

  }

  drawAxis(canvas: HTMLCanvasElement, context: CanvasRenderingContext2D) {
    const verticalBase = canvas.height / 2;
    const horizontalBase = canvas.width / 2;

    const maxDrawHeight = verticalBase - this.fontSize - this.cellSize;
    const maxDrawWidth = horizontalBase - this.fontSize - this.cellSize;
    const maxR = Math.min(maxDrawHeight, maxDrawWidth);

    context.save();
    context.beginPath();
    context.strokeStyle = '#000000';
    context.lineWidth = 2;
    context.font = `${this.fontSize / 1.5}px Arial`;
    context.textAlign = 'center';

    context.moveTo(this.fontSize, canvas.height / 2);
    context.lineTo(canvas.width - this.fontSize, canvas.height / 2);

    context.moveTo(horizontalBase, canvas.height - this.fontSize);
    context.lineTo(horizontalBase, this.fontSize);

    context.stroke();

    context.beginPath();
    context.moveTo(canvas.width - this.fontSize, canvas.height / 2);
    context.lineTo(canvas.width - this.cellSize - this.fontSize, verticalBase + this.cellSize * 0.5);
    context.lineTo(canvas.width - this.cellSize - this.fontSize, verticalBase - this.cellSize * 0.5);
    context.fill()

    context.beginPath();
    context.moveTo(horizontalBase, this.fontSize);
    context.lineTo(horizontalBase + 0.5 * this.cellSize, this.fontSize + this.cellSize);
    context.lineTo(horizontalBase - 0.5 * this.cellSize, this.fontSize + this.cellSize);
    context.fill()

    context.beginPath()
    context.setLineDash([5, 15]);
    context.arc(horizontalBase, verticalBase, 1 / this.maxAmp * maxR, 0, 2 * Math.PI);
    context.stroke();

    context.restore();

    this.drawWave(canvas, context, maxR);
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

      this.drawAxis(canvas, context);
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

  @Watch("timeDomain")
  updateDraw() {
    clearTimeout(this.drawTimeOut)
    this.drawTimeOut = setTimeout(() => {
      console.log("Changed TimeDomain");
      this.onResize();
    }, 3000);
  }

  @Watch("testFrequency")
  updateFreqDraw() {
    clearTimeout(this.drawTimeOut)
    this.drawTimeOut = setTimeout(() => {
      console.log("Changed K");
      this.onResize();
    }, 3000);
  }
}
</script>

<!-- Add "scoped" attribute to limit CSS to this component only -->
<style scoped lang="scss">
</style>
