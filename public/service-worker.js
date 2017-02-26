// Caching the App Shell
var cacheName = 'weatherPWA-v1'; // This needs to be changes whenever any appshell resources are changed to clean the cache.
var filesToCache = [
  '/pwa',
  '/assets/pwa/ud811.css?body=1',
  '/assets/localforage-1.4.0.js?body=1',
  '/assets/pwa/my_app.js?body=1',
  '/assets/pwa/ic_refresh_white_24px.svg',
  '/assets/pwa/ic_add_white_24px.svg',
  '/assets/pwa/partly-cloudy.png',
  '/assets/pwa/rain.png',
  '/assets/pwa/wind.png',
  '/assets/pwa/snow.png',
  'assets/pwa/partly-cloudy.png'
];


self.addEventListener('install', function(e) {
  // perfect place to cache all the resource that are required for app shell (html, css, any javascript)
  // console.log('Install event..');
  e.waitUntil(
    // open: returns a Promise that resolves to the Cache object matching the cacheName
    caches.open(cacheName).then(function(cache) {
      // addAll() method of the Cache interface takes an array of URLS, retrieves them,
      // and adds the resulting response objects to the given cache.
      // The request objects created during retrieval become keys to the stored response operations
      return cache.addAll(filesToCache);
    })
  );
});


self.addEventListener('activate', function(e) {
  e.waitUntil(
    // keys() method of the Cache interface returns a Promise that resolves to an array of Cache keys
    caches.keys().then(function(keyList) {
      // Promise object is used for asynchronous computations. A Promise represents a value which may be available now,
      // or in the future, or never. A Promise is a proxy for a value not necessarily known when the promise is created.
      // It allows you to associate handlers with an asynchronous action's eventual success value or failure reason.

      // A promise is a method that eventually produces a value. It can be considered as the asynchronous counterpart of a getter function.
      // EX: promise.then(function(value) { // Do something with the 'value'});
      // A promise can be in one of three states: pending, fulfilled, or rejected

      // A Promise object represents a value that may not be available yet, but will be resolved at some point in the future.
      // It allows you to write asynchronous code in a more synchronous fashion

      // Promise.all(iterable) method returns a promise that resolves when all of the promises in the iterable
      // argument have resolved, or rejects with the reason of the first passed promise that rejects

      // map() method creates a new array with the results of calling a provided function on every element in this array.
      // EX: numbers = [1, 5, 10, 15]; var roots = numbers.map(function(x) { return x * 2; });
      // roots is now [2, 10, 20, 30]
      return Promise.all(keyList.map(function(key) {
          if(key !== cacheName && key !== dataCacheName) {
            // delete() method of the Cache interface finds the Cache entry whose key is the request, and if found,
            // deletes the Cache entry and returns a Promise that resolves to true.
            // If no Cache entry is found, it returns false
            return caches.delete(key);
          }
        })
      ); // Ends Promise.all()

    })
  );
});


self.addEventListener('fetch', function(e) {
  // console.log('[SW] Fetch', e.request.url);
  e.respondWith(
    // match() method of the CacheStorage interface checks if a given Request is a key in any of the Cache objects
    // that the CacheStorage object tracks and returns a Promise that resolves to the matching Response.
    caches.match(e.request).then(function(response) {
      // fetch: https://developers.google.com/web/updates/2015/03/introduction-to-fetch
      // fetch() allows you to make network requests similar to XMLHttpRequest (XHR).
      // The main difference is that the Fetch API uses Promises, which enables a simpler and cleaner API,
      // avoiding callback hell and having to remember the complex API of XMLHttpRequest
      if(response) {
        console.log('Serving from cache: ', e.request.url);
      }
      else {
        console.log('Fetching from web: ', e.request.url);
      }
      return response || fetch(e.request);
    })
  )
});


