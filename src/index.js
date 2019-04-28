const {
	BaseKonnector,
	requestFactory,
	signin,
	scrape,
	saveFiles,
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
	const $ = await request(`${baseUrl}/index.html`)
	log('info', 'Parsing list of documents')
	const documents = await parseDocuments($)
	log('info', 'Saving data to Cozy')
	console.log(documents)
	await saveFiles(documents, fields, {
		identifiers: ['invoice']
	})
	log('info', 'Logging out')
	request('https://www.sfr.fr/cas/logout?url=https://www.red-by-sfr.fr/&red=true')
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
	var docs = new Array();
	console.log(docs = $(".sr-chevron").map(function(i, el) {
		return {
			fileurl: convertToDownloadLink($(this).attr("href"))
		}
	}))
	ret = docs.map(doc => (//{
//		title: "test",
//		amount: "12",
//		date: new Date(),
//		currency: 'EUR',
//		vendor: 'SFR Red',
//		fileurl: doc.fileurl,
//		metadata: {
//			importDate: new Date(),
//			version: 1
//		}
//	}
	console.log(doc)
	))

	return docs

}

// Convert href to download link
function convertToDownloadLink(link) {
	return (link ? "https://espace-client-red.sfr.fr" + link.replace("facturette", "telecharger") + ".pdf" : link)
}
