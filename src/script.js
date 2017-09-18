/* 
 * +TODO: fix address bar - remove submit parameters from it;
 * +TODO: clear the page if the input value is undefined;
 * ~TODO: Speed up the load and displaying the data;
 * +TODO: Limit the keys to react at only to meaningful - letters and control;
 * +TODO: fix backspace to return a user to the previous page 
 *        (now it just completely leave the page);
 * ~TODO: add initial fetch to establish connection with wiki; 
 *        it seems to make following requests faster;
 * +TODO: fix images size - it's too crane;
 * +TODO: add user error message on no results;
 */


/* eslint-env es6 */
/* eslint func-names: ['error', 'never'] */
/* eslint no-plusplus: ["error", { "allowForLoopAfterthoughts": true }] */
/* eslint no-param-reassign: ["error", { "props": false }] */

const localSpace = (function () {
  /*
   * Constants
   */
  const searchFormElm = document.querySelector('.search');
  const searchBtnElm = document.querySelector('#searchBtnSubmit');
  const randomBtnElm = document.querySelector('#searchBtnRandom');
  const inputElm = document.querySelector('#searchInput');
  const dataElm = document.querySelector('.external__data');
  const preferedLang = (navigator.language || navigator.userLanguage).slice(0, 2);
  const keysNotAllowed = ['Meta', 'Alt', 'CapsLock', 'Shift', 'Control', 'Tab', 'Escape',
    'F1', 'F2', 'F3', 'F4', 'F5', 'F6', 'F7', 'F8', 'F9', 'F10', 'F11', 'F12'];

  /*
  * debounce(func, wait) 
  * delays function execution for a given period of time
  * @param {Obj} func
  * @param {Int} wait
  */
  function debounce(func, wait, ...args) {
    let timeout;
    return () => {
      const context = this;
      const later = () => {
        timeout = null;
        func.apply(context, args);
      };
      clearTimeout(timeout);
      timeout = setTimeout(later, wait);
    };
  }
  const delayFnOnInput = debounce(searchPhrase, 250, false);

  /*
   * Array.include() polyfill for Safary 7
   */
  if (![].includes) {
    Array.prototype.includes = function(searchElement/*, fromIndex*/) {
      const O = Object(this);
      const len = parseInt(O.length) || 0;
      if (len === 0) {
        return false;
      }
      const n = parseInt(arguments[1]) || 0;
      let k;
      if (n >= 0) {
        k = n;
      } else {
        k = len + n;
        if (k < 0) {
          k = 0;
        }
      }
      while (k < len) {
        const currentElement = O[k];
        if (searchElement === currentElement ||
            (searchElement !== searchElement && currentElement !== currentElement)
        ) {
          return true;
        }
        k += 1;
      }
      return false;
    };
  }

  /*
   * MyError(name, message)
   * Custom error object with additional parameters
   * @param {String} name
   * @param {String} message
   * @return None
   * source - https://stackoverflow.com/a/5251506/2255031
   */
  function MyError({
    name = 'CustomError',
    message = 'An error occured',
  }) {
    this.name = name;
    this.message = message;
    this.stack = (new Error()).stack;
  }
  MyError.prototype = new Error();

  /*
  * clearData(dataElm)
  * Clear all children of the given DOM element
  * @param {Obj} obj
  * @return None
  */
  function clearData(wrapperElm) {
    while (wrapperElm.firstChild) {
      (wrapperElm.removeChild(wrapperElm.firstChild));
    }
  }

  /*
   * moveUp() 
   * Lift the search bar to the top of the screen with minor transform
   * @param None
   * @return None
   * 
   */
  function moveUp() {
    inputElm.removeEventListener('keyup', moveUp);
    searchFormElm.classList.add('search--upper');
    searchFormElm.classList.remove('search--middle');
    inputElm.classList.remove('search__input--middle');
    randomBtnElm.classList.remove('search__btn--middle');
    searchBtnElm.classList.remove('search__btn--middle');
  }

  /*
   * resetOnEmptySearch() 
   * Conditional clearance of the search results
   */
  function resetOnEmptySearch() {
    if (inputElm.value.length === 0) {
      // console.log('insie resetOnEmptySearch');
      // inputElm.addEventListener('keyup', moveUp);
      // searchFormElm.classList.add('search--middle');
      // searchFormElm.classList.remove('search--upper');
      // inputElm.classList.add('search__input--middle');
      // randomBtnElm.classList.add('search__btn--middle');
      clearData(dataElm);
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
    // are here - https://github.com/twitter/twitter-text/blob/master/js/twitter-text.js
    return result;
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
    // console.log(`Inside saveState() searchValue is ${inputElm.value}`);
    window.history.replaceState({ searchValue: inputElm.value, pageTitle }, '', currHref);
    window.history.pushState({ searchValue: inputElm.value, pageTitle, pageId }, '', currHref);
  }

  /*
  * slideIn()
  * used for visual effect of sliding elements from top to appear
  * and to bottom to disappear.
  * Uses parent element as a parameter and do the magic on all childelements
  */
  function slideIn(wrapperElm) {
    let promises = [];
    const allChildNodes = wrapperElm.childNodes;
    // console.log(allChildNodes);
    if (allChildNodes) {
      const timeoutArrIn = [];
      const timeoutArrOut = [];
      // for loop instead of forEach to support Safari 7
      // wrapperElm.childNodes.forEach((item, ndx, arr) => {
      for (let i = 0, l = allChildNodes.length; i < l; i++) {
        const item = allChildNodes[i];
        const arr = allChildNodes;
        if (item.classList.contains('--slide-from-top')) {
          // console.log(`slideIn:, cycle=${cycle}, move '${item.firstChild.innerHTML}' from top`);
          promises[i] = new Promise((resolve, reject) => {
            const a = setTimeout(() => {
              clearTimeout(timeoutArrOut.shift());
              item.classList.remove('--slide-from-top');
              resolve('Ok');
            }, (i) * 30);
            timeoutArrOut.push(a);
          });
        } else {
          promises[i] = new Promise((resolve, reject) => {
            const a = setTimeout(() => {
              clearTimeout(timeoutArrIn.pop());
              item.classList.add('--slide-to-bottom');
              const b = setTimeout(() => {
                clearTimeout(b);
                item.classList.remove('--slide-to-bottom');
              }, 300);
              resolve('Ok');
            }, (arr.length - i) * 10);
            timeoutArrIn.push(a);
          });
        }
      }
    } else promises = [];
    return promises;
  }

  /* 
  * showPage()
  * adds a page content to a given DOM element.
  * It replaces all relative links in the page with Wikipedia domain prefixed.
  */
  function showPage(data, wrapperElm) {
    wrapperElm.innerHTML = data.parse.text['*'] || data.parse.text;
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
    const httpAddr = `https://${preferedLang}.wikipedia.org/w/api.php?action=parse&format=json&formatversion=2&pageid=${pageId}&origin=*`;
    // const headers = new Headers();
    // headers.append('Api-User-Agent', 'Example/1.0');
    const headers = { headers: {
      'Api-User-Agent': 'Example/1.0',
    } };
    fetch(httpAddr, headers)
      .then((resp) => {
        if (resp.ok) return resp.json();
        throw new MyError({ name: 'HTTPError', message: `Error while retrieving page with id ${pageId}` });
      })
      .then((data) => {
        if (data.error) {
          console.warn(data.error.info);
          throw new MyError({ name: data.error.code, message: data.error.info });
        } else {
          showPage(data, dataElm);
        }
      })
      .catch(err => console.error(`${err.code || ''} ${err.message} ${err.stack})`))
  }

  /*
  * showData()
  * takes the data received from Wikipedia search engine
  * and insert it into dataElm element. 
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
  * looks for a given number of best fitted results to the phrase
  * @param {String} phrase
  * @param {Int} numberOfResults
  * @return (Object) obj
  */
  function searchWikiData(phrase, numberOfResults = 7) {
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
    const headers = { headers: {
      'Api-User-Agent': 'Example/1.0',
    } };
    // const headers = new Headers();
    // headers.append('Api-User-Agent', 'Example/1.0');
    return fetch(httpAddr, headers)
      .then((resp) => {
        // console.log(`fetched data for cycle=${cycle}`);
        if (resp.ok) return resp.json();
        throw new Error(`Could not get the Wikipage for ${phrase}!`);
      })
      .then((data) => {
        if (data.error) {
          console.warn(data.error.info);
          throw new MyError({ name: data.error.code, message: data.error.info });
        } else if (!data.query || !data.query.pages) {
          console.warn('No such page');
          // searchFallback(phrase);
          throw new MyError({ name: 'NoSuchPage', message: phrase });
        } else {
          return data.query.pages || data.query.search;
        }
      })
      .catch(err => Promise.reject(err));
  }

  /*
   * searchFallback(phrase) 
   * Insert into dataElm element additional search engines links when Wiki search fails. 
   * @param {string} phrase
   * @return None
   */
  function searchFallback(phrase) {
    const wikiAddr = `https://${preferedLang}.wikipedia.org/wiki/Special:Search?search=${phrase}`;
    const googleAddr = `https://www.google.com/search?q=${phrase}`;
    dataElm.innerHTML = `<p>There is no article for <em>${phrase}</em>. Try to search with <a href="${wikiAddr}">Wiki</a> or <a href="${googleAddr}">Google</a>.</p>`;
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
      .catch((err) => {
        // console.log('promise reject cought!');
        // console.log(err.message);
        clearData(dataElm);
        if (err.name === 'NoSuchPage') searchFallback(err.message);
      });
  }

  /*
  * searchRandom() 
  * looks for a random Wiki article
  * @params None
  * @return None
  */
  function searchRandom() {
    const httpAddr = `https://${preferedLang}.wikipedia.org/w/api.php?
        action=query&
        format=json&
        generator=random&
        rnnamespace=1&
        origin=*`;
    // const headers = new Headers();
    // headers.append('Api-User-Agent', 'Example/1.0');
    const headers = { headers: {
      'Api-User-Agent': 'Example/1.0',
    } };
    return fetch(httpAddr, headers)
      .then((resp) => {
        if (resp.ok) return resp.json();
        throw new Error('Could not get a random Wikipage!');
      })
      .then((data) => {
        if (data.error) {
          console.warn(data.error.info);
          throw new Error({ name: data.error.code, message: data.error.info });
        } else if (!data.query || !data.query.pages) {
          console.warn(data.query);
          // searchFallback(phrase);
          throw new Error({ name: 'NoSuchPage', message: 'There is no pages found' });
        } else {
          return data.query.pages;
        }
      })
      .then((data) => {
        const pageid = Object.keys(data)[0];
        moveUp();
        saveState(pageid);
        getPage(pageid);
      })
      .catch(err => Promise.reject(err));
  }

  /*
   * Provide history handler routine
   */
  window.onpopstate = (e) => {
    if (e.state.searchValue) {
      // console.log(e.state);
      clearData(dataElm);
      moveUp();
      inputElm.value = e.state.searchValue;
      document.title = e.state.pageTitle;
      if (e.state.pageId) {
        // console.log(e.state.pageId);
        getPage(e.state.pageId);
      } else {
        // if (searchPhrase) console.log('searchPhrase exists');
        // else console.log('searchPhrase doesn\'t exists');
        searchPhrase();
      }
    }
  };

  searchBtnElm.addEventListener('click', () => {
    if (!inputElm.length) {
      // console.log('inside clearing phase on keyboard events');
      clearData(dataElm);
      moveUp();
      resetOnEmptySearch();
      searchPhrase();
    }
  });
  randomBtnElm.addEventListener('click', searchRandom);
  inputElm.addEventListener('keyup', moveUp);
  searchFormElm.addEventListener('submit', (e) => {
    e.preventDefault();
    return false; // to prevent changes in address bar
  });
  inputElm.addEventListener('keydown', (e) => {
    // console.log(`input length=${inputElm.length} and ${dataElm.childNodes.length > 0}`)
    if ((e.key === 'Backspace' && e.metaKey) ||
        (!inputElm.length && dataElm.childNodes.length > 0)) {
      // console.log('inside clearing phase on keyboard events');
      clearData(dataElm);
    }
  });
  inputElm.addEventListener('keyup', (e) => {
    // console.log(`${e.key} is within not allowed symbols: ${keysNotAllowed.includes(e.key)}`);
    if (!keysNotAllowed.includes(e.key)) {
      resetOnEmptySearch();
      delayFnOnInput();
    }
  });
}());
