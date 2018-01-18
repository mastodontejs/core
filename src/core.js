const init = require('./init')
const chalk = require('chalk')
const addService = require('./addService')

const settingsDefault = {
  host: '0.0.0.0',
  port: 8000,
  mongodb: 'mongodb://localhost:27017/test',
  session: 'Your Session Secret goes here',
  viewsDir: 'views',
  viewEngine: 'html',
  publicDir: 'public',
  services: {},
  addService
}

class Core {
  constructor(settings) {
    this.settings = Object.assign({}, settingsDefault, settings)
    this.app = init(this.settings)
    this.modules = []
  }

  add(appName, appModule) {
    const { modules } = this

    if (modules) {
      modules.push({
        appRoute: `/${appName}`,
        appModule
      })
    }
  }

  run() {
    const { app, settings, modules, routes } = this

    if (app) {
      if (routes && routes !== {}) {
        app.use('/', routes)
      }
  
      if (modules.length > 0) {
        modules.forEach(m => {
          const { appRoute, appModule } = m
  
          app.use(appRoute, appModule(settings))
        })
      }
  
      app.listen(app.get('port'), () => {
        console.log(
          `%s App is running at ${app.get('host')}:%d in %s mode`,
          chalk.green('✓'),
          app.get('port'),
          app.get('env'),
        );
        console.log('  Press CTRL-C to stop\n')
      })
    }
  }
}

module.exports = Core