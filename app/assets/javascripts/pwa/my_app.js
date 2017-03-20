//= require localforage-1.4.0.js


(function() {
  'use strict';

  //  =============
  //  = Variables =
  //  =============

  var app = {
        isLoading: true,
        visibleCards: {},
        selectedCities: [],
        isRequestPending: true,
        spinner: document.querySelector('.loader'),
        cardTemplate: document.querySelector('.cardTemplate'),
        container: document.querySelector('.main'),
        addDialig: document.querySelector('.dialog-container'),
        daysOfWeek: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
      }

  var weatherAPIUrlBase = 'https://publicdata-weather.firebaseio.com/';

  var injectedForecast = {
    key: 'newyork',
    label: 'New York, NY',
    currently: {
      time: 1453489481,
      summary: 'Clear',
      icon: 'partly-cloudy-day',
      temperature: 52.74,
      apparentTemperature: 74.34,
      precipProbability: 0.20,
      humidity: 0.77,
      windBearing: 125,
      windSpeed: 1.52
    },
    daily: {
      data: [
        {icon: 'clear-day', temperatureMax: 55, temperatureMin: 34},
        {icon: 'rain', temperatureMax: 55, temperatureMin: 34},
        {icon: 'snow', temperatureMax: 55, temperatureMin: 34},
        {icon: 'sleet', temperatureMax: 55, temperatureMin: 34},
        {icon: 'fog', temperatureMax: 55, temperatureMin: 34},
        {icon: 'wind', temperatureMax: 55, temperatureMin: 34},
        {icon: 'partly-cloudy-day', temperatureMax: 55, temperatureMin: 34}
      ]
    }
  };


  //  ===================
  //  = Event Listeners =
  //  ===================
  document.getElementById('butAdd').addEventListener('click', function() {
    app.toggleDialog(true);
  });

  document.querySelector('#butRefresh').addEventListener('click', function() {
    app.updateForecasts();
  });

  document.querySelector('#butAddCancel').addEventListener('click', function () {
    app.toggleDialog(false);
  })


  document.querySelector('#butAddCity').addEventListener('click', function() {
    var select = document.getElementById('selectCityToAdd');
    var selected = select.options[select.selectedIndex]
    // var selected = select.selectedoptions
    var key = selected.value;
    var label = selected.textContent;
    app.getForecast(key, label);
    app.selectedCities.push({key: key, label: label});
    app.saveSelectedCities();
    app.toggleDialog(false);

  });

  document.addEventListener('DOMContentLoaded', function() {
    window.localforage.getItem('selectedCities', function (err, cityList) {
      if(cityList) {
        app.selectedCities = cityList;
        app.selectedCities.forEach(function(city) {
          app.getForecast(city.key, city.label);
        })
      }
      else {
        // When no city selected then load default city with default data
        app.updateForecastCard(injectedForecast);
        app.selectedCities.push({key: injectedForecast.key, label: injectedForecast.label});
        app.saveSelectedCities();
      }
    })
  })


  //  =====================
  //  = Methods update UI =
  //  =====================
  app.toggleDialog = function (visible) {
    if(visible){
      app.addDialig.classList.add('dialog-container--visible');
    }
    else {
      app.addDialig.classList.remove('dialog-container--visible');
    }

  }

  app.updateForecastCard = function(data) {
    var card = app.visibleCards[data.key]
    if(!card) {
      card = app.addCardFromTemplate(data.key, data.label);
    }
    card.querySelector('.date').textContent = new Date(data.currently.time * 1020);
    card.querySelector('.description').textContent = data.currently.summary;
    card.querySelector('.current .visual .icon').classList.add(data.currently.icon);
    card.querySelector('.current .temperature .value').textContent = Math.round(data.currently.temperature);
    card.querySelector('.current .feels-like .value').textContent = Math.round(data.currently.apparentTemperature);
    card.querySelector('.current .precip').textContent = Math.round(data.currently.precipProbability * 100) + '%';
    card.querySelector('.current .humidity').textContent = Math.round(data.currently.humidity * 100) + '%';
    card.querySelector('.current .wind .value').textContent = Math.round(data.currently.windSpeed);
    card.querySelector('.current .wind .direction').textContent = data.currently.windBearing;

    var nextDays = card.querySelectorAll('.future .oneday');
    var today = new Date();
    today = today.getDay();
    for (var i = 0; i < 7; i++) {
      var nextDay = nextDays[i];
      var daily = data.daily.data[i];
      if( nextDay && daily) {
        nextDay.querySelector('.date').textContent = app.daysOfWeek[(i + today) % 7];
        nextDay.querySelector('.icon').classList.add(daily.icon);
        nextDay.querySelector('.temp-high .value').textContent = Math.round(daily.temperatureMax);
        nextDay.querySelector('.temp-low .value').textContent = Math.round(daily.temperatureMin);
      }
    }
    if(app.isLoading) {
      app.stopLoader();
    }

  }

  app.stopLoader = function() {
    app.spinner.setAttribute('hidden', true);
    app.container.removeAttribute('hidden');
    app.isLoading = false;
  };

  app.startLoader = function() {
    app.spinner.removeAttribute('hidden');
    // app.container.setAttribute('hidden', true);
    app.isLoading = true;
  };

  app.addCardFromTemplate = function(key, label) {
    var card = app.cardTemplate.cloneNode(true); // true to clone deeply
    card.classList.remove('cardTemplate');
    card.querySelector('.location').textContent = label;
    card.removeAttribute('hidden');
    app.container.appendChild(card);
    app.visibleCards[key] = card;
    return(card);
  }


  //  ===============================
  //  = Methods dealing with Models =
  //  ===============================

  app.getForecast = function(key, label) {
    app.startLoader();
    var url = weatherAPIUrlBase + key + '.json'

    // checks if cache is available in browser
    if('caches' in window) {
      caches.match(url).then(function(response) {
        if(response) {
          response.json().then(function(json) {
            // only update if network request is still pending
            if(app.isRequestPending) {
              console.log('Updating card from cache!!!');
              json.key = key;
              json.label = label;
              app.updateForecastCard(json);
            }
          })
        }
      });
    }

    app.isRequestPending = true;
    // Make the XHR to get the data, then update the card
    var request = new XMLHttpRequest();
    request.onreadystatechange = function() {
      if(request.readyState == XMLHttpRequest.DONE && request.status === 200) {
        var response = JSON.parse(request.response);
        response.key = key;
        response.label = label;
        app.isRequestPending = false;
        app.updateForecastCard(response);
      }
    }
    request.open('GET', url);
    request.send();
  }

  app.updateForecasts = function () {
    var keys = Object.keys(app.visibleCards);

    keys.forEach(function (key) {
      app.getForecast(key);
    })
  }

  app.saveSelectedCities = function () {
    window.localforage.setItem('selectedCities', app.selectedCities);
  }

  //  =====================
  //  = SW related things =
  //  =====================
  // if('serviceWorker' in navigator){
  //   navigator.serviceWorker.register('/service-worker.js').
  //     then(function(registration) {
  //       console.log('Service Worker obj: ', registration);
  //     });
  // }

})();
