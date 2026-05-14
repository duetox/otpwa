async function sendOtp() {
  const phone = document.getElementById('phone').value;
  const res = await fetch('/send-otp',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({phone})});
  const data = await res.json();
  document.getElementById('msg').innerText = data.message;
}
async function verifyOtp() {
  const phone = document.getElementById('phone').value;
  const otp = document.getElementById('otp').value;
  const res = await fetch('/verify-otp',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({phone,otp})});
  const data = await res.json();
  document.getElementById('msg').innerText = data.message;
}

document.addEventListener('DOMContentLoaded', () => {
  const sendCodeButton = document.getElementById('send-code-btn');
  const verifyButton = document.getElementById('verify-btn');

  if (sendCodeButton) sendCodeButton.addEventListener('click', sendOtp);
  if (verifyButton) verifyButton.addEventListener('click', verifyOtp);
});
