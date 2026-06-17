async function test() {
  console.log('Sending test POST request to http://localhost:5173/api/send-email...');
  try {
    const res = await fetch('http://localhost:5173/api/send-email', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        to: 'studydevonly@gmail.com',
        userName: 'Devansh Test',
        propertyName: 'Green Residency Apartment',
        location: 'Indiranagar, Bangalore',
        rent: '₹18,000/mo',
        propertyUrl: 'http://localhost:5173/properties/prop-1'
      })
    });
    console.log('Response HTTP Status:', res.status);
    const body = await res.json();
    console.log('Response Body:', body);
  } catch (err) {
    console.error('Fetch error:', err);
  }
}
test();
