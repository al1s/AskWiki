"use strict";function _toConsumableArray(e){if(Array.isArray(e)){for(var t=0,n=Array(e.length);t<e.length;t++)n[t]=e[t];return n}return Array.from(e)}var localSpace=function(){function e(e,t){var n=navigator.language||navigator.userLanguage;t.innerHTML=e.parse.text["*"]||e.parse.text;for(var r=document.querySelectorAll("a"),a=0,o=r.length;a<o;a++)/wiki|w/g.test(r[a].pathname)&&(r[a].host=n+".wikipedia.org",r[a].port=443)}function t(t){var n="https://"+(navigator.language||navigator.userLanguage)+".wikipedia.org/w/api.php?action=parse&format=json&formatversion=2&pageid="+t+"&origin=*",r=new Headers;r.append("Api-User-Agent","Example/1.0"),fetch(n,{headers:r}).then(function(e){if(e.ok)return e.json();throw new Error("Error while retrieving page with id "+t)}).then(function(t){if(t.error)throw console.warn(t.error.info),{code:t.error.code,message:t.error.info};e(t,document.querySelector(".external__data"))}).catch(function(e){return console.error((e.code||"")+" "+e.message+" "+e.stack+")")})}function n(e){if(e.childNodes){var t=[],n=[],r=[];return e.childNodes.forEach(function(e,a,o){e.classList.contains("--slide-from-top")?r[a]=new Promise(function(t,r){var o=setTimeout(function(){clearTimeout(n.shift()),e.classList.remove("--slide-from-top"),t("Ok")},30*a);n.push(o)}):r[a]=new Promise(function(n,r){var i=setTimeout(function(){clearTimeout(t.pop()),e.classList.add("--slide-to-bottom");var r=setTimeout(function(){clearTimeout(r),e.classList.remove("--slide-to-bottom")},300);n("Ok")},10*(o.length-a));t.push(i)})}),r}}function r(e){var t=document.location.href,n=document.title;console.log("Inside saveState() searchValue is "+p.value),window.history.replaceState({searchValue:p.value,pageTitle:n},"",t),window.history.pushState({searchValue:p.value,pageTitle:n,pageId:e},"",t)}function a(e){var n=e.pageid,a=e.title,o=document.createElement("div"),i=document.createElement("h2");i.innerHTML=a,i.classList.add("media-box__title"),o.appendChild(i);var s=document.createElement("div");if(e.thumbnail){var c=e.thumbnail.source,l=e.thumbnail.width,u=e.thumbnail.height,d=document.createElement("img");d.src=c,d.height=u,d.width=l,d.classList.add("media-box__image"),s.appendChild(d)}if(e.terms){var p=e.terms.description[0],m=document.createElement("p");m.innerHTML=p,m.classList.add("media-box__text"),s.appendChild(m)}o.classList.add("media-box"),o.classList.add("--slide-from-top"),s.classList.add("media-box__container"),o.appendChild(s),h.appendChild(o),o.addEventListener("click",function(){r(n),t(n)})}function o(e){var t=arguments.length>1&&void 0!==arguments[1]?arguments[1]:7,n="https://"+(navigator.language||navigator.userLanguage)+".wikipedia.org/w/api.php?\n        action=query&\n        format=json&\n        generator=prefixsearch&\n        prop=pageprops%7Cpageimages%7Cpageterms&\n        redirects=&\n        ppprop=displaytitle&\n        piprop=thumbnail&\n        pithumbsize=80&\n        pilimit="+t+"&\n        wbptterms=description&\n        gpssearch="+e+"&\n        gpsnamespace=0&\n        gpslimit="+t+"&\n        origin=*",r=new Headers;return r.append("Api-User-Agent","Example/1.0"),fetch(n,{headers:r}).then(function(t){if(t.ok)return t.json();throw new Error("Could not get the Wikipage for "+e+"!")}).then(function(t){if(t.error)throw console.warn(t.error.info),new Error({code:t.error.code,message:t.error.info});if(t.query&&t.query.pages)return t.query.pages||t.query.search;console.warn(t.query),searchFallback(e)}).catch(function(e){return Promise.reject(e)})}function i(e){for(;e.firstChild;)e.removeChild(e.firstChild)}function s(e){return e.replace(/([.,;:=+[\]\\|\/?<>!@#$%\^\&*()'"\n\r])/g,"")}function c(){var e=s(p.value);Promise.all([o(e)].concat(_toConsumableArray(n(h)))).then(function(e){return i(h),e[0]}).then(function(e){Object.keys(e).forEach(function(t){a(e[t],h)})}).then(function(){n(h)})}window.onpopstate=function(e){e.state.searchValue&&(console.log(e.state),i(h),p.value=e.state.searchValue,document.title=e.state.pageTitle,e.state.pageId?(console.log(e.state.pageId),t(e.state.pageId)):(c?console.log("searchPhrase exists"):console.log("searchPhrase doesn't exists"),c()))};var l=document.querySelector(".search"),u=document.querySelector("#searchBtnSubmit"),d=document.querySelector("#searchBtnRandom"),p=document.querySelector("#searchInput"),h=document.querySelector(".external__data"),m=function(e,t){var n=this,r=arguments,a=void 0;return function(){var o=n,i=r;clearTimeout(a),a=setTimeout(function(){a=null,e.apply(o,i)},t)}}(c,250,!1),f=["Meta","Alt","CapsLock","Shift","Control","Tab","Escape","F1","F2","F3","F4","F5","F6","F7","F8","F9","F10","F11","F12"];l.addEventListener("submit",function(e){return e.preventDefault(),!1}),u.addEventListener("click",c),d.addEventListener("click",function(){}),p.addEventListener("keyup",function(e){console.log(e.key),console.log(e.key+" is within not allowed symbols: "+f.includes(e.key)),f.includes(e.key)||m()})}();
//# sourceMappingURL=script.js.map