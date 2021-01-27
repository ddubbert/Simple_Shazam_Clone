import Vue from 'vue'
import VueRouter, { RouteConfig } from 'vue-router'
import RecordSample from '../views/RecordSample.vue'
import {createSongDatabase} from '@/models/SongDatabase'
import {shazamConfig} from '@/models/ShazamConfig'

Vue.use(VueRouter)

const database = createSongDatabase();

const routes: Array<RouteConfig> = [
  {
    path: '/RecordSample',
    name: 'RecordSample',
    component: RecordSample,
    props: {
      database,
      ...shazamConfig,
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
      ...shazamConfig,
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
      ...shazamConfig,
    }
  },
]

const router = new VueRouter({
  mode: 'history',
  base: process.env.BASE_URL,
  routes
})

export default router
