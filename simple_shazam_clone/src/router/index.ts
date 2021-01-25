import Vue from 'vue'
import VueRouter, { RouteConfig } from 'vue-router'
import RecordSample from '../views/RecordSample.vue'
import {createSongDatabase} from '@/models/SongDatabase'

Vue.use(VueRouter)

const database = createSongDatabase();
const sampleRate = 44100;
const bufferSize = 4096;
const stftWindowSize = 2048;
const stftHopSize = stftWindowSize / 2;
const fanOutFactor = 10;
const constellationYGroupAmount = 20;
const constellationXGroupSize = 1;
const fanOutStepFactor = 2;
const targetZoneHeight = 5;
const magnitudeThreshhold = stftWindowSize / 50;

const routes: Array<RouteConfig> = [
  {
    path: '/RecordSample',
    name: 'RecordSample',
    component: RecordSample,
    props: {
      database,
      sampleRate,
      bufferSize,
      stftWindowSize,
      stftHopSize,
      fanOutFactor,
      constellationYGroupAmount,
      constellationXGroupSize,
      fanOutStepFactor,
      magnitudeThreshhold,
      targetZoneHeight,
    }
  },
  {
    path: '/',
    name: 'Database',
    // route level code-splitting
    // this generates a separate chunk (about.[hash].js) for this route
    // which is lazy-loaded when the route is visited.
    component: () => import(/* webpackChunkName: "about" */ '../views/RecordSong.vue'),
    props: {
      database,
      sampleRate,
      bufferSize,
      stftWindowSize,
      stftHopSize,
      fanOutFactor,
      constellationYGroupAmount,
      constellationXGroupSize,
      fanOutStepFactor,
      magnitudeThreshhold,
      targetZoneHeight,
    }
  },
  {
    path: '/Sinusoids',
    name: 'Sinusoids',
    // route level code-splitting
    // this generates a separate chunk (about.[hash].js) for this route
    // which is lazy-loaded when the route is visited.
    component: () => import(/* webpackChunkName: "about" */ '../views/SinusiodDrawer.vue'),
    props: {
      bufferSize,
      stftWindowSize,
      stftHopSize,
      fanOutFactor,
      constellationYGroupAmount,
      constellationXGroupSize,
      fanOutStepFactor,
      magnitudeThreshhold,
      targetZoneHeight,
    }
  },
]

const router = new VueRouter({
  mode: 'history',
  base: process.env.BASE_URL,
  routes
})

export default router
