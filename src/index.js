const {
  BaseKonnector,
  requestFactory,
  signin,
  saveBills,
  log
} = require('cozy-konnector-libs')

const request = requestFactory({
  debug: false,
  cheerio: true,
  json: false,
  jar: true
})

const baseUrl =
  'https://espace-client-red.sfr.fr/facture-fixe/consultation#sfrclicid=EC_mire_Me-Connecter'

module.exports = new BaseKonnector(start)

async function start(fields) {
  log('info', 'Authenticating ...')
  await authenticate(fields.login, fields.password)
  log('info', 'Successfully logged in')
  log('info', 'Fetching the list of documents')
  const $ = await request(`${baseUrl}`)
  log('info', 'Parsing list of documents')
  const documents = await parseDocuments($)
  log('info', 'Saving data to Cozy')
  await saveBills(documents, fields, { identifiers: ['bill'] })
  log('info', 'Logging out')
  request(
    'https://www.sfr.fr/cas/logout?url=https://www.red-by-sfr.fr/&red=true'
  )
}

function authenticate(username, password) {
  return signin({
    url:
      'https://www.sfr.fr/cas/login?service=https%3A%2F%2Fespace-client-red.sfr.fr%2Ffacture-fixe%2Fj_spring_cas_security_check#sfrintid=EC_Pass_telecom_adsl_fixe-abo',
    formSelector: 'form#loginForm',
    formData: { username, password },
    validate: statusCode => {
      return statusCode === 200 || log('error', 'Invalid credentials')
    }
  })
}

function parseDocuments($) {
  let docs = []
  $('[target=_blank]').each((i, el) => {
    let doc = {}
    const filename = deleteWhitespaces(
      $(el)
        .children()
        .first()
        .children()
        .first()
        .children()
        .first()
        .text()
    )
    const amount = deleteWhitespaces(
      $(el)
        .children()
        .last()
        .children()
        .first()
        .children()
        .first()
        .text()
    )
    doc.fileurl = convertToDownloadLink($(el).attr('href'))
    doc.filename = filename + '.pdf'
    doc.date = filename.split('-')[1]
    doc.amount = amount.slice(0, -1)
    doc.currency = findCurrency(amount)
    doc.metadata = {
      importDate: new Date(),
      version: 1
    }
//    console.log(doc)
    docs.push(doc)
  })
  return docs
}

// Convert href to download link
function convertToDownloadLink(link) {
  return link
    ? 'https://espace-client-red.sfr.fr' +
      link.replace('facturette', 'telecharger') +
      '.pdf'
    : link
}

function deleteWhitespaces(str) {
  return str.replace(/\s/g, '')
}

function findCurrency(str) {
  const currency = str.substring(str.length - 1, str.length)
  switch (currency) {
    case '€':
      return 'EUR'
  }
  return ''
}
