// +TODO: fix address bar - remove submit parameters from it;
// TODO: clear the page if the input value is undefined;
// TODO: Speed up the load and displaying the data;
// +TODO: Limit the keys to react at only to meaningful - letters and control;
// +TODO: fix backspace to return a user to the previous page (now it just completely leave the page);
// TODO: add initial fetch to establish connection with wiki; it seems to make following requests faster;
// TODO: fix images size - it's too crane;
// TODO: add user error message on no results;


/* eslint func-names: ['error', 'never'] */
const localSpace = (function () {
  /* 
  * showPage()
  * adds a page content to a given DOM element.
  * It replaces all relative links in the page with Wikipedia domain prefixed.
  */
  function showPage(data, dataElm) {
    const preferedLang = navigator.language || navigator.userLanguage;
    dataElm.innerHTML = data.parse.text['*'] || data.parse.text;
    const anchors = document.querySelectorAll('a');

    for (let i = 0, l = anchors.length; i < l; i++) {
      // console.log(anchors[i]);
      if (/wiki|w/g.test(anchors[i].pathname)) {
        anchors[i].host = `${preferedLang}.wikipedia.org`;
        anchors[i].port = 443;
        // console.log(resolveLink(anchors[i]))
      }
    }
  }

  /* 
  * getPage()
  * retrieves wiki page with a given pageID content from Wikimedia engine.
  * It uses browser settings to retrieve data according to user prefered language. 
  */ 
  function getPage(pageId) {
    const preferedLang = navigator.language || navigator.userLanguage;
    const httpAddr = `https://${preferedLang}.wikipedia.org/w/api.php?action=parse&format=json&formatversion=2&pageid=${pageId}&origin=*`;
    const headers = new Headers();
    headers.append('Api-User-Agent', 'Example/1.0');
    fetch(httpAddr, { headers })
      .then((resp) => {
        if (resp.ok) return resp.json();
        throw new Error(`Error while retrieving page with id ${pageId}`);
      })
      .then((data) => {
        if (data.error) {
          console.warn(data.error.info);
          throw { code: data.error.code, message: data.error.info };
        } else {
          const dataElm = document.querySelector('.external__data');
          showPage(data, dataElm);
        }
      })
      .catch(err => console.error(`${err.code || ''} ${err.message} ${err.stack})`))
  }

  /*
  * slideIn()
  * used for visual effect of sliding elements from top to appear
  * and to bottom to disappear.
  * Uses parent element as a parameter and do the magic on all childelements
  */
  function slideIn(elm) {
    if (elm.childNodes) {
      const timeoutArrIn = [];
      const timeoutArrOut = [];
      const promises = [];
      elm.childNodes.forEach((item, ndx, arr) => {
        // console.log(item.classList);
        if (item.classList.contains('--slide-from-top')) {
          // console.log(`slideIn:, cycle=${cycle}, move '${item.firstChild.innerHTML}' from top`);
          promises[ndx] = new Promise((resolve, reject) => {
            const a = setTimeout(() => {
              clearTimeout(timeoutArrOut.shift());
              item.classList.remove('--slide-from-top');
              resolve('Ok');
            }, (ndx) * 30);
            timeoutArrOut.push(a);
          });
        } else {
          promises[ndx] = new Promise((resolve, reject) => {
            const a = setTimeout(() => {
              clearTimeout(timeoutArrIn.pop());
              item.classList.add('--slide-to-bottom');
              const b = setTimeout(() => {
                clearTimeout(b);
                item.classList.remove('--slide-to-bottom');
              }, 300);
              resolve('Ok');
            }, (arr.length - ndx) * 10);
            timeoutArrIn.push(a);
          });
        }
      });
      return promises;
    }
  }

  /*
  * saveState(pageId) 
  * keeps state of the page in browser history
  * @param {Int} pageId
  * @return None
  * 
  */
  function saveState(pageId) {
    const currHref = document.location.href;
    const pageTitle = document.title;
    console.log(`Inside saveState() searchValue is ${inputElm.value}`);
    window.history.replaceState({ searchValue: inputElm.value, pageTitle }, '', currHref);
    window.history.pushState({ searchValue: inputElm.value, pageTitle, pageId }, '', currHref);
  }

  /*
  * showData()
  * takes the data received from Wikipedia search engine
  * and insert it into given DOM element. 
  * It expects 'data' object to consist:
  *    pageID - wiki page id;
  *    title - page title;
  *    thumbnail - title picture of the page;
  *    description - short extract from the article;
  */
  function showData(data) {
    const pageId = data.pageid;
    const title = data.title;
    const mediaBoxElm = document.createElement('div');
    const titleElm = document.createElement('h2');
    titleElm.innerHTML = title;
    titleElm.classList.add('media-box__title');
    mediaBoxElm.appendChild(titleElm);

    const mediaBoxContainerElm = document.createElement('div');
    if (data.thumbnail) {
      const thumbnailSource = data.thumbnail.source;
      const thumbnailWidth = data.thumbnail.width;
      const thumbnailHeight = data.thumbnail.height;
      const imageElm = document.createElement('img');
      imageElm.src = thumbnailSource;
      imageElm.height = thumbnailHeight;
      imageElm.width = thumbnailWidth;
      imageElm.classList.add('media-box__image');
      mediaBoxContainerElm.appendChild(imageElm);
    }

    if (data.terms) {
      const extract = data.terms.description[0];
      const extractElm = document.createElement('p');
      extractElm.innerHTML = extract;
      extractElm.classList.add('media-box__text');
      mediaBoxContainerElm.appendChild(extractElm);
    }

    mediaBoxElm.classList.add('media-box');
    mediaBoxElm.classList.add('--slide-from-top');
    mediaBoxContainerElm.classList.add('media-box__container');

    mediaBoxElm.appendChild(mediaBoxContainerElm);
    dataElm.appendChild(mediaBoxElm);

    mediaBoxElm.addEventListener('click', () => {
      saveState(pageId);
      getPage(pageId);
    });
  }

  /*
  * searchWikiData(phrase, numberOfResults)
  * looks for given number of best fitted results to the phrase
  * @param {String} phrase
  * @param {Int} numberOfResults
  * @return (Object) obj
  */
  function searchWikiData(phrase, numberOfResults = 7) {
    const preferedLang = navigator.language || navigator.userLanguage;
    const httpAddr = `https://${preferedLang}.wikipedia.org/w/api.php?
        action=query&
        format=json&
        generator=prefixsearch&
        prop=pageprops%7Cpageimages%7Cpageterms&
        redirects=&
        ppprop=displaytitle&
        piprop=thumbnail&
        pithumbsize=80&
        pilimit=${numberOfResults}&
        wbptterms=description&
        gpssearch=${phrase}&
        gpsnamespace=0&
        gpslimit=${numberOfResults}&
        origin=*`;
    const headers = new Headers();
    headers.append('Api-User-Agent', 'Example/1.0');
    return fetch(httpAddr, { headers })
      .then((resp) => {
        // console.log(`fetched data for cycle=${cycle}`);
        if (resp.ok) return resp.json();
        throw new Error(`Could not get the Wikipage for ${phrase}!`);
      })
      .then((data) => {
        if (data.error) {
          console.warn(data.error.info);
          throw new Error({ code: data.error.code, message: data.error.info });
        } else if (!data.query || !data.query.pages) {
          console.warn(data.query);
          searchFallback(phrase);
          // throw new Error({ code: 'NoSuchPage', message: `There is no pages for ${phrase}` });
        } else {
          return data.query.pages || data.query.search;
        }
      })
      .catch(err => Promise.reject(err));
  }

  /*
  * clearData(dataElm)
  * clears the DOM from search results
  * @param {Obj} obj
  */
  function clearData(dataElm) {
    while (dataElm.firstChild) {
      (dataElm.removeChild(dataElm.firstChild));
    }
  }

  /*
  * cleanInput(formInput) 
  * sanitizes user input
  * @param {String} formInput
  * @return {String}
  */
  function cleanInput(formInput) {
    const result = formInput.replace(/([.,;:=+[\]\\|\/?<>!@#$%\^\&*()'"\n\r])/g, '');
    // twitter's unicode letters and marks regexp
    // from here - https://github.com/twitter/twitter-text/blob/master/js/twitter-text.js
    // const bmpLetterAndMarks = new RegExp(/A-Za-z\xaa\xb5\xba\xc0-\xd6\xd8-\xf6\xf8-\u02c1\u02c6-\u02d1\u02e0-\u02e4\u02ec\u02ee\u0300-\u0374\u0376\u0377\u037a-\u037d\u037f\u0386\u0388-\u038a\u038c\u038e-\u03a1\u03a3-\u03f5\u03f7-\u0481\u0483-\u052f\u0531-\u0556\u0559\u0561-\u0587\u0591-\u05bd\u05bf\u05c1\u05c2\u05c4\u05c5\u05c7\u05d0-\u05ea\u05f0-\u05f2\u0610-\u061a\u0620-\u065f\u066e-\u06d3\u06d5-\u06dc\u06df-\u06e8\u06ea-\u06ef\u06fa-\u06fc\u06ff\u0710-\u074a\u074d-\u07b1\u07ca-\u07f5\u07fa\u0800-\u082d\u0840-\u085b\u08a0-\u08b2\u08e4-\u0963\u0971-\u0983\u0985-\u098c\u098f\u0990\u0993-\u09a8\u09aa-\u09b0\u09b2\u09b6-\u09b9\u09bc-\u09c4\u09c7\u09c8\u09cb-\u09ce\u09d7\u09dc\u09dd\u09df-\u09e3\u09f0\u09f1\u0a01-\u0a03\u0a05-\u0a0a\u0a0f\u0a10\u0a13-\u0a28\u0a2a-\u0a30\u0a32\u0a33\u0a35\u0a36\u0a38\u0a39\u0a3c\u0a3e-\u0a42\u0a47\u0a48\u0a4b-\u0a4d\u0a51\u0a59-\u0a5c\u0a5e\u0a70-\u0a75\u0a81-\u0a83\u0a85-\u0a8d\u0a8f-\u0a91\u0a93-\u0aa8\u0aaa-\u0ab0\u0ab2\u0ab3\u0ab5-\u0ab9\u0abc-\u0ac5\u0ac7-\u0ac9\u0acb-\u0acd\u0ad0\u0ae0-\u0ae3\u0b01-\u0b03\u0b05-\u0b0c\u0b0f\u0b10\u0b13-\u0b28\u0b2a-\u0b30\u0b32\u0b33\u0b35-\u0b39\u0b3c-\u0b44\u0b47\u0b48\u0b4b-\u0b4d\u0b56\u0b57\u0b5c\u0b5d\u0b5f-\u0b63\u0b71\u0b82\u0b83\u0b85-\u0b8a\u0b8e-\u0b90\u0b92-\u0b95\u0b99\u0b9a\u0b9c\u0b9e\u0b9f\u0ba3\u0ba4\u0ba8-\u0baa\u0bae-\u0bb9\u0bbe-\u0bc2\u0bc6-\u0bc8\u0bca-\u0bcd\u0bd0\u0bd7\u0c00-\u0c03\u0c05-\u0c0c\u0c0e-\u0c10\u0c12-\u0c28\u0c2a-\u0c39\u0c3d-\u0c44\u0c46-\u0c48\u0c4a-\u0c4d\u0c55\u0c56\u0c58\u0c59\u0c60-\u0c63\u0c81-\u0c83\u0c85-\u0c8c\u0c8e-\u0c90\u0c92-\u0ca8\u0caa-\u0cb3\u0cb5-\u0cb9\u0cbc-\u0cc4\u0cc6-\u0cc8\u0cca-\u0ccd\u0cd5\u0cd6\u0cde\u0ce0-\u0ce3\u0cf1\u0cf2\u0d01-\u0d03\u0d05-\u0d0c\u0d0e-\u0d10\u0d12-\u0d3a\u0d3d-\u0d44\u0d46-\u0d48\u0d4a-\u0d4e\u0d57\u0d60-\u0d63\u0d7a-\u0d7f\u0d82\u0d83\u0d85-\u0d96\u0d9a-\u0db1\u0db3-\u0dbb\u0dbd\u0dc0-\u0dc6\u0dca\u0dcf-\u0dd4\u0dd6\u0dd8-\u0ddf\u0df2\u0df3\u0e01-\u0e3a\u0e40-\u0e4e\u0e81\u0e82\u0e84\u0e87\u0e88\u0e8a\u0e8d\u0e94-\u0e97\u0e99-\u0e9f\u0ea1-\u0ea3\u0ea5\u0ea7\u0eaa\u0eab\u0ead-\u0eb9\u0ebb-\u0ebd\u0ec0-\u0ec4\u0ec6\u0ec8-\u0ecd\u0edc-\u0edf\u0f00\u0f18\u0f19\u0f35\u0f37\u0f39\u0f3e-\u0f47\u0f49-\u0f6c\u0f71-\u0f84\u0f86-\u0f97\u0f99-\u0fbc\u0fc6\u1000-\u103f\u1050-\u108f\u109a-\u109d\u10a0-\u10c5\u10c7\u10cd\u10d0-\u10fa\u10fc-\u1248\u124a-\u124d\u1250-\u1256\u1258\u125a-\u125d\u1260-\u1288\u128a-\u128d\u1290-\u12b0\u12b2-\u12b5\u12b8-\u12be\u12c0\u12c2-\u12c5\u12c8-\u12d6\u12d8-\u1310\u1312-\u1315\u1318-\u135a\u135d-\u135f\u1380-\u138f\u13a0-\u13f4\u1401-\u166c\u166f-\u167f\u1681-\u169a\u16a0-\u16ea\u16f1-\u16f8\u1700-\u170c\u170e-\u1714\u1720-\u1734\u1740-\u1753\u1760-\u176c\u176e-\u1770\u1772\u1773\u1780-\u17d3\u17d7\u17dc\u17dd\u180b-\u180d\u1820-\u1877\u1880-\u18aa\u18b0-\u18f5\u1900-\u191e\u1920-\u192b\u1930-\u193b\u1950-\u196d\u1970-\u1974\u1980-\u19ab\u19b0-\u19c9\u1a00-\u1a1b\u1a20-\u1a5e\u1a60-\u1a7c\u1a7f\u1aa7\u1ab0-\u1abe\u1b00-\u1b4b\u1b6b-\u1b73\u1b80-\u1baf\u1bba-\u1bf3\u1c00-\u1c37\u1c4d-\u1c4f\u1c5a-\u1c7d\u1cd0-\u1cd2\u1cd4-\u1cf6\u1cf8\u1cf9\u1d00-\u1df5\u1dfc-\u1f15\u1f18-\u1f1d\u1f20-\u1f45\u1f48-\u1f4d\u1f50-\u1f57\u1f59\u1f5b\u1f5d\u1f5f-\u1f7d\u1f80-\u1fb4\u1fb6-\u1fbc\u1fbe\u1fc2-\u1fc4\u1fc6-\u1fcc\u1fd0-\u1fd3\u1fd6-\u1fdb\u1fe0-\u1fec\u1ff2-\u1ff4\u1ff6-\u1ffc\u2071\u207f\u2090-\u209c\u20d0-\u20f0\u2102\u2107\u210a-\u2113\u2115\u2119-\u211d\u2124\u2126\u2128\u212a-\u212d\u212f-\u2139\u213c-\u213f\u2145-\u2149\u214e\u2183\u2184\u2c00-\u2c2e\u2c30-\u2c5e\u2c60-\u2ce4\u2ceb-\u2cf3\u2d00-\u2d25\u2d27\u2d2d\u2d30-\u2d67\u2d6f\u2d7f-\u2d96\u2da0-\u2da6\u2da8-\u2dae\u2db0-\u2db6\u2db8-\u2dbe\u2dc0-\u2dc6\u2dc8-\u2dce\u2dd0-\u2dd6\u2dd8-\u2dde\u2de0-\u2dff\u2e2f\u3005\u3006\u302a-\u302f\u3031-\u3035\u303b\u303c\u3041-\u3096\u3099\u309a\u309d-\u309f\u30a1-\u30fa\u30fc-\u30ff\u3105-\u312d\u3131-\u318e\u31a0-\u31ba\u31f0-\u31ff\u3400-\u4db5\u4e00-\u9fcc\ua000-\ua48c\ua4d0-\ua4fd\ua500-\ua60c\ua610-\ua61f\ua62a\ua62b\ua640-\ua672\ua674-\ua67d\ua67f-\ua69d\ua69f-\ua6e5\ua6f0\ua6f1\ua717-\ua71f\ua722-\ua788\ua78b-\ua78e\ua790-\ua7ad\ua7b0\ua7b1\ua7f7-\ua827\ua840-\ua873\ua880-\ua8c4\ua8e0-\ua8f7\ua8fb\ua90a-\ua92d\ua930-\ua953\ua960-\ua97c\ua980-\ua9c0\ua9cf\ua9e0-\ua9ef\ua9fa-\ua9fe\uaa00-\uaa36\uaa40-\uaa4d\uaa60-\uaa76\uaa7a-\uaac2\uaadb-\uaadd\uaae0-\uaaef\uaaf2-\uaaf6\uab01-\uab06\uab09-\uab0e\uab11-\uab16\uab20-\uab26\uab28-\uab2e\uab30-\uab5a\uab5c-\uab5f\uab64\uab65\uabc0-\uabea\uabec\uabed\uac00-\ud7a3\ud7b0-\ud7c6\ud7cb-\ud7fb\uf870-\uf87f\uf882\uf884-\uf89f\uf8b8\uf8c1-\uf8d6\uf900-\ufa6d\ufa70-\ufad9\ufb00-\ufb06\ufb13-\ufb17\ufb1d-\ufb28\ufb2a-\ufb36\ufb38-\ufb3c\ufb3e\ufb40\ufb41\ufb43\ufb44\ufb46-\ufbb1\ufbd3-\ufd3d\ufd50-\ufd8f\ufd92-\ufdc7\ufdf0-\ufdfb\ufe00-\ufe0f\ufe20-\ufe2d\ufe70-\ufe74\ufe76-\ufefc\uff21-\uff3a\uff41-\uff5a\uff66-\uffbe\uffc2-\uffc7\uffca-\uffcf\uffd2-\uffd7\uffda-\uffdc/, 'gui');
    return result;
  }

  /*
  * searchPhrase() 
  * wraps all elements into asyncronous flud
  * @params None
  * @return None
  */
  function searchPhrase() {
    const userInput = cleanInput(inputElm.value);
    // console.log(`First slideIn, searchPhrase cleaning phase for cycle=${cycle}`);
    Promise.all([searchWikiData(userInput), ...slideIn(dataElm)])
      .then((data) => {
        clearData(dataElm);
        return data[0];
      })
      .then((data) => {
        Object.keys(data).forEach((item) => {
          showData(data[item], dataElm);
        });
      })
      .then(() => {
        // console.log(`Second slideIn inside searchWikiData for cycle=${cycle}`);
        slideIn(dataElm);
      })
  }

  function searchRandom() {

  }

  /*
  * debounce(func, wait) 
  * delays function execution for a given period of time
  * @param {Obj} func
  * @param {Int} wait
  */
  function debounce(func, wait) {
    let timeout;
    return () => {
      const context = this;
      const args = arguments;
      const later = () => {
        timeout = null;
        func.apply(context, args);
      };
      clearTimeout(timeout);
      timeout = setTimeout(later, wait);
    };
  }

  window.onpopstate = (e) => {
    if (e.state.searchValue) {
      console.log(e.state);
      // e.preventDefault();
      clearData(dataElm);
      inputElm.value = e.state.searchValue;
      document.title = e.state.pageTitle;
      if (e.state.pageId) {
        console.log(e.state.pageId);
        getPage(e.state.pageId);
      } else {
        if (searchPhrase) console.log('searchPhrase exists');
        else console.log(`searchPhrase doesn't exists`);
        searchPhrase();
      }
    }
  };

  const formElm = document.querySelector('.search');
  const submitBtnElm = document.querySelector('#searchBtnSubmit');
  const randomBtnElm = document.querySelector('#searchBtnRandom');
  const inputElm = document.querySelector('#searchInput');
  const dataElm = document.querySelector('.external__data');
  const delayFnOnInput = debounce(searchPhrase, 250, false);
  const keysNotAllowed = ['Meta', 'Alt', 'CapsLock', 'Shift', 'Control', 'Tab', 'Escape', 
    'F1', 'F2', 'F3', 'F4', 'F5', 'F6', 'F7', 'F8', 'F9', 'F10', 'F11', 'F12'];

  // let cycle = 1;

  formElm.addEventListener('submit', (e) => {
    e.preventDefault();
    return false; // to prevent changes in address bar
  });
  submitBtnElm.addEventListener('click', searchPhrase);
  randomBtnElm.addEventListener('click', searchRandom);
  inputElm.addEventListener('keyup', (e) => {
    // console.log(e.target.value);
    console.log(e.key)    
    console.log(`${e.key} is within not allowed symbols: ${keysNotAllowed.includes(e.key)}`);
    if (!keysNotAllowed.includes(e.key)) {
      delayFnOnInput();
    }
    // cycle++;
  });
}());
