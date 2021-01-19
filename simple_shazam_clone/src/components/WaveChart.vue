<template>
  <canvas ref="waveCanvas" class="waveCanvas" :width="cWidth" :height="cHeight">

  </canvas>
</template>

<script lang="ts">
import {Component, Prop, Vue, Watch} from 'vue-property-decorator';

@Component
export default class WaveChart extends Vue {
  @Prop() private cWidth!: number;
  @Prop() private cHeight!: number;
  @Prop() private cellSize!: number;
  @Prop() private timeDomain!: number[];
  @Prop() private maxTime!: number;
  @Prop() private sampleRate!: number;
  @Prop() private maxAmp!: number;

  drawTimeOut: number | undefined;

  fontSize = (this.cellSize >= 20) ? this.cellSize : this.cellSize * 2;

  drawWave(canvas: HTMLCanvasElement, context: CanvasRenderingContext2D) {
    const horizontalBase = this.fontSize + this.cellSize;
    const verticalBase = canvas.height / 2;
    const sampleStepSize = (canvas.width - this.fontSize * 2 - this.cellSize * 2) / this.timeDomain.length;

    context.save();
    context.beginPath();
    context.strokeStyle = '#43b420';
    context.lineWidth = 2;

    context.moveTo(this.cellSize + this.fontSize, verticalBase);
    for(let i = 0; i < this.timeDomain.length; i++) {
      context.lineTo(
          horizontalBase + sampleStepSize * i,
          verticalBase - (this.timeDomain[i] / this.maxAmp * (verticalBase - this.fontSize - this.cellSize)),
      );
    }

    context.stroke();
    context.restore();

    this.drawAxis(canvas, context)
  }

  drawAxis(canvas: HTMLCanvasElement, context: CanvasRenderingContext2D) {
    const verticalBase = canvas.height / 2;
    const horizontalBase = this.fontSize + this.cellSize;
    const maxDrawHeight = canvas.height - 2 * this.fontSize - 2 * this.cellSize;

    context.save();
    context.beginPath();
    context.strokeStyle = '#000000';
    context.lineWidth = 2;
    context.font = `${this.fontSize / 1.5}px Arial`;
    context.textAlign = 'center';

    context.moveTo(this.fontSize, canvas.height / 2);
    context.lineTo(canvas.width - this.fontSize, canvas.height / 2);

    const xStepSize = (canvas.width - this.fontSize * 2 - this.cellSize * 2) / this.maxTime;

    for (let x = 0; x < this.maxTime; x += 1) {
      context.moveTo(x * xStepSize + horizontalBase, verticalBase + this.cellSize / 2);
      context.lineTo(x * xStepSize + horizontalBase, verticalBase - this.cellSize / 2);

      if(x > 0) {
        context.fillText(
            `${x}`,
            x * xStepSize + horizontalBase,
            verticalBase + this.fontSize / 1.5 + this.cellSize / 2,
        )
      }
    }

    context.moveTo(horizontalBase, canvas.height - this.fontSize);
    context.lineTo(horizontalBase, this.fontSize);

    const yStepSize = maxDrawHeight / 2 / 5;

    for (let y = yStepSize; y < maxDrawHeight / 2; y += yStepSize) {
      context.moveTo(horizontalBase - this.cellSize / 2, verticalBase + y);
      context.lineTo(horizontalBase + this.cellSize / 2, verticalBase + y);

      context.moveTo(horizontalBase - this.cellSize / 2, verticalBase - y);
      context.lineTo(horizontalBase + this.cellSize / 2, verticalBase - y);
    }

    context.stroke();

    context.beginPath();
    context.moveTo(canvas.width - this.fontSize, canvas.height / 2);
    context.lineTo(canvas.width - this.cellSize - this.fontSize, verticalBase + this.cellSize * 0.5);
    context.lineTo(canvas.width - this.cellSize - this.fontSize, verticalBase - this.cellSize * 0.5);
    context.fill()

    context.beginPath();
    context.moveTo(this.fontSize + this.cellSize, this.fontSize);
    context.lineTo(this.fontSize + 1.5 * this.cellSize, this.fontSize + this.cellSize);
    context.lineTo(this.fontSize + 0.5 * this.cellSize, this.fontSize + this.cellSize);
    context.fill()

    context.font = `${this.fontSize}px Arial`;
    context.fillText(`${Math.round(this.maxAmp)}`, horizontalBase, this.fontSize * 0.9);

    context.fillText('Time (s)', canvas.width / 2, canvas.height - this.fontSize * 0.25);

    context.translate(this.fontSize, (verticalBase - this.fontSize) / 2);
    context.rotate(-Math.PI/2);
    context.fillText('Power', 0, 0);
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

  @Watch("timeDomain")
  updateDraw() {
    clearTimeout(this.drawTimeOut)
    this.drawTimeOut = setTimeout(() => {
      console.log("Changed TimeDomain");
      this.onResize();
    }, 3000);
  }
}
</script>

<!-- Add "scoped" attribute to limit CSS to this component only -->
<style scoped lang="scss">
</style>
