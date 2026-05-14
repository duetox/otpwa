let lastAutoSentPhone = '';

function setMessage(message, isError = false) {
  const msgEl = document.getElementById('msg');
  if (!msgEl) return;
  msgEl.textContent = message || '';
  msgEl.style.color = isError ? '#ff6b6b' : '';
}

async function sendOtp(phoneFromAuto = null) {
  const phone = phoneFromAuto ?? document.getElementById('phone').value;
  const res = await fetch('/send-otp',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({phone})});
  const data = await res.json();
  setMessage(data.message, !data.ok);
  return data;
}
async function verifyOtp() {
  const phone = document.getElementById('phone').value;
  const otp = document.getElementById('otp').value;
  const res = await fetch('/verify-otp',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({phone,otp})});
  const data = await res.json();
  setMessage(data.message, !data.ok);
}

document.addEventListener('DOMContentLoaded', () => {
  const phoneInput = document.getElementById('phone');
  const verifyButton = document.getElementById('verify-btn');

  if (phoneInput) {
    phoneInput.addEventListener('change', async () => {
      const phone = phoneInput.value.trim();
      if (!phone || phone === lastAutoSentPhone) return;
      if (!/^\+?[1-9]\d{7,14}$/.test(phone)) {
        setMessage('Enter a valid phone number first.', true);
        return;
      }
      try {
        const data = await sendOtp(phone);
        if (data.ok) {
          lastAutoSentPhone = phone;
          setMessage('🌸 OTP sent successfully. Please check WhatsApp.');
        }
      } catch (_error) {
        setMessage('Unable to send OTP right now. Please try again.', true);
      }
    });
  }
  if (verifyButton) verifyButton.addEventListener('click', verifyOtp);
});
