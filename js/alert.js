// แจ้งเตือน
const popup = document.getElementById('popup');
const popupText = document.getElementById('popup-text');
let popupTimer;

function showPopup(message, type = 'success', duration = 2500) {
  popupText.textContent = message;
  popup.className = `popup popup--${type} popup--show`;

  clearTimeout(popupTimer);
  popupTimer = setTimeout(() => popup.classList.remove('popup--show'), duration);
}