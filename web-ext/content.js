browser.runtime.onMessage.addListener(code => {
    // const $script = document.createElement('script')
    // $script.appendChild(document.createTextNode(code))
    // document.body.appendChild($script)

    window.eval(code)
    // window.eval(`
    // 	Pico.png(window).then(result => {
    // 		console.log(browser)
    // 		console.warn('errors:', result.errors)
    // 	}).catch(console.error)
    // `)

    window.eval(`
		Pico.objectURL(document.querySelector('html.v2-html body#top.v2 div div.v2-layout main.v2-layout-main div.v2-container.v2-container-transition div.v2-container-inner'), { ignore: ['noscript'], bodyCallback: (body, element) => {
		    body.replaceChild(element, body.querySelector('div'));
		    return body;
		} }).then(objectURL => {
			console.warn('errors:', objectURL.errors)
			window.open(objectURL.value)
			URL.revokeObjectURL(objectURL.value)
		}).catch(console.error)
	`)
})
