function getWikiData(phrase) {
  const preferedLang = navigator.language || navigator.userLanguage;
  let httpAddr = `https://${preferedLang}.wikipedia.org/w/api.php?action=query&format=json&formatversion=2&list=search&continue=&srsearch=${phrase}&srwhat=text&srprop=wordcount&origin=*`;
  const headers = new Headers();
  headers.append('Api-User-Agent','Example/1.0');
  fetch(httpAddr, { headers })
    .then(resp => {
      if (resp.ok) return resp.json();
      throw new Error(`Could not get the Wikipage for ${phrase}!`)
    })
    .then(data => {
      if (data.error) {
        console.warn(data.error.info);
        throw { code: data.error.code, message: data.error.info };
      } else if (data.query.search.length === 0) {
          console.warn(data.query.search);
          throw { code: 'NoSuchPage', message: `There is no page for ${phrase}` }
      } else {
        console.log(`pageId=${data.query.search[0].pageid}`)
        const pageId = data.query.search[0].pageid;
        httpAddr = `https://${preferedLang}.wikipedia.org/w/api.php?action=parse&format=json&formatversion=2&pageid=${pageId}&origin=*`;
        return fetch(httpAddr, { headers })
      }
    })
    .then(resp => {
      if (resp.ok) return resp.json();
      throw new Error(`Error while retrieving page with id ${pageId}`);
    })
    .then(data => {
      if (data.error) {
        console.warn(data.error.info);
        throw { code: data.error.code, message: data.error.info };
      } else return parseData(data)
    })
    .then(data => {
      const dataElm = document.querySelector('.external__data');
      showData(data, dataElm)
    })
    .catch(err => console.error(err.code || '' + ' ' + err.message + err.stack))
}

function parseData(data) {
  if (data.parse.text) {
    //let data = data.parse.text['*'];
    //let re = new RegExp('.*?<a\shref="(.+?)".*?>(.+?)<.*?', 'g')
    return data.parse.text['*'] || data.parse.text;
  }
}

function showData(data, dataElm) {
  dataElm.innerHTML = data;
  const anchors = document.querySelectorAll('a');

  for (let i = 0; i < anchors.length; i++) {
    //console.log(anchors[i]);
    if (/wiki|w/g.test(anchors[i].pathname)) {
      anchors[i].host = 'www.wikipedia.org';
      anchors[i].port = 443;
    }
  }

}

function clearData(dataElm) {
  while (dataElm.firstChild) {
    dataElm.removeChild(dataElm.firstChild);
  }
}

function validateInput(formInput) {
  const result = formInput.replace(/([.,;:=+\[\]\\\|\/?<>!@#$%^&*()'"\n\r]*?)([\w\s\t\r\n]+)/gi,'$2');
  return result
}

function searchPhrase() {
  const textField = document.querySelector('#searchInput');
  const dataElm = document.querySelector('.external__data');
  // TODO: some user input validation stuff
  const userInput = validateInput(textField.value);
  console.log(userInput);
  clearData(dataElm);
  getWikiData(userInput);
}

function searchRandom() {

}

const submitBtnElm = document.querySelector('#searchBtnSubmit');
const randomBtnElm = document.querySelector('#searchBtnRandom');
const inputElm = document.querySelector('#searchInput');

submitBtnElm.addEventListener('click', searchPhrase)
randomBtnElm.addEventListener('click', searchRandom)
inputElm.addEventListener('keypress', (e) => {
  if (e.key === 'Enter') {
    searchPhrase();
  }
  })