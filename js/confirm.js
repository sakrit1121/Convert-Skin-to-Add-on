const confirmBtn = document.getElementById('confirm');
const confirmLabelBtn = document.querySelector('.confirm__btn');
const identifierInput = document.getElementById('identifier');
const namePackInput = document.getElementById('namePack');


const PART_MAP = {
  'หัว': ['head'],
  'ตัว': ['body'],
  'หัว+ตัว (รวมชิ้น)': ['full']
};
const mapParts = (selected) => [...new Set(selected.flatMap((p) => PART_MAP[p] || []))];
const ALL_PARTS = ['head', 'body', 'full'];

const uuid = () => crypto.randomUUID ? crypto.randomUUID() : 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => (c === 'x' ? Math.random() * 16 | 0 : (Math.random() * 16 | 0) & 0x3 | 0x8).toString(16));

identifierInput.addEventListener('input', () => identifierInput.classList.remove('error'));


function validateAllInputs() {
  const identifierValue = identifierInput.value.trim();
  const namePackValue = namePackInput.value.trim();
  const selectedParts = getDropdownValues('part');
  const selectedModels = getDropdownValues('model');

  const fail = (msg, el) => {
    showPopup(msg, 'error');
    if (el) {
      el.classList.add('error');
      el.focus();
    }
    return null;
  };

  if (!identifierValue) return fail('กรุณากรอก Identifier', identifierInput);

  const parts = identifierValue.split(':');
  if (parts.length !== 2) return fail('Identifier ต้องมีเครื่องหมาย : คั่นกลาง 1 ตัวเท่านั้น', identifierInput);

  const [namespace, name] = parts;
  if (namespace.toLowerCase() === 'minecraft')
    return fail('ห้ามใช้ "minecraft" เป็น Identifier หน้าเครื่องหมาย :', identifierInput);

  const segmentPattern = /^[a-z0-9]+(?:_[a-z0-9]+)*$/;
  if (!segmentPattern.test(namespace) || !segmentPattern.test(name))
    return fail('Identifier ต้องเป็นภาษาอังกฤษพิมพ์เล็กเท่านั้น', identifierInput);

  if (!namePackValue) return fail('กรอกชื่อแพ็กแอดออน', namePackInput);
  if (selectedParts.length === 0) return fail('เลือกส่วนที่ต้องการอย่างน้อย 1 ส่วน');
  if (selectedModels.length === 0) return fail('เลือกโมเดล');

  const skinFile = document.getElementById('upload-skin')?.files[0];
  if (!skinFile) return fail('กรุณาเลือกสกินก่อน');

  return {
    identifierVal: identifierValue,
    itemName: namePackValue,
    parts: mapParts(selectedParts),
    model: selectedModels[0],
    skinFile
  };
}

// สร้าง item icon 
const ICON_SIZE = 128;
const ICON_PAD = 8;

function loadImage(file) {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => { URL.revokeObjectURL(url); resolve(img); };
    img.onerror = () => { URL.revokeObjectURL(url); reject(new Error('อ่านไฟล์สกินไม่ได้')); };
    img.src = url;
  });
}


async function buildPartIcon(img, part, isAlex) {
  const k = img.width / 64;
  const legacy = img.height === 32 * k;
  const aw = isAlex ? 3 : 4;

  const withHead = part === 'head' || part === 'full';
  const withBody = part === 'body' || part === 'full';

  const W = withBody ? 8 + aw * 2 : 8;
  const H = (withHead ? 8 : 0) + (withBody ? 24 : 0);

  const src = document.createElement('canvas');
  src.width = W * k;
  src.height = H * k;
  const ctx = src.getContext('2d');
  ctx.imageSmoothingEnabled = false;

  // ขอบรูป
  const draw = (s, dx, dy, flip = false) => {
    const [sx, sy, sw, sh] = s;
    ctx.save();
    if (flip) {
      ctx.translate((dx + sw) * k, dy * k);
      ctx.scale(-1, 1);
    } else {
      ctx.translate(dx * k, dy * k);
    }
    ctx.drawImage(img, sx * k, sy * k, sw * k, sh * k, 0, 0, sw * k, sh * k);
    ctx.restore();
  };
  const layer = (base, overlay, dx, dy, flip = false) => {
    draw(base, dx, dy, flip);
    if (overlay) draw(overlay, dx, dy, flip);
  };

  let y = 0;
  if (withHead) {
    layer([8, 8, 8, 8], [40, 8, 8, 8], withBody ? aw : 0, 0); // หัว + หมวก
    y = 8;
  }
  if (withBody) {
    // ตัว
    layer([20, 20, 8, 12], legacy ? null : [20, 36, 8, 12], aw, y);
    // แขนขวา
    layer([44, 20, aw, 12], legacy ? null : [44, 36, aw, 12], 0, y);
    // แขนซ้าย
    if (legacy) layer([44, 20, aw, 12], null, aw + 8, y, true);
    else layer([36, 52, aw, 12], [52, 52, aw, 12], aw + 8, y);
    // ขาขวา
    layer([4, 20, 4, 12], legacy ? null : [4, 36, 4, 12], aw, y + 12);
    // ขาซ้าย
    if (legacy) layer([4, 20, 4, 12], null, aw + 4, y + 12, true);
    else layer([20, 52, 4, 12], [4, 52, 4, 12], aw + 4, y + 12);
  }


  
  const out = document.createElement('canvas');
  out.width = out.height = ICON_SIZE;
  const octx = out.getContext('2d');
  octx.imageSmoothingEnabled = false;

  const fit = (ICON_SIZE - ICON_PAD * 2) / Math.max(src.width, src.height);
  const scale = fit >= 1 ? Math.floor(fit) : fit;
  const dw = src.width * scale;
  const dh = src.height * scale;
  octx.drawImage(src, Math.round((ICON_SIZE - dw) / 2), Math.round((ICON_SIZE - dh) / 2), dw, dh);

  return new Promise((resolve, reject) => {
    out.toBlob((b) => (b ? resolve(b) : reject(new Error('สร้างไอคอนไม่สำเร็จ'))), 'image/png');
  });
}

async function convertToAddon({ identifierVal, itemName, parts, model, skinFile }) {
  // แปลง identifier เป็นชื่อ
  const rawItemName = identifierVal.split(':')[1];
  const formattedIdentifier = rawItemName.charAt(0).toUpperCase() + rawItemName.slice(1);

  const response = await fetch('templates/template.zip', { cache: 'no-store' });
  if (!response.ok) throw new Error('ดึงไฟล์ templates/template.zip ไม่สำเร็จ');
  const zip = await JSZip.loadAsync(await response.blob());

  // ลบไฟล์
  for (const part of ALL_PARTS.filter((p) => !parts.includes(p))) {
    zip.remove(`BP/items/template.${part}.item.json`);
    zip.remove(`RP/attachables/template.${part}.attachable.json`);
    zip.remove(`RP/models/entity/attachable/template.${part}.geo.json`);
  }

  // เช็กว่า template.zip มีไฟล์ของทุกส่วนที่เลือก
  for (const part of parts) {
    if (!zip.file(`BP/items/template.${part}.item.json`)) {
      throw new Error(`template.zip ไม่มีไฟล์ของส่วน "${part}"`);
    }
  }

  // Alex
  if (model === 'Alex') {
    for (const part of parts) {
      const alexRes = await fetch(`models/Alex/template.${part}.geo.json`, { cache: 'no-store' });
      if (alexRes.ok) {
        zip.file(`RP/models/entity/attachable/template.${part}.geo.json`, await alexRes.blob());
      } else {
        console.warn(`ไม่พบไฟล์ models/Alex/template.${part}.geo.json`);
      }
    }
  }

  // สุ่ม UUID
  const bpHeaderUUID = uuid();
  const bpModuleUUID = uuid();
  const bpFooterUUID = uuid();
  const rpModuleUUID = uuid();
  const rpModuleUUID_2 = uuid();

  // Manifest.json BP
  const bpFile = zip.file('BP/manifest.json');
  if (bpFile) {
    let text = await bpFile.async('text');
    text = text.replace(/\{\{NAME\}\}/g, itemName)
      .replace(/\{\{HEADER_UUID\}\}/g, bpHeaderUUID)
      .replace(/\{\{MODULE_UUID\}\}/g, bpModuleUUID)
      .replace(/\{\{BP_FOOTER_UUID\}\}/g, bpFooterUUID);
    zip.file('BP/manifest.json', text);
  }

  // Manifest.json RP
  const rpFile = zip.file('RP/manifest.json');
  if (rpFile) {
    let text = await rpFile.async('text');
    text = text.replace(/\{\{NAME\}\}/g, itemName)
      .replace(/\{\{HEADER_UUID\}\}/g, bpFooterUUID)
      .replace(/\{\{MODULE_UUID\}\}/g, rpModuleUUID)
      .replace(/\{\{MODULE_UUID_2\}\}/g, rpModuleUUID_2);
    zip.file('RP/manifest.json', text);
  }

  // item.json
  for (const part of parts) {
    const path = `BP/items/template.${part}.item.json`;
    const itemFile = zip.file(path);
    if (itemFile) {
      let text = await itemFile.async('text');
      text = text.replace(/\{\{IDENTIFIER\}\}/g, identifierVal)
        .replace(/\{\{ITEMNAME\}\}/g, formattedIdentifier)
        .replace(/\{\{ITEMICON\}\}/g, identifierVal);
      zip.file(path, text);
    }
  }

  // attachables.json
  for (const part of parts) {
    const path = `RP/attachables/template.${part}.attachable.json`;
    const itemFile = zip.file(path);
    if (itemFile) {
      let text = await itemFile.async('text');
      text = text.replace(/\{\{IDENTIFIER\}\}/g, identifierVal)
        .replace(/\{\{SKINNAME\}\}/g, rawItemName)
        .replace(/\{\{GEONAME\}\}/g, rawItemName);
      zip.file(path, text);
    }
  }

  // geo.json
  for (const part of parts) {
    const path = `RP/models/entity/attachable/template.${part}.geo.json`;
    const itemFile = zip.file(path);
    if (itemFile) {
      let text = await itemFile.async('text');
      text = text.replace(/\{\{GEONAME\}\}/g, rawItemName);
      zip.file(path, text);
    }
  }

  // Skin textures
  const imageArrayBuffer = await skinFile.arrayBuffer();
  zip.file(`RP/textures/entity/attachable/${rawItemName}.png`, imageArrayBuffer);

  // icon Pack
  const iconPackFile = document.getElementById('upload-packIcon')?.files[0];
  if (iconPackFile) {
    const iconArrayBuffer = await iconPackFile.arrayBuffer();
    for (const folder of ['BP', 'RP']) {
      zip.file(`${folder}/pack_icon.png`, iconArrayBuffer);
    }
  }

  // item_texture.json
  const itemTextureFile = zip.file('RP/textures/item_texture.json');
  if (itemTextureFile) {
    let text = await itemTextureFile.async('text');
    text = text.replace(/\{\{PACKNAME\}\}/g, formattedIdentifier)
      .replace(/\{\{IDENTIFIER\}\}/g, identifierVal)
      .replace(/\{\{SKINNAME\}\}/g, rawItemName);

    // ลบรายการไอคอนของส่วนที่ไม่ได้เลือก
    const texJson = JSON.parse(text);
    for (const p of ALL_PARTS.filter((p) => !parts.includes(p))) {
      delete texJson.texture_data[`${identifierVal}_${p}`];
    }
    zip.file('RP/textures/item_texture.json', JSON.stringify(texJson, null, 2));
  }

  // ไอคอนไอเทม: สร้างจากสกินของผู้ใช้ตามส่วนที่เลือก -> {skinname}_{part}.png
  const skinImg = await loadImage(skinFile);
  if (skinImg.width % 64 !== 0 || (skinImg.height !== skinImg.width && skinImg.height !== skinImg.width / 2)) {
    throw new Error('สกินต้องมีขนาด 64x64 หรือ 64x32');
  }
  for (const p of ALL_PARTS) {
    zip.remove(`RP/textures/items/template_${p}.png`); // ลบไอคอนจาก template
  }
  for (const p of parts) {
    const iconBlob = await buildPartIcon(skinImg, p, model === 'Alex');
    zip.file(`RP/textures/items/${rawItemName}_${p}.png`, iconBlob);
  }

  // เปลี่ยนชื่อไฟล์
  const filesToRename = ALL_PARTS.flatMap((part) => [
    { oldPath: `BP/items/template.${part}.item.json`, folder: 'BP/items/', ext: `.${part}.item.json` },
    { oldPath: `RP/attachables/template.${part}.attachable.json`, folder: 'RP/attachables/', ext: `.${part}.attachable.json` },
    { oldPath: `RP/models/entity/attachable/template.${part}.geo.json`, folder: 'RP/models/entity/attachable/', ext: `.${part}.geo.json` },
  ]);

  for (const { oldPath, folder, ext } of filesToRename) {
    const file = zip.file(oldPath);
    if (file) {
      const newPath = `${folder}${formattedIdentifier}${ext}`;
      const fileData = await file.async('arraybuffer');
      zip.file(newPath, fileData);
      zip.remove(oldPath);
    }
  }

  // โหลดลงเครื่อง .mcaddon
  const content = await zip.generateAsync({ type: 'blob' });
  const mcaddonBlob = new Blob([content], { type: 'application/octet-stream' });
  const url = URL.createObjectURL(mcaddonBlob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `${itemName}.mcaddon`;
  link.rel = 'noopener';
  link.style.display = 'none';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);

  setTimeout(() => URL.revokeObjectURL(url), 30000);
}

// ยืนยัน
let converting = false;
async function handleConfirm(e) {
  e.preventDefault();
  e.stopPropagation();
  if (converting) return;

  const formData = validateAllInputs();
  if (!formData) return;

  converting = true;
  showPopup('กำลังแปลง...', 'success', 60000);
  try {
    await convertToAddon(formData);
    showPopup('แปลงสำเร็จ! ✅');
  } catch (err) {
    console.error('การแปลงไฟล์ล้มเหลว:', err);
    showPopup('เกิดข้อผิดพลาด: ' + err.message, 'error');
  } finally {
    converting = false;
  }
}


const trigger = confirmLabelBtn || confirmBtn;
if (trigger) trigger.addEventListener('click', handleConfirm);
