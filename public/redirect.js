(function () {
  var base = '/australian-property-market-explorer';
  var path = window.location.pathname;
  var search = window.location.search;

  if (path === base + '/' && search.startsWith('?/')) {
    // Restore the complete route, including its query parameters and hash.
    var route = search.slice(2);

    window.history.replaceState(null, '', base + '/' + route + window.location.hash);
  }
})();