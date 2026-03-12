const http = require('http');

http.get('http://localhost:8080/api/fleet/bus-types', (res) => {
    let data = '';
    res.on('data', (chunk) => data += chunk);
    res.on('end', () => {
        console.log("Raw Response:", data.substring(0, 1500));
    });
}).on('error', (err) => {
    console.error("Error: ", err.message);
});
