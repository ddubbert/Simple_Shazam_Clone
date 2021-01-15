<template>
  <div class="home">
    <WaveChart class="wave"></WaveChart>
  </div>
</template>

<script lang="ts">
import { Component, Vue } from 'vue-property-decorator';
import WaveChart from '@/components/WaveChart.vue'; // @ is an alias to /src

@Component({
  components: {
    WaveChart,
  },
})
export default class Home extends Vue {}
</script>
<style scoped lang="scss">
  .wave {
    top: 10%;
    width:80%;
    height: 10%;
    left: 10%;
  }
</style>
