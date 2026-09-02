(function() {
  // 1. Intercept Fetch API (Handles LeetCode)
  const originalFetch = window.fetch;
  window.fetch = async function(...args) {
    const response = await originalFetch.apply(this, args);
    try {
      const clone = response.clone();
      clone.text().then(text => {
        if (text.includes('"Accepted"') || text.includes('"SUCCESS"')) {
          window.postMessage({ type: 'DSA_SUCCESS' }, '*');
        }
      }).catch(e => {});
    } catch(err) {}
    return response;
  };

  // 2. Intercept XHR API (Handles NeetCode / Axios requests)
  const XHR = XMLHttpRequest.prototype;
  const originalSend = XHR.send;
  XHR.send = function() {
    this.addEventListener('load', function() {
      try {
        if (this.responseText && this.responseText.includes('"Accepted"')) {
          window.postMessage({ type: 'DSA_SUCCESS' }, '*');
        }
      } catch(e) {}
    });
    return originalSend.apply(this, arguments);
  };
})();
