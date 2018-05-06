<template>
  <div class="hello">
    <div style="margin-bottom: 16px;">
      <Steps :current="currentStep">
          <Step title="登录" content="登录 gitlab"></Step>
          <Step title="部署" content="选择项目部署"></Step>
      </Steps>
    </div>

    <div style="display: flex; flex-direction: column; align-items: center;">
      <div v-show="currentStep === 0" style="width: 400px;">
        <Input v-model="username" placeholder="username"></Input>
        <Input v-model="password" placeholder="password" type="password"></Input>
        <div style="margin-top: 8px;">
          <Button type="default" :disabled="!hasLogin" @click="nextStep">下一步</Button>
          <Button type="primary" @click="login">登录</Button>
        </div>

      </div>

      <div v-show="currentStep === 1" style="width: 400px;">
        <Select v-model="gitlabAppIndex" placeholder="选择 gitlab 项目" filterable>
            <Option
              v-for="(item, index) in gitlabApps"
              :value="index"
              :key="item.Maintainer + '/' + item.Name">
              {{ item.Maintainer + '/' + item.Name }}
            </Option>
        </Select>
        <Select v-model="marathonAppIndex" placeholder="选择 marathon 项目" filterable>
            <Option
              v-for="(item, index) in marathonApps"
              :value="index"
              :key="item">
              {{ item }}
            </Option>
        </Select>

        <div style="margin-top: 8px;">
          <Button type="default" @click="prevStep">上一步</Button>
          <Button type="primary" @click="deploy">部署</Button>
        </div>
      </div>

    </div>

    <Spin size="large" fix v-if="logining"></Spin>

  </div>
</template>

<script>
import axios from 'axios'
import store from 'store'
export default {
  name: 'HelloWorld',
  data () {
    return {
      username: '',
      password: '',
      gitlabAppIndex: null,
      marathonAppIndex: null,
      gitlabApps: [],
      marathonApps: [],

      currentStep: 0,
      logining: false,
    }
  },
  computed: {
    hasLogin() {
      return this.gitlabApps.length > 0 || this.marathonApps.length > 0
    },
    selectedGitlabApp() {
      if (this.gitlabAppIndex === null) {
        return null
      } else {
        return this.gitlabApps[this.gitlabAppIndex]
      }
    },
    selectedMarathonApp() {
      if (this.marathonAppIndex === null) {
        return null
      } else {
        return this.marathonApps[this.marathonAppIndex]
      }
    }
  },
  methods: {
    async login() {
      store.set('userInfo', {
        username: this.username,
        password: this.password,
      })

      this.logining = true
      const {data: resData } = await axios.post("/v1/api/login", {
        username: this.username,
        password: this.password,
      })
      this.logining = false
      const {code, data, message} = resData
      if (code !== '0') {
        this.$Message.error({
          content: message
        })
        return
      }

      store.set('appData', data)
      this.gitlabApps = data.gitlabApps || this.gitlabApps
      this.marathonApps = data.marathonApps || this.marathonApps
      this.currentStep = 1
    },
    async deploy() {
      const {data: resData} = await axios.post("/v1/api/autodeploy", {
        	username: this.username,
          password: this.password,
          maintainer: this.selectedGitlabApp.Maintainer,
          name: this.selectedGitlabApp.Name,
          marathonName: this.selectedMarathonApp
      })
      const {code, data, message} = resData
      if (code !== '0') {
        this.$Message.error({
          content: message
        })
        return
      }
    },
    prevStep() {
      this.currentStep -= 1
    },
    nextStep() {
      this.currentStep += 1
    },
  },
  created() {
    const userInfo = store.get('userInfo', {})
    const appData = store.get('appData', null)
    this.username = userInfo.username
    this.password = userInfo.password

    if (appData) {
      this.gitlabApps = appData.gitlabApps
      this.marathonApps = appData.marathonApps
      this.currentStep = 1
    } else {
      if (this.username && this.password) {
        this.login()
      } else {
        this.currentStep = 0
      }
    }


  },
}
</script>

<!-- Add "scoped" attribute to limit CSS to this component only -->
<style scoped>
h1, h2 {
  font-weight: normal;
}
ul {
  list-style-type: none;
  padding: 0;
}
li {
  display: inline-block;
  margin: 0 10px;
}
a {
  color: #42b983;
}
</style>
