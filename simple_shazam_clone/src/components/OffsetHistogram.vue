<template>
  <canvas ref="waveCanvas" class="waveCanvas" :width="cWidth" :height="cHeight">

  </canvas>
</template>

<script lang="ts">
import {Component, Prop, Vue, Watch} from 'vue-property-decorator';
import {Histogram} from '@/models/SongDatabase'

@Component
export default class OffsetHistogram extends Vue {
  @Prop() private cWidth!: number;
  @Prop() private cHeight!: number;
  @Prop() private cellSize!: number;
  @Prop() private histogram!: Histogram;

  drawTimeOut: number | undefined;

  fontSize = (this.cellSize >= 20) ? this.cellSize : this.cellSize * 2;

  drawBars(canvas: HTMLCanvasElement, context: CanvasRenderingContext2D) {
    let sorted: {offset: number; amount: number}[] = [];

    if(this.histogram && Object.keys(this.histogram.valueAmounts).length > 0) {
      const amountDifferentOffsets = Object.keys(this.histogram.valueAmounts).length;
      const verticalBase = canvas.height - this.fontSize - this.cellSize * 2;
      const horizontalBase = this.fontSize + this.cellSize;
      const maxDrawWidth = canvas.width - this.fontSize * 2 - this.cellSize * 2;
      const maxDrawHeight = verticalBase - this.fontSize - this.cellSize;
      const xStepSize = maxDrawWidth / amountDifferentOffsets;
      const offsets: {offset: number; amount: number}[] = [];

      for(let i = 0; i < amountDifferentOffsets; i++) {
        const offset = Object.keys(this.histogram.valueAmounts)[i];
        const pair = {
          offset: +offset,
          amount: this.histogram.valueAmounts[offset],
        }
        offsets.push(pair);
      }
      sorted = offsets.sort((a, b) => a.offset - b.offset);

      context.save();
      context.beginPath();
      context.fillStyle = '#43b420';

      context.moveTo(this.cellSize + this.fontSize, verticalBase);
      for (let x = 0; x < amountDifferentOffsets; x += 1) {
        const pair = sorted[x];
        const barHeight = (pair.amount / this.histogram.maxCount) * maxDrawHeight;
        context.fillRect(
            horizontalBase + (x * xStepSize),
            verticalBase - barHeight,
            2,
            barHeight,
        );
      }

      context.stroke();
      context.restore();
    }

    this.drawAxis(canvas, context, sorted)
  }

  drawAxis(canvas: HTMLCanvasElement, context: CanvasRenderingContext2D, sorted: {offset: number; amount: number}[]) {
    const verticalBase = canvas.height - this.fontSize - this.cellSize * 2;
    const horizontalBase = this.fontSize + this.cellSize;
    const maxDrawWidth = canvas.width - this.fontSize * 2 - this.cellSize * 2;
    const maxDrawHeight = verticalBase - this.fontSize - this.cellSize;

    context.save();
    context.beginPath();
    context.strokeStyle = '#000000';
    context.fillStyle = '#000000';
    context.lineWidth = 2;
    context.font = `${this.fontSize / 1.5}px Arial`;
    context.textAlign = 'center';

    context.moveTo(this.fontSize, verticalBase);
    context.lineTo(canvas.width - this.fontSize, verticalBase);

    context.moveTo(horizontalBase, canvas.height - this.fontSize);
    context.lineTo(horizontalBase, this.fontSize);

    if(sorted.length > 0) {
      const xStepSize = maxDrawWidth / 10;
      const yStepSize = maxDrawHeight / 5;

      const xLabelSteps = Math.round(sorted.length / 10);

      for (let x = 0; x < 10; x += 1) {
        context.moveTo(x * xStepSize + horizontalBase, verticalBase + this.cellSize / 2);
        context.lineTo(x * xStepSize + horizontalBase, verticalBase - this.cellSize / 2);

        if (x > 0) {
          context.fillText(
              `${Math.round(sorted[x * xLabelSteps - 1].offset) / 1000}`,
              x * xStepSize + horizontalBase,
              verticalBase + this.fontSize / 1.5 + this.cellSize / 2,
          )
        }
      }

      for (let y = verticalBase; y > this.fontSize + this.cellSize; y -= yStepSize) {
        context.moveTo(horizontalBase - this.cellSize / 2, y);
        context.lineTo(horizontalBase + this.cellSize / 2, y);
      }
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
    context.fillText(`${this.histogram.maxCount}`, horizontalBase, this.fontSize * 0.9);

    context.fillText('Offset Song', canvas.width / 2, canvas.height - this.fontSize * 0.25);

    context.translate(this.fontSize, (verticalBase - this.fontSize) / 2);
    context.rotate(-Math.PI/2);
    context.fillText('Offset Sample', 0, 0);
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

      this.drawBars(canvas, context);
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

  @Watch("histogram")
  updateSpec() {
    clearTimeout(this.drawTimeOut)
    this.drawTimeOut = setTimeout(() => {
      console.log("Changed Offset Histogram Values");
      this.onResize();
    }, 3000);
  }
}
</script>

<!-- Add "scoped" attribute to limit CSS to this component only -->
<style scoped lang="scss">
</style>
