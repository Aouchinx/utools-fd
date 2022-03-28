// noinspection JSUnresolvedVariable,JSUnusedGlobalSymbols,JSUnresolvedFunction

const { execFile } = require("child_process")
const workdir = '/Users/aouchinx/ws/'
let count = 0

const search = ({ triggerCount, text }, callback) => {
  if (triggerCount !== count) return;
  let cmd
  const words = text.split(' ').filter((value) => !!value)
  if (words.length === 1) {
    cmd = `/usr/local/bin/fd -c=never -H --max-results=20 '${text}' ${workdir} | xargs ls -ldh`
  } else {
    const reg = words.map((word) => `(${word})`).join('|')
    cmd = `/usr/local/bin/fd -c=never -Hl '${reg}' ${workdir}`
  }
  const searchResultTransformer = (error, stdout, stderr) => {
    const trimText = `${stdout.toString().trim()}`
    let list = []
    if (!!trimText) {
      const wordsRegex = words.map((word) => `(?=.*${word})`).join('')
      const reg = new RegExp(`^${wordsRegex}.*$`, 'i')
      list = trimText.split('\n').filter((line) => reg.test(line)).map((content, index) => {
        const arr = content.split(` ${workdir}`)
        return { title: arr[1] || '', description: `${index + 1}) ${arr[0] || ''}` }
      })
    }
    triggerCount === count && callback(list)
    error && utools.showNotification(`error.message: ${error.message}`)
    stderr && utools.showNotification(`stderr: ${stderr}`)
  }
  const subprocess = execFile(cmd, [], { shell: true, maxBuffer: 10485760 }, searchResultTransformer)
  subprocess.unref()
}

window.search = search

window.delaySearch = ({ triggerCount, text }, callback) => {
  if (!text) {
    callback([])
    return
  }
  setTimeout(() => search({ triggerCount, text }, callback), 300)
}

window.exports = {
  "fd": {
    mode: "list", args: {
      // enter: (action, callback) => {},
      search: (action, text, callback) => window.delaySearch({ triggerCount: ++count, text: text.trim() }, callback),
      select: (action, itemData) => utools.shellOpenItem(`${workdir}${itemData.title}`),
      placeholder: "搜索工作目录，单个条件最多展示20条搜索结果记录"
    }
  }
}
