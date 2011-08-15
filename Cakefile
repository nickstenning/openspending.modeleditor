fs = require 'fs'
path = require 'path'
{print, debug} = require 'sys'
{spawn, exec} = require 'child_process'

task 'watch', 'Run development source watcher', ->
  util.relay 'coffee', ['-w', '-b', '-c', '-o', 'lib/', 'src/'], util.noisyPrint

task 'compile', 'Compile production source', ->
  util.relay 'coffee', ['-j', 'main.js', '-c', 'src/extensions', 'src/delegator', 'src/modeleditor'], print

util =
  # relay: run child process relaying std{out,err} to this process
  relay: (cmd, args, stdoutPrint=print, stderrPrint=debug) ->
    handle = spawn cmd, args

    handle.stdout.on 'data', (data) -> stdoutPrint(data) if data
    handle.stderr.on 'data', (data) -> stderrPrint(data) if data

  noisyPrint: (data) ->
    print data
    if data.toString('utf8').indexOf('In') is 0
      exec 'afplay ~/.autotest.d/sound/sound_fx/red.mp3 2>&1 >/dev/null'