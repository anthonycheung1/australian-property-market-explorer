(function () {
  var base = '/australian-property-market-explorer';
  var path = window.location.pathname;

  if (path === base + '/') {
    var search = window.location.search;

    if (search.startsWith('?/')) {
      var route = search.slice(2);
      var queryIndex = route.indexOf('&');

      if (queryIndex !== -1) {
        route = route.slice(0, queryIndex);
      }

      var decodedRoute = route
        .split('/')
        .map(function (segment) {
          return decodeURIComponent(segment);
        })
        .join('/');

      window.history.replaceState(
        null,
        '',
        base + '/' + decodedRoute
      );
    }
  }
})();