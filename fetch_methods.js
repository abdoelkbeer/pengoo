const apiKey = 'ca9484ba8633d15ebbcba89d895494654a1c37b8c893abeacb';
fetch('https://app.fawaterk.com/api/v2/getpaymentmethods', {
    headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
        'Accept': 'application/json'
    }
})
    .then(res => res.json())
    .then(data => console.log(JSON.stringify(data, null, 2)))
    .catch(err => console.error(err));
