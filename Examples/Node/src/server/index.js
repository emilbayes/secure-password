const app = require('./app')
const WEB_PORT = 8000

app.listen(WEB_PORT, () => {
  // eslint-disable-next-line no-console
  console.log(`Server running on port ${WEB_PORT}.`)
})