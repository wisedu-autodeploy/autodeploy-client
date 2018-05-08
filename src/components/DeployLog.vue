<template>
  <div style="padding: 16px;
              display: flex;
              flex-direction: column;
              align-items: center;">
    <div style="font-size: 16px; margin-bottom: 16px; font-weight: bold;" class="title">{{title}}</div>
    <div style="display: flex;">
      <Steps :current="step" direction="vertical">
        <Step title="TAGING" :content="tag"></Step>
        <Step title="BUILDING" :content="image"></Step>
        <Step title="DEPLOYING" content="DEPLOYING"></Step>
        <Step title="FINISH" content="FINISH"></Step>
      </Steps>
      <div class="status" style="width: 250px;">
        STATUS：{{status}}
      </div>
    </div>
  </div>
</template>

<script>
const { fromJS } = require('immutable')
export default {
  data() {
    return {
      data: fromJS({}),
    }
  },
  computed: {
    uuid() {
      return this.$route.params.uuid
    },
    step() {
      return this.data.getIn(['data', 'step'], 0)
    },
    title() {
      const maintainer = this.data.getIn(['data', 'params', 'maintainer'], '')
      const projectName = this.data.getIn(['data', 'params', 'name'], '')
      const marathonName = this.data.getIn(['data', 'params', 'marathon_name'], '')
      return `${maintainer}/${projectName} -> ${marathonName}`
    },
    tag() {
      return this.data.getIn(['data', 'tag'], '')
    },
    image() {
      return this.data.getIn(['data', 'image'], '')
    },
    status() {
      const status = this.data.getIn(['data', 'status'], 0)
      switch (status) {
        case 0: return 'NOT START'
        case 1: return 'RUNNING'
        case 2: return 'SUCCEED'
        case -1: return 'FAILED'
        default: return 'I DONT KNOW'
      }
    }
  },
  created() {
    const wsUrl = `ws://${location.host}/deploy/${this.uuid}`
    const ws = new WebSocket(wsUrl)
    ws.onopen = (evt) => {
      ws.send(this.uuid) // 开始部署
    }
    ws.onmessage = (msg) => {
      this.data = fromJS(JSON.parse(msg.data))
    }
  }
}
</script>

