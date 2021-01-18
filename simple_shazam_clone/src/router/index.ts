import Vue from 'vue'
import VueRouter, { RouteConfig } from 'vue-router'
import RecordSample from '../views/RecordSample.vue'
import {createSongDatabase} from '@/models/SongDatabase'

Vue.use(VueRouter)

const database = createSongDatabase();
const sampleRate = 44100;
const bufferSize = 4096;
const stftWindowSize = 1024;
const stftHopSize = stftWindowSize / 2;
const fanOutFactor = 10;

const routes: Array<RouteConfig> = [
  {
    path: '/',
    name: 'RecordSample',
    component: RecordSample,
    props: {
      database,
      sampleRate,
      bufferSize,
      stftWindowSize,
      stftHopSize,
      fanOutFactor,
    }
  },
  {
    path: '/RecordSong',
    name: 'RecordSong',
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
    }
  }
]

const router = new VueRouter({
  mode: 'history',
  base: process.env.BASE_URL,
  routes
})

export default router
