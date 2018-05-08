import Vue from 'vue'
import Router from 'vue-router'
import HelloWorld from '@/components/HelloWorld'
import DeployLog from '@/components/DeployLog'

Vue.use(Router)

export default new Router({
  routes: [
    {
      path: '/',
      name: 'HelloWorld',
      component: HelloWorld
    },
    {
      path: '/deploy-log/:uuid',
      name: 'DeployLog',
      component: DeployLog
    }
  ]
})
