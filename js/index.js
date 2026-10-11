// โหลดสกิน
const viewer = document.getElementById('mainModel');
const input = document.getElementById('upload-skin');
const continueBtn = document.querySelector('.continue__btn');
const settingsOverlay = document.getElementById('settings-overlay');
const settingsClose = document.getElementById('settings-close');

let skinLoaded = false;

input.addEventListener('change', async () => {
  const file = input.files[0];
  if (!file) return;

  if (!file.type.startsWith('image/')) {
    skinLoaded = false;
    showPopup('กรุณาเลือกไฟล์รูปภาพ', 'error');
    return;
  }

  if (!viewer.model) {
    showPopup('โมเดลยังโหลดไม่เสร็จ ลองใหม่อีกครั้ง', 'error');
    return;
  }

  const url = URL.createObjectURL(file);
  const texture = await viewer.createTexture(url);

  texture.sampler.setMinFilter(9728);
  texture.sampler.setMagFilter(9728);

  viewer.model.materials.forEach((material) => {
    material.pbrMetallicRoughness.baseColorTexture.setTexture(texture);
  });

  URL.revokeObjectURL(url);
  skinLoaded = true;
  showPopup('โหลดสกินแล้ว ✅');
});





// เปิด/ปิดหน้าต่างตั้งค่า
function openSettings() {
  settingsOverlay.classList.add('is-open');
}

function closeSettings() {
  settingsOverlay.classList.remove('is-open');
}

continueBtn.addEventListener('click', (e) => {
  e.preventDefault();

  if (!skinLoaded) {
    showPopup('กรุณาเลือกสกินก่อน', 'error');
    return;
  }

  openSettings();
});





// ปิดหน้าต่าง
settingsClose.addEventListener('click', closeSettings);

document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') closeSettings();
});





// เลือกส่วน
const dropdowns = document.querySelectorAll('.dropdown');

dropdowns.forEach((dropdown) => {
  const toggle = dropdown.querySelector('.dropdown__toggle');
  const text = dropdown.querySelector('.dropdown__text');
  const boxes = dropdown.querySelectorAll('input[type="checkbox"]');
  const placeholder = dropdown.dataset.placeholder || 'เลือก...';

  function updateText() {
    const selected = [...boxes].filter((b) => b.checked).map((b) => b.value);
    text.textContent = selected.length ? selected.join(', ') : placeholder;
  }




  
  // เปิด,ปิดเมนู
  toggle.addEventListener('click', () => {
    const willOpen = !dropdown.classList.contains('is-open');
    dropdowns.forEach((d) => {
      d.classList.remove('is-open');
      d.querySelector('.dropdown__toggle').setAttribute('aria-expanded', 'false');
    });
    dropdown.classList.toggle('is-open', willOpen);
    toggle.setAttribute('aria-expanded', willOpen);
  });




  
  // การเลือก
  boxes.forEach((box) => {
    box.addEventListener('change', () => {
      if (box.checked) {
        boxes.forEach((other) => {
          if (other === box) return;

          // เช็กว่าพิเศษไหม
          const involvesExclusive =
            box.hasAttribute('data-exclusive') || other.hasAttribute('data-exclusive');
          if (involvesExclusive) other.checked = false;
        });
      }
      updateText();
    });
  });

  updateText();
});

document.addEventListener('click', (e) => {
  dropdowns.forEach((d) => {
    if (!d.contains(e.target)) {
      d.classList.remove('is-open');
      d.querySelector('.dropdown__toggle').setAttribute('aria-expanded', 'false');
    }
  });
});

function getDropdownValues(name) {
  const dropdown = document.querySelector(`.dropdown[data-name="${name}"]`);
  return [...dropdown.querySelectorAll('input:checked')].map((b) => b.value);
}





// เปลี่ยนสีกรอบ
const frame = document.querySelector('.model-display__border');
const modelDropdown = document.querySelector('.dropdown[data-name="model"]');

function updateFrameColor() {
  const [model] = getDropdownValues('model');

  [frame, modelDropdown].forEach((el) => {
    el.classList.remove('is-steve', 'is-alex');
    if (model === 'Steve') el.classList.add('is-steve');
    if (model === 'Alex') el.classList.add('is-alex');
  });
}

modelDropdown.addEventListener('change', updateFrameColor);('change', updateFrameColor);