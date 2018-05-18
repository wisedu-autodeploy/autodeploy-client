<template>
  <div class="hello">
    <div style="margin-bottom: 16px; text-align:center;">
      <Steps :current="currentStep">
          <Step title="登录" content="登录 gitlab"></Step>
          <Step title="部署" content="选择项目部署"></Step>
      </Steps>
    </div>

    <div style="display: flex; flex-direction: column; align-items: center;">
      <div v-show="currentStep === 0" style="width: 400px;">
        <Input v-model="username" placeholder="username" @on-enter="login"></Input>
        <Input v-model="password" placeholder="password" @on-enter="login" type="password"></Input>
        <div style="margin-top: 8px;">
          <Button type="default" :disabled="!hasLogin" @click="nextStep">下一步</Button>
          <Button type="primary" @click="login">{{hasLogin ? '更新数据' : '登录'}}</Button>
        </div>

      </div>

      <div v-show="currentStep === 1" style="width: 600px; display: flex; flex-direction: column; align-items: center;">
        <div style="width: 400px;">
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
            <Button type="default" @click="login">更新数据</Button>
            <Button type="primary" :disabled="disableDeploy" @click="deploy(null)">部署</Button>
          </div>
        </div>

        <div style="margin-top: 16px">
          <h2>历史记录</h2>
          <Table border :columns="historyColumns" :data="historyData"></Table>
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
    data() {
        return {
            username: '',
            password: '',
            gitlabAppIndex: null,
            marathonAppIndex: null,
            gitlabApps: [],
            marathonApps: [],

            currentStep: 0,
            logining: false,
            latestUUID: '',


            historyData: [],
            historyColumns: [
                {
                    title: '项目名称',
                    key: 'name',
                    render: (h, params) => {
                        return h('div', [
                          h('span', {
                            style: {
                              color: 'blue'
                            }
                          }, [params.row.maintainer]),
                          h('span', ['/']),
                          h('span', {
                            style: {
                              fontWeight: 'bold',
                              color: 'red'
                            }
                          }, [params.row.name])
                        ])
                    }
                },
                {
                    title: 'marathon_id',
                    key: 'marathon_id'
                },
                {
                    title: 'option',
                    key: 'option',
                    width: 150,
                    render: (h, params) => {
                        return h('div', {
                          style: {
                            display: "flex",
                            justifyContent: "space-around",
                          }
                        }, [
                            h(
                                'Button',
                                {
                                    props: {
                                        type: 'primary',
                                        size: 'small',
                                    },
                                    on: {
                                        click: () => {
                                            this.deploy(params.row)
                                        }
                                    }
                                },
                                '再次部署'
                            ),
                            h(
                                'Button',
                                {
                                    props: {
                                        type: 'error',
                                        size: 'small',
                                    },
                                    on: {
                                        click: () => {
                                            this.remove(params.row)
                                        }
                                    }
                                },
                                '删除'
                            )
                        ])
                    }
                }
            ]
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
        },
        logHref() {
            const splices = location.href.split('#/')
            return splices[0] + '#' + '/deploy-log/' + this.latestUUID
        },
        disableDeploy() {
          return !this.selectedGitlabApp || !this.selectedMarathonApp
        }
    },
    methods: {
        async login() {
            store.set('userInfo', {
                username: this.username,
                password: this.password
            })

            this.logining = true
            const { data: resData } = await axios.post('/v1/api/login', {
                username: this.username,
                password: this.password
            })
            this.logining = false
            const { code, data, message } = resData
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
        async deploy(params) {
            params = params || {
                username: this.username,
                password: this.password,
                maintainer: this.selectedGitlabApp.Maintainer,
                name: this.selectedGitlabApp.Name,
                marathon_id: this.selectedMarathonApp,
                marathon_name: this.selectedMarathonApp
                    .toLowerCase()
                    .replace(/[^0-9a-z-]/g, '-')
            }

            const { data: resData } = await axios.post(
                '/v1/api/autodeploy',
                params
            )
            const { code, data, message } = resData
            if (code !== '0') {
                this.$Message.error({
                    content: message
                })
                return
            }

            this.updateHistory(params)

            this.latestUUID = data.uuid

            this.$nextTick(_ => {
                window.open(this.logHref)
            })
        },

        remove(row) {
          const history = store.get('history', [])
          const existIndex = history.findIndex(it => {
              return it.maintainer === row.maintainer &&
                  it.name == row.name &&
                  it.marathon_id == row.marathon_id
          })
          if (existIndex !== -1) {
              history.splice(existIndex, 1)
          }
          store.set('history', history)
          this.historyData = history
        },

        updateHistory(params) {
            const history = store.get('history', [])
            const existIndex = history.findIndex(it => {
                return it.maintainer === params.maintainer &&
                    it.name == params.name &&
                    it.marathon_id == params.marathon_id
            })
            if (existIndex !== -1) {
                history.splice(existIndex, 1)
                history.unshift(params)
            } else {
                history.unshift(params)
            }
            history.length = history.length > 5 ? 5 : history.length // 最多保存5个
            store.set('history', history)
            this.historyData = history
        },
        prevStep() {
            this.currentStep -= 1
        },
        nextStep() {
            this.currentStep += 1
        }
    },
    created() {
        const userInfo = store.get('userInfo', {})
        const appData = store.get('appData', null)
        this.historyData = store.get('history', [])
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
    mounted() {}
}
</script>

<!-- Add "scoped" attribute to limit CSS to this component only -->
<style scoped>
h1,
h2 {
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
