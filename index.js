/**
 * build system
 * @author yutent<yutent@doui.cc>
 * @date 2018/12/20 10:46:07
 */

'use strict'

const vsc = require('vscode')

const BuildSystem = require('./build_system')

function activate(ctx) {
  let conf = vsc.workspace.getConfiguration('BuildSystem')

  BuildSystem.__init__(conf)

  vsc.window.onDidCloseTerminal(() => {
    // BuildSystem.onDidCloseTerminal()
  })

  const build = vsc.commands.registerCommand('BuildSystem.build', _ => {
    BuildSystem.build()
  })

  const stop = vsc.commands.registerCommand('BuildSystem.stop', _ => {
    BuildSystem.stop()
  })

  ctx.subscriptions.push(build)
  ctx.subscriptions.push(stop)
}

function deactivate() {}

exports.activate = activate
exports.deactivate = deactivate
