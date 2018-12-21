/**
 * 编译系统
 *
 * @author yutent<yutent@doui.cc>
 * @date 2018/12/20 11:37:54
 */

'use strict'

const vsc = require('vscode')
const exec = require('child_process').exec
const path = require('path')
const os = require('os')
const kill = require('tree-kill')

const log = console.log
const std = vsc.window.createOutputChannel('build-system')
std.out = function(msg) {
  std.appendLine(msg)
}

const EXTS = {
  '.bat': 'cmd /c',
  '.dart': 'dart',
  '.go': 'go run',
  '.js': 'node',
  '.json': 'npm start',
  '.py': 'python -u',
  '.sh': 'bash',
  '.swift': 'swift',
  '.ts': 'ts-note'
}

const BuildSystem = {
  build() {
    let editor = vsc.window.activeTextEditor

    if (this.__RUNNING__) {
      return
    }

    if (editor) {
      this.__DOC__ = editor.document
      this.__CWD__ = path.dirname(this.__DOC__.fileName)

      if (this.__DOC__.languageId === 'Log') {
        return
      }

      // 先保存
      if (this.__OPTION__.saveBeforeBuild) {
        vsc.workspace
          .saveAll()
          .then(_ => {
            if (this.__DOC__.isUntitled) {
              if (!this.__DOC__.isDirty) {
                return Promise.reject('空文件无法直接执行...')
              }
              return this.__DOC__.save()
            }
            return true
          })
          .then(saved => {
            log(this.__DOC__, saved)
            if (saved) {
              this.__start__()
            }
          })
          .catch(err => {
            vsc.window.showInformationMessage('空文件无法直接执行...')
          })
      } else {
        this.__start__()
      }
    }
  },

  stop() {
    if (this.__PROGRESS__) {
      kill(this.__PROGRESS__.pid)
    }
    this.__RUNNING__ = false
    // todo...
  },

  // 初始化 配置
  __init__(opt) {
    this.__OPTION__ = opt
  },

  __start__() {
    this.__parseCmd__()

    log(this.__CMD__)
    if (!this.__CMD__) {
      return
    }

    this.__RUNNING__ = true
    if (this.__OPTION__.runInTerminal) {
      this.__runInTerminal__()
    } else {
      this.__output__()
    }
  },

  __parseCmd__() {
    let firstLine = this.__DOC__.lineAt(0).text
    let ext = path.extname(this.__DOC__.fileName)
    let lang = EXTS[ext]
    if (firstLine.startsWith('#!')) {
      lang = firstLine.slice(2)
    }
    if (!lang) {
      this.__CMD__ = null
      if (this.__OPTION__.runInTerminal) {
        if (this.__TERMINAL__) {
          vsc.commands.executeCommand('workbench.action.terminal.clear')
        }
      } else {
        std.clear()
      }
      return vsc.window.showInformationMessage('不支持的语言...')
    }
    this.__CMD__ = `${lang} "${this.__DOC__.fileName}"`
  },

  // 在终端内运行
  __runInTerminal__() {
    let hasTerminal = vsc.window.terminals.some(it => it.name === 'BuildSystem')

    if (hasTerminal) {
      vsc.window.terminals.forEach(it => {
        if (it.name === 'BuildSystem') {
          this.__TERMINAL__ = it
        }
      })
    } else {
      this.__TERMINAL__ = vsc.window.createTerminal('BuildSystem')
    }
    this.__TERMINAL__.show()

    if (hasTerminal) {
      vsc.commands.executeCommand('workbench.action.terminal.clear').then(_ => {
        this.__TERMINAL__.sendText(this.__CMD__)
        this.__RUNNING__ = false
      })
    } else {
      this.__TERMINAL__.sendText(this.__CMD__)
      this.__RUNNING__ = false
    }
  },

  // 直接输出
  __output__() {
    // 运行前先清除之前的输出
    std.clear()

    std.show(true)

    let t1 = Date.now()

    this.__PROGRESS__ = exec(this.__CMD__, { cwd: this.__CWD__ })

    // 运行输出
    this.__PROGRESS__.stdout.on('data', _ => {
      std.append(_)
    })

    // 异常输出
    this.__PROGRESS__.stderr.on('data', _ => {
      std.append(_)
    })

    // 结束
    this.__PROGRESS__.on('close', _ => {
      let t2 = Date.now()
      let time = (t2 - t1) / 1000
      std.out('')
      std.out('[Finished in ' + time + ' seconds]')
      this.__PROGRESS__ = null
      this.__RUNNING__ = false
    })
  }
}

module.exports = BuildSystem
