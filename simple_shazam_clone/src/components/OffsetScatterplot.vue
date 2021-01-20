<template>
  <canvas ref="waveCanvas" class="waveCanvas" :width="cWidth" :height="cHeight">

  </canvas>
</template>

<script lang="ts">
import {Component, Prop, Vue, Watch} from 'vue-property-decorator';
import {MatchingPoint} from '@/models/SongDatabase'
import BigNumber from 'bignumber.js'

@Component
export default class OffsetScatterplot extends Vue {
  @Prop() private cWidth!: number;
  @Prop() private cHeight!: number;
  @Prop() private cellSize!: number;
  @Prop() private points!: MatchingPoint[];
  @Prop() private maxTime!: number;

  drawTimeOut: number | undefined;

  fontSize = (this.cellSize >= 20) ? this.cellSize : this.cellSize * 2;

  drawPoints(canvas: HTMLCanvasElement, context: CanvasRenderingContext2D) {
    let maxX = '0';

    if(this.points.length > 0) {
      const verticalBase = canvas.height - this.fontSize - this.cellSize * 2;
      const horizontalBase = this.fontSize + this.cellSize;
      const maxDrawWidth = canvas.width - this.fontSize * 2 - this.cellSize * 2;
      const maxDrawHeight = verticalBase - this.fontSize - this.cellSize;

      for(let i = 0; i < this.points.length; i++) {
        const currentPoint = this.points[i];
        if (new BigNumber(currentPoint.songOffset).comparedTo(maxX) > 0) maxX = currentPoint.songOffset;
      }

      context.save();
      context.beginPath();
      context.fillStyle = '#000000';

      context.moveTo(this.cellSize + this.fontSize, verticalBase);
      this.points.forEach((point) => {
        context.fillRect(
            horizontalBase + (new BigNumber(point.songOffset).dividedBy(maxX).toNumber() * maxDrawWidth) - 1,
            verticalBase - (new BigNumber(point.sampleOffset).toNumber() / (this.maxTime * 1000) * maxDrawHeight) - 1,
            2,
            2,
        );
      });

      context.stroke();
      context.restore();
    }

    this.drawAxis(canvas, context, maxX);
  }

  drawAxis(canvas: HTMLCanvasElement, context: CanvasRenderingContext2D, maxX: string) {
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

    if(this.points.length > 0) {
      const xStepSize = maxDrawWidth / 10;
      const yStepSize = maxDrawHeight / 5;

      const xLabelSteps = new BigNumber(maxX).dividedBy(10).toNumber();

      for (let x = 0; x < 10; x += 1) {
        context.moveTo(x * xStepSize + horizontalBase, verticalBase + this.cellSize / 2);
        context.lineTo(x * xStepSize + horizontalBase, verticalBase - this.cellSize / 2);

        if(x > 0) {
          context.fillText(
              `${Math.round(x * xLabelSteps) / 1000}`,
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
    context.fillText(`${Math.round(this.maxTime)}`, horizontalBase, this.fontSize * 0.9);

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

      this.drawPoints(canvas, context);
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

  @Watch("points")
  updateSpec() {
    clearTimeout(this.drawTimeOut)
    this.drawTimeOut = setTimeout(() => {
      console.log("Changed Offset Scatterplot Points");
      this.onResize();
    }, 3000);
  }
}
</script>

<!-- Add "scoped" attribute to limit CSS to this component only -->
<style scoped lang="scss">
</style>
