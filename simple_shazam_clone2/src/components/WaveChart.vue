<template>
  <canvas ref="waveCanvas" class="waveCanvas">

  </canvas>
</template>

<script lang="ts">
import { Component, Prop, Vue } from 'vue-property-decorator';

@Component
export default class HelloWorld extends Vue {
  @Prop() private msg!: string;

  cellSize = 10;

  drawGrid() {
    const canvas = this.$refs.waveCanvas as HTMLCanvasElement;
    const context = canvas.getContext('2d');

    if (context !== null) {
      for (let x = this.cellSize; x < canvas.width - this.cellSize; x += this.cellSize) {
        context.moveTo(x, 0);
        context.lineTo(x, canvas.height - this.cellSize);
      }

      for (let y = this.cellSize; y < canvas.height - this.cellSize; y += this.cellSize) {
        context.moveTo(0, y);
        context.lineTo(canvas.width - this.cellSize, y);
      }

      context.moveTo(0, 0);
      context.lineTo(380, 380);

      context.strokeStyle = '#ddd';
      context.stroke();
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
}
</script>

<!-- Add "scoped" attribute to limit CSS to this component only -->
<style scoped lang="scss">
  .waveCanvas {
    width:100%;
    height: 100%;
  }
</style>
