const url = "http://localhost:5175/hls-proxy?url=" + encodeURIComponent("https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8");

fetch(url)
    .then(res => {
        console.log("Status:", res.status);
        return res.text();
    })
    .then(text => console.log("Body:", text))
    .catch(err => console.error(err));
