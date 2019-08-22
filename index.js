#!/usr/bin/env node


const { appendFile, copy, mkdir, writeFile } = require('fs-extra')
const { resolve } = require('path')
const inquirer = require('inquirer')
const program = require('commander')
const replace = require('replace-in-file')
const { version } = require('./package.json')
const ALLOWED_TYPES = ['component', 'c', 'element', 'e', 'feature', 'f', 'service', 's']
const Logging = require('./logging')

var cp = require('child_process')
var os = require('os')

const TYPE_VALUES = {
  c: 'component',
  e: 'element',
  f: 'feature',
  s: 'service'
}

const VALID_CUSTOM_ELEMENT_NAME = /(?=.*[-])^[a-z]{1}[a-z0-9]*[a-z0-9-]*[a-z0-9]$/
const VALID_FOLDER_NAME = /^[a-z]+$/
const VALID_SERVICE_NAME = /^[A-Za-z]+$/

program
  .version(version)
  .usage('<command> <type/name> [options]')
  .on('--help', () => {
    console.log('')
    Logging.info('More command info:')
    console.log('')
    Logging.success('  $ hingejs generate -h')
    Logging.success('  $ hingejs new -h')
  })

program
  .command('generate <type> <name>')
  .alias('g')
  .description('Generate a new [component|element|feature|service] template')
  .action((type, name) => {
    type = type.toLowerCase().trim()
    name = name.trim()
    let validName = false
    if (ALLOWED_TYPES.includes(type)) {
      type = TYPE_VALUES[type] || type
      if (['component', 'element'].includes(type)) {
        validName = VALID_CUSTOM_ELEMENT_NAME.test(name)
      }
      if (['feature'].includes(type)) {
        validName = VALID_FOLDER_NAME.test(name)
      }
      if (['service'].includes(type)) {
        validName = VALID_SERVICE_NAME.test(name)
      }
      if (!validName) {
        Logging.error(name, 'is not valid to generate a type of', type)
      } else {
        generateType(type, name)
      }
    } else {
      Logging.error(`Allowed types are: ${ALLOWED_TYPES.join(', ')}`)
    }
  })
  .on('--help', () => {
    console.log('')
    Logging.info('Examples:')
    console.log('')
    Logging.info('  $ hingejs generate <type>')
    Logging.success('  $ hingejs generate component')
    Logging.success('  $ hingejs generate element')
    Logging.success('  $ hingejs generate feature')
    Logging.success('  $ hingejs generate service')
  })

program
  .command("new <projectFolderName>")
  .option('-i, --i18n', 'Internationalize the new project')
  .option('-p, --port <number>', 'integer argument', myParseInt, 9000)
  .alias('n')
  .description('Generate a new folder for the project')
  .action((projectFolderName, options) => {
    projectFolderName = projectFolderName.trim()
    if (VALID_FOLDER_NAME.test(projectFolderName)) {
      newProject(projectFolderName, options)
    } else {
      Logging.error(projectFolderName, 'is not valid name')
    }
  })
  .on('--help', () => {
    console.log('')
    console.log('Examples:')
    console.log('')
    Logging.success('  $ hingejs new <projectFolderName>')
    Logging.success('  $ hingejs new <projectFolderName> --i18n')
    Logging.success('  $ hingejs new <projectFolderName> --port 7500')
    Logging.success('  $ hingejs new <projectFolderName> --i18n --port 7500')
  })

program.parse(process.argv)

const TEMPLATES = {
  components: {
    template: './templates/components.js',
    dest: './src/components/'
  },
  elements: {
    template: './templates/elements.js',
    dest: './src/elements/'
  },
  feature: {
    template: './templates/feature/',
    dest: './src/features/'
  },
  service: {
    template: './templates/service.js',
    folder: './src/services/'
  },
  scaffold: './templates/scaffold/'
}


function myParseInt(value) {
  return parseInt(value, 10)
}

async function newProject(projectFolderName, options) {
  //options.i18n, options.port
  try {
    await mkdir(projectFolderName, { recursive: true })
    await copy(resolve(__dirname, TEMPLATES.scaffold), projectFolderName)
    await writeFile(`${projectFolderName}/.env`, `UI_APP_PORT=${options.port}`)
    await mkdir(`${projectFolderName}/src/templates`, { recursive: true })

    // npm binary based on OS
    const npmCmd = os.platform().startsWith('win') ? 'npm.cmd' : 'npm'

    // install folder
    cp.spawn(npmCmd, ['i'], { env: process.env, cwd: projectFolderName, stdio: 'inherit' })


    if(options.i18n) {
      await mkdir(`${projectFolderName}/assets/locales`, { recursive: true })
      const enJSON = {
          "global:header": "This is the home page"
      }
      await writeFile(`${projectFolderName}/assets/locales/en.json`, JSON.stringify(enJSON, undefined, 2))
      const homeHTML = `
      <template>
        <h1 data-i18n="global:header"></h1>
      </template>

      <style>
        h1 {
          color: red;
        }
      </style>
      `.trim()
      await writeFile(`${projectFolderName}/src/features/home/home.html`, homeHTML)
      const mainJS = `
        import { I18n } from '@hingejs/services'
        I18n.enableDocumentObserver()
      `.trim()
      await appendFile(`${projectFolderName}/src/main.js`, mainJS, 'utf8');
    }
    Logging.success('Files have been copied to', projectFolderName)
    Logging.info('Running npm install in', projectFolderName)
  } catch (err) {
    Logging.error(err)
  }

}

function generateType(type, name) {
  Logging.error(type, 'not yet implemented')
}
