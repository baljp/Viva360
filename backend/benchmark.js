const start = Date.now();
fetch('http://localhost:3000/api/ping').then(() => {
  console.log('Latency: ' + (Date.now() - start) + 'ms');
});
