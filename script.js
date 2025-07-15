// --- SPA Tabs ---
const tabs = document.querySelectorAll('.tab-btn');
const sections = document.querySelectorAll('.tab-section');
tabs.forEach(tab => {
  tab.addEventListener('click', () => {
    tabs.forEach(t => t.classList.remove('active'));
    tab.classList.add('active');
    sections.forEach(sec => sec.style.display = 'none');
    document.getElementById(tab.dataset.tab).style.display = 'block';
  });
});
if (tabs[0]) tabs[0].click();

// --- Перемикання вкладок (сучасна логіка) ---
const tabBtns = document.querySelectorAll('.tab-btn');
const tabSections = document.querySelectorAll('.tab-section');
const orderTabBtn = document.querySelector('.tab-btn[data-tab="order-section"]');

function isProfileFilled() {
  const data = JSON.parse(localStorage.getItem('taxi_profile')) || {};
  return data.name && data.email && data.phone;
}

function updateOrderTabAccess() {
  if (!orderTabBtn) return;
  if (!isProfileFilled()) {
    orderTabBtn.classList.add('disabled');
    orderTabBtn.setAttribute('aria-disabled', 'true');
  } else {
    orderTabBtn.classList.remove('disabled');
    orderTabBtn.removeAttribute('aria-disabled');
  }
}

function switchTab(tabId) {
  // Якщо це order-section і профіль не заповнений — не перемикаємо, показуємо підказку
  if (tabId === 'order-section' && !isProfileFilled()) {
    showPopup('Заповніть профіль, щоб замовити таксі!');
    return;
  }
  tabBtns.forEach(btn => {
    const isActive = btn.dataset.tab === tabId;
    btn.classList.toggle('active', isActive);
    btn.setAttribute('aria-selected', isActive ? 'true' : 'false');
  });
  tabSections.forEach(sec => {
    sec.classList.toggle('active', sec.id === tabId);
  });
}
// За замовчуванням активний профіль
switchTab('profile');
updateOrderTabAccess();

tabBtns.forEach(btn => {
  btn.addEventListener('click', () => {
    switchTab(btn.dataset.tab);
  });
});

// --- LocalStorage Keys ---
const LS_PROFILE = 'taxi_profile';
const LS_TRIPS = 'taxi_trips';

// --- Profile Logic ---
const profileName = document.getElementById('profile-name');
const profileEmail = document.getElementById('profile-email');
const profilePhoto = document.getElementById('profile-photo');
const profilePhone = document.getElementById('profile-phone');
const saveProfileBtn = document.getElementById('save-profile');
const editPhotoBtn = document.getElementById('edit-photo');
const photoUpload = document.getElementById('photo-upload');
const photoDropzone = document.getElementById('profile-photo-dropzone');

// --- UX: клік по фото профілю відкриває вибір файлу ---
if (photoDropzone && photoUpload) {
  photoDropzone.addEventListener('click', (e) => {
    if (e.target === profilePhoto || e.target === photoDropzone) {
      photoUpload.click();
    }
  });
  // Підказка
  photoDropzone.setAttribute('data-tooltip', 'Клікніть або перетягніть фото');
  // Drag&Drop
  photoDropzone.addEventListener('dragover', (e) => {
    e.preventDefault();
    photoDropzone.classList.add('dragover');
  });
  photoDropzone.addEventListener('dragleave', (e) => {
    e.preventDefault();
    photoDropzone.classList.remove('dragover');
  });
  photoDropzone.addEventListener('drop', (e) => {
    e.preventDefault();
    photoDropzone.classList.remove('dragover');
    const file = e.dataTransfer.files[0];
    if (file && file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onload = (ev) => {
        profilePhoto.src = ev.target.result;
        profilePhoto.classList.add('pulse');
        setTimeout(()=>profilePhoto.classList.remove('pulse'), 700);
        const data = JSON.parse(localStorage.getItem(LS_PROFILE)) || {};
        data.photo = ev.target.result;
        localStorage.setItem(LS_PROFILE, JSON.stringify(data));
        showPopup('Фото оновлено!');
      };
      reader.readAsDataURL(file);
    }
  });
}

function loadProfile() {
  const data = JSON.parse(localStorage.getItem(LS_PROFILE)) || {};
  profileName.value = data.name || '';
  profileEmail.value = data.email || '';
  profilePhoto.src = data.photo || 'https://i.imgur.com/1Q9Z1Zm.png';
  if (profilePhone) profilePhone.value = data.phone || '';
  // Підсвічування вибраної аватарки при завантаженні
  document.querySelectorAll('.avatar-choice').forEach(img => {
    img.classList.toggle('selected', img.src === profilePhoto.src);
  });
}
function saveProfile() {
  const data = {
    name: profileName.value.trim(),
    email: profileEmail.value.trim(),
    phone: profilePhone ? profilePhone.value.trim() : '',
    photo: profilePhoto.src
  };
  localStorage.setItem(LS_PROFILE, JSON.stringify(data));
  showPopup('Профіль збережено!');
  checkProfileAndOrderAccess();
  // Підсвічування вибраної аватарки після збереження
  document.querySelectorAll('.avatar-choice').forEach(img => {
    img.classList.toggle('selected', img.src === profilePhoto.src);
  });
}
if (saveProfileBtn) saveProfileBtn.onclick = saveProfile;
if (editPhotoBtn && photoUpload) {
  editPhotoBtn.onclick = () => photoUpload.click();
  photoUpload.onchange = e => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = e => {
      profilePhoto.src = e.target.result;
      profilePhoto.classList.add('pulse');
      setTimeout(()=>profilePhoto.classList.remove('pulse'), 700);
      const data = JSON.parse(localStorage.getItem(LS_PROFILE)) || {};
      data.photo = e.target.result;
      localStorage.setItem(LS_PROFILE, JSON.stringify(data));
      showPopup('Фото оновлено!');
    };
    reader.readAsDataURL(file);
  };
}
// --- Вибір аватарки ---
loadProfile();

function checkProfileAndOrderAccess() {
  const data = JSON.parse(localStorage.getItem(LS_PROFILE)) || {};
  const orderForm = document.getElementById('order-form');
  const orderLocked = document.getElementById('order-locked');
  const hasProfile = data.name && data.email && data.phone;
  if (!hasProfile) {
    if (orderForm) Array.from(orderForm.elements).forEach(el => el.disabled = true);
    if (orderLocked) orderLocked.style.display = 'block';
  } else {
    if (orderForm) Array.from(orderForm.elements).forEach(el => el.disabled = false);
    if (orderLocked) orderLocked.style.display = 'none';
  }
}
checkProfileAndOrderAccess();

// --- Trips/History Logic ---
function loadTrips() {
  const trips = JSON.parse(localStorage.getItem(LS_TRIPS)) || [];
  const list = document.getElementById('trips-list');
  if (!list) return;
  if (!trips.length) {
    list.innerHTML = '<div style="color:#888;">Немає завершених поїздок</div>';
    return;
  }
  list.innerHTML = '';
  trips.slice().reverse().forEach((trip, idx) => {
    const realIdx = trips.length - 1 - idx;
    const card = document.createElement('div');
    card.className = 'trip-card';
    card.innerHTML = `
      <div class="trip-header">
        <span>${trip.date}</span>
        <span>${trip.carType ? trip.carType.charAt(0).toUpperCase() + trip.carType.slice(1) : ''}</span>
      </div>
      <div class="trip-info"><b>${trip.from}</b> <i class="fa-solid fa-arrow-right"></i> <b>${trip.to}</b></div>
      <div class="trip-info">Відстань: ${trip.distance || '-'} км, Час: ${trip.duration || '-'} хв, Ціна: <b>${trip.price || '-'} грн</b></div>
      <div class="trip-info">Оплата: <b>${trip.payment === 'card' ? 'Картка' : 'Готівка'}</b></div>
      <div class="trip-info">${trip.extras && trip.extras.length ? 'Додатково: ' + trip.extras.join(', ') : ''}</div>
      <div class="trip-info">Водій: <img src="${trip.driver.photo}" style="width:32px;height:32px;border-radius:50%;vertical-align:middle;margin-right:6px;"> <b>${trip.driver.name}</b>, ${trip.driver.brand}, <span style="display:inline-block;width:14px;height:14px;border-radius:50%;background:${trip.driver.colorHex};border:1.5px solid #ffd600;margin:0 4px;"></span> ${trip.driver.colorName}, <span class="car-number">${trip.driver.number}</span></div>
      <div class="trip-info">Статус: <span style="color:#1976d2;font-weight:600;">${trip.driver.status}</span>, Час подачі: ${trip.driver.time} хв</div>
      <div class="trip-info">Телефон водія: <a href="tel:${trip.driver.phone}" style="color:#1976d2;text-decoration:none;">${trip.driver.phone}</a></div>
    `;
    // Відгук
    if (trip.review) {
      const reviewDiv = document.createElement('div');
      reviewDiv.className = 'trip-info reviewed';
      reviewDiv.innerHTML = `
        <span class='review-stars'>${'★'.repeat(trip.review.rating)}${'☆'.repeat(5-trip.review.rating)}</span>
        ${trip.review.comment ? `<span class='review-comment-text'><i class='fa-solid fa-comment'></i> ${trip.review.comment}</span>` : ''}
        <button class='edit-review-btn' title='Редагувати' onclick='window.editReview${realIdx}()'><i class="fa-solid fa-pen"></i></button>
      `;
      card.appendChild(reviewDiv);
      window['editReview'+realIdx] = () => {
        reviewDiv.remove();
        renderReviewInline(card, trip, realIdx);
      };
    } else {
      const reviewBtn = document.createElement('button');
      reviewBtn.className = 'main-btn review-save-btn';
      reviewBtn.textContent = 'Залишити відгук';
      reviewBtn.onclick = () => renderReviewInline(card, trip, realIdx);
      card.appendChild(reviewBtn);
    }
    list.appendChild(card);
  });
}
function showRatingPopup(idx) {
  const popup = document.createElement('div');
  popup.className = 'popup';
  popup.style.display = 'block';
  popup.innerHTML = `
    <div style="margin-bottom:10px;">Оцініть поїздку:</div>
    <div id="stars" style="font-size:2rem; color:#ffd600; margin-bottom:10px;">
      ${'<i class="fa-solid fa-star"></i>'.repeat(5)}
    </div>
    <input id="rate-comment" type="text" placeholder="Коментар..." style="width:100%; border-radius:8px; padding:6px 10px; border:none; margin-bottom:10px;">
    <button id="submit-rating" class="main-btn">Зберегти</button>
  `;
  document.body.appendChild(popup);
  let rating = 5;
  const stars = popup.querySelectorAll('#stars i');
  stars.forEach((star, i) => {
    star.onmouseover = () => {
      stars.forEach((s, j) => s.style.color = j <= i ? '#ffd600' : '#ccc');
    };
    star.onmouseout = () => {
      stars.forEach((s, j) => s.style.color = j < rating ? '#ffd600' : '#ccc');
    };
    star.onclick = () => {
      rating = i+1;
      stars.forEach((s, j) => s.style.color = j < rating ? '#ffd600' : '#ccc');
    };
  });
  popup.querySelector('#submit-rating').onclick = () => {
    const comment = popup.querySelector('#rate-comment').value;
    const trips = JSON.parse(localStorage.getItem(LS_TRIPS)) || [];
    trips[idx].rating = rating;
    trips[idx].comment = comment;
    localStorage.setItem(LS_TRIPS, JSON.stringify(trips));
    document.body.removeChild(popup);
    loadTrips();
    showPopup('Дякуємо за оцінку!');
  };
}
loadTrips();

// --- Order Taxi Logic ---
const orderTaxiBtn = document.getElementById('order-taxi-btn');
const orderForm = document.getElementById('order-form');
const addWaypointBtn = document.getElementById('add-waypoint');
const waypointsContainer = document.getElementById('waypoints-container');
const orderMapDiv = document.getElementById('order-map');
const fromInput = document.getElementById('order-from');
const toInput = document.getElementById('order-to');
const fromMapPickBtn = document.getElementById('from-map-pick');
const toMapPickBtn = document.getElementById('to-map-pick');
let orderMap, fromMarker, toMarker;
let activeMapPickInput = null;
const selectedAddressDiv = document.getElementById('selected-address');

// --- Ініціалізація карти ---
function initOrderMap() {
  if (orderMap) return;
  orderMap = L.map('order-map').setView([50.4501, 30.5234], 12);
  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '© OpenStreetMap'
  }).addTo(orderMap);
}

if (orderTaxiBtn && orderForm) {
  orderTaxiBtn.onclick = () => {
    orderForm.style.display = orderForm.style.display === 'none' ? 'block' : 'none';
    if (orderForm.style.display === 'block') {
      orderForm.scrollIntoView({behavior: 'smooth', block: 'center'});
      setTimeout(() => {
        initOrderMap();
        orderMap.invalidateSize();
      }, 200);
    }
  };
}

// --- Вибір адреси на мапі ---
function enableMapPick(targetInput, markerType) {
  if (!orderMap) {
    showPopup('Карта ще не завантажена!');
    console.log('enableMapPick: карта не ініціалізована');
    return;
  }
  orderMap.getContainer().style.cursor = 'crosshair';
  showPopup('Клікніть на мапі, щоб вибрати адресу');
  activeMapPickInput = targetInput;
  console.log('enableMapPick: активовано для', markerType, targetInput);

  // Скидаємо попередній обробник кліку, якщо був
  orderMap.off('click');

  orderMap.once('click', function(e) {
    console.log('orderMap click:', e.latlng);
    fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${e.latlng.lat}&lon=${e.latlng.lng}`)
      .then(r=>r.json())
      .then(data => {
        console.log('Nominatim response:', data);
        if (data && data.display_name) {
          targetInput.value = data.display_name;
          showPopup('Адресу вибрано!');
          debounceUpdateRouteInfo();
        } else {
          showPopup('Не вдалося знайти адресу');
          console.log('Не вдалося знайти адресу');
        }
      })
      .catch((err)=>{
        showPopup('Не вдалося знайти адресу');
        console.log('fetch error:', err);
      });
    if (markerType === 'from') {
      if (fromMarker) orderMap.removeLayer(fromMarker);
      fromMarker = L.marker(e.latlng).addTo(orderMap);
    } else if (markerType === 'to') {
      if (toMarker) orderMap.removeLayer(toMarker);
      toMarker = L.marker(e.latlng).addTo(orderMap);
    }
    activeMapPickInput = null;
    orderMap.getContainer().style.cursor = '';
    orderMap.off('click'); // Скидаємо обробник після вибору
  });
}
if (fromMapPickBtn) fromMapPickBtn.onclick = () => {
  if (!orderMap) {
    initOrderMap();
    setTimeout(() => enableMapPick(fromInput, 'from'), 250);
  } else {
    enableMapPick(fromInput, 'from');
  }
};
if (toMapPickBtn) toMapPickBtn.onclick = () => {
  if (!orderMap) {
    initOrderMap();
    setTimeout(() => enableMapPick(toInput, 'to'), 250);
  } else {
    enableMapPick(toInput, 'to');
  }
};

// --- Додавання/видалення зупинок ---
function createWaypointField() {
  const group = document.createElement('div');
  group.className = 'waypoint-group input-with-btn';
  const input = document.createElement('input');
  input.type = 'text';
  input.className = 'waypoint-input';
  input.placeholder = 'Введіть адресу зупинки...';
  const btn = document.createElement('button');
  btn.type = 'button';
  btn.className = 'map-pick-btn';
  btn.title = 'Вибрати на мапі';
  btn.innerHTML = '<i class="fa-solid fa-map"></i>';
  // TODO: інтеграція з мапою для вибору точки
  const removeBtn = document.createElement('button');
  removeBtn.type = 'button';
  removeBtn.className = 'remove-waypoint-btn';
  removeBtn.title = 'Видалити зупинку';
  removeBtn.innerHTML = '<i class="fa-solid fa-xmark"></i>';
  removeBtn.onclick = () => waypointsContainer.removeChild(group);
  group.appendChild(input);
  group.appendChild(btn);
  group.appendChild(removeBtn);
  waypointsContainer.appendChild(group);
}
if (addWaypointBtn) addWaypointBtn.onclick = createWaypointField;

// --- Базова валідація (приклад, можна розширити) ---
orderForm && orderForm.addEventListener('submit', e => {
  e.preventDefault();
  // TODO: додати перевірку профілю, адрес, зупинок, класу авто, опцій
  alert('Замовлення відправлено! (логіка буде додана)');
  orderForm.reset();
  waypointsContainer.innerHTML = '';
  orderForm.style.display = 'none';
});

// --- Map pick logic for address fields ---
// function enableMapPick(targetInput) { ... }
// const fromMapPickBtn = document.getElementById('from-map-pick');
// const toMapPickBtn = document.getElementById('to-map-pick');
// if (fromMapPickBtn) fromMapPickBtn.onclick = () => enableMapPick(fromInput);
// if (toMapPickBtn) toMapPickBtn.onclick = () => enableMapPick(toInput);
// const waypointsContainer = document.getElementById('waypoints-container');
// const addWaypointBtn = document.getElementById('add-waypoint');
// let waypointCount = 0;
// function createWaypointField() { ... }
// if (addWaypointBtn) addWaypointBtn.onclick = createWaypointField;
// function getWaypointValues() { ... }

// --- Розрахунок маршруту, часу, ціни ---
const routeInfoDiv = document.getElementById('route-info');
const carTypeSelect = document.getElementById('car-type');

function getTariff(type) {
  if (type === 'econom') return {base: 50, perKm: 10};
  if (type === 'comfort') return {base: 70, perKm: 13};
  if (type === 'lux') return {base: 120, perKm: 20};
  return {base: 50, perKm: 10};
}

function showRouteInfo(distanceKm, durationMin, price, message) {
  if (!routeInfoDiv) return;
  routeInfoDiv.style.display = 'block';
  if (message) {
    routeInfoDiv.innerHTML = `<span>${message}</span>`;
  } else {
    routeInfoDiv.innerHTML = `<span>Відстань: <b>${distanceKm} км</b></span> | <span>Час: <b>${durationMin} хв</b></span> | <span>Ціна: <b>${price} грн</b></span>`;
  }
}
function hideRouteInfo() {
  if (routeInfoDiv) routeInfoDiv.style.display = 'none';
}

async function geocodeAddress(address) {
  if (!address) return null;
  const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(address)}`;
  try {
    const res = await fetch(url);
    const data = await res.json();
    if (data && data[0]) {
      return {lat: parseFloat(data[0].lat), lon: parseFloat(data[0].lon)};
    }
  } catch {}
  return null;
}

let routeLine = null;
let paymentType = 'cash';

const paymentCash = document.getElementById('payment-cash');
const paymentCard = document.getElementById('payment-card');
const cardFields = document.getElementById('card-fields');
if (paymentCash) paymentCash.onchange = () => {
  paymentType = 'cash';
  if (cardFields) cardFields.style.display = 'none';
};
if (paymentCard) paymentCard.onchange = () => {
  paymentType = 'card';
  if (cardFields) cardFields.style.display = 'block';
};

async function updateRouteInfo() {
  const from = fromInput.value.trim();
  const to = toInput.value.trim();
  if (!from || !to) {
    showRouteInfo(null, null, null, 'Введіть адреси для розрахунку');
    if (routeLine && orderMap) { orderMap.removeLayer(routeLine); routeLine = null; }
    return;
  }
  // Геокодування
  const [fromCoord, toCoord] = await Promise.all([
    geocodeAddress(from),
    geocodeAddress(to)
  ]);
  if (!fromCoord || !toCoord) {
    showRouteInfo(null, null, null, 'Не вдалося знайти координати адрес');
    if (routeLine && orderMap) { orderMap.removeLayer(routeLine); routeLine = null; }
    return;
  }
  // OSRM
  const osrmUrl = `https://router.project-osrm.org/route/v1/driving/${fromCoord.lon},${fromCoord.lat};${toCoord.lon},${toCoord.lat}?overview=full&geometries=geojson`;
  try {
    const res = await fetch(osrmUrl);
    const data = await res.json();
    if (data && data.routes && data.routes[0]) {
      const distKm = (data.routes[0].distance / 1000).toFixed(1);
      const durMin = Math.round(data.routes[0].duration / 60);
      const tariff = getTariff(carTypeSelect ? carTypeSelect.value : 'econom');
      const price = Math.round(tariff.base + tariff.perKm * distKm);
      showRouteInfo(distKm, durMin, price + (paymentType === 'card' ? ' (картка)' : ''));
      // Малюємо маршрут
      if (routeLine && orderMap) orderMap.removeLayer(routeLine);
      routeLine = L.geoJSON(data.routes[0].geometry, {color:'#1976d2', weight:5, opacity:0.85}).addTo(orderMap);
      // Центруємо карту на маршрут
      const bounds = routeLine.getBounds();
      orderMap.fitBounds(bounds, {padding:[30,30]});
    } else {
      showRouteInfo(null, null, null, 'Маршрут не знайдено');
      if (routeLine && orderMap) { orderMap.removeLayer(routeLine); routeLine = null; }
    }
  } catch {
    showRouteInfo(null, null, null, 'Помилка при розрахунку маршруту');
    if (routeLine && orderMap) { orderMap.removeLayer(routeLine); routeLine = null; }
  }
}
// Debounce для запитів
let routeInfoTimeout = null;
function debounceUpdateRouteInfo() {
  if (routeInfoTimeout) clearTimeout(routeInfoTimeout);
  routeInfoTimeout = setTimeout(updateRouteInfo, 600);
}
const calcRouteBtn = document.getElementById('calc-route-btn');
if (calcRouteBtn) {
  calcRouteBtn.onclick = function() {
    updateRouteInfo();
  };
}
// Вимикаю автоматичний розрахунок при input/change:
// if (fromInput) fromInput.addEventListener('input', debounceUpdateRouteInfo);
// if (toInput) toInput.addEventListener('input', debounceUpdateRouteInfo);
// if (carTypeSelect) carTypeSelect.addEventListener('change', debounceUpdateRouteInfo);

// --- Scroll to top button ---
const scrollTopBtn = document.getElementById('scroll-top-btn');
window.addEventListener('scroll', () => {
  if (window.scrollY > 200) {
    scrollTopBtn.style.display = 'flex';
  } else {
    scrollTopBtn.style.display = 'none';
  }
});
scrollTopBtn.onclick = () => window.scrollTo({top:0, behavior:'smooth'});
// --- Skeleton loader for map ---
function showMapSkeleton() {
  if (orderMapDiv && !orderMap) orderMapDiv.innerHTML = '<div class="skeleton skeleton-map"></div>';
}
function hideMapSkeleton() {
  if (orderMapDiv && !orderMap) {
    orderMapDiv.innerHTML = '';
    // НЕ ініціалізуємо карту тут!
    // initMap();
    // mapInitialized = true;
  }
}
// --- Skeleton loader for trips ---
function showTripsSkeleton() {
  const list = document.getElementById('trips-list');
  if (list) list.innerHTML = Array(3).fill('<div class="skeleton skeleton-trip"></div>').join('');
}
function hideTripsSkeleton() {
  const list = document.getElementById('trips-list');
  if (list) list.innerHTML = '';
}
// --- Fade animation for tab transitions ---
sections.forEach(sec => sec.style.opacity = 1);
tabs.forEach(tab => {
  tab.addEventListener('click', () => {
    sections.forEach(sec => sec.style.transition = 'opacity 0.35s');
    sections.forEach(sec => sec.style.opacity = 0);
    setTimeout(() => {
      sections.forEach(sec => sec.style.display = 'none');
      document.getElementById(tab.dataset.tab).style.display = 'block';
      setTimeout(() => {
        document.getElementById(tab.dataset.tab).style.opacity = 1;
      }, 30);
    }, 180);
  });
});
// --- Show skeletons on load ---
showMapSkeleton();
showTripsSkeleton();
window.addEventListener('DOMContentLoaded', () => {
  setTimeout(() => {
    hideMapSkeleton();
    hideTripsSkeleton();
    loadTrips();
    // НЕ ініціалізуємо карту тут!
    // if (map) map.invalidateSize();
  }, 900);
}); 

const floatingOrderBtn = document.getElementById('floating-order-btn');
function isMobile() {
  return window.innerWidth <= 600;
}
function showFloatingOrderBtn() {
  if (!floatingOrderBtn) return;
  if (isMobile() && document.body.contains(floatingOrderBtn)) {
    floatingOrderBtn.style.display = 'flex';
  } else {
    floatingOrderBtn.style.display = 'none';
  }
}
window.addEventListener('resize', showFloatingOrderBtn);
window.addEventListener('DOMContentLoaded', showFloatingOrderBtn);
if (floatingOrderBtn) {
  floatingOrderBtn.onclick = () => {
    const orderTab = Array.from(tabs).find(tab => tab.dataset.tab === 'order');
    if (orderTab) orderTab.click();
    setTimeout(() => {
      const orderSection = document.getElementById('order');
      if (orderSection) orderSection.scrollIntoView({behavior:'smooth'});
    }, 120);
  };
}
tabs.forEach(tab => {
  tab.addEventListener('click', () => {
    if (isMobile() && tab.dataset.tab === 'order') {
      floatingOrderBtn.style.display = 'none';
    } else {
      showFloatingOrderBtn();
    }
  });
}); 

// --- Головна кнопка вибору адреси на мапі ---
const mapPickMainBtn = document.getElementById('map-pick-main-btn');

let mapPickMode = null; // 'from' або 'to'

function enableMapPickSimple(type) {
  mapPickMode = type; // 'from' або 'to'
  orderMap.getContainer().style.cursor = 'crosshair';
  showPopup(`Клікніть на мапі, щоб вибрати адресу для поля "${type === 'from' ? 'Звідки' : 'Куди'}"`);
}

// Глобальний обробник кліку по карті
function onMapClick(e) {
  if (!mapPickMode) return;
  const targetInput = mapPickMode === 'from' ? fromInput : toInput;
  fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${e.latlng.lat}&lon=${e.latlng.lng}`)
    .then(r=>r.json())
    .then(data => {
      if (data && data.display_name) {
        targetInput.value = data.display_name;
        showPopup('Адресу вибрано!');
        debounceUpdateRouteInfo();
      } else {
        showPopup('Не вдалося знайти адресу');
      }
    })
    .catch(()=>showPopup('Не вдалося знайти адресу'));
  if (mapPickMode === 'from') {
    if (fromMarker) orderMap.removeLayer(fromMarker);
    fromMarker = L.marker(e.latlng).addTo(orderMap);
  } else if (mapPickMode === 'to') {
    if (toMarker) orderMap.removeLayer(toMarker);
    toMarker = L.marker(e.latlng).addTo(orderMap);
  }
  mapPickMode = null;
  orderMap.getContainer().style.cursor = '';
}

// Підписуємо глобальний обробник після ініціалізації карти
const origInitOrderMap = initOrderMap;
initOrderMap = function() {
  origInitOrderMap();
  orderMap.on('click', onMapClick);
}

// Оновлюємо showMapPickChoice для нового режиму
function showMapPickChoice() {
  let popup = document.createElement('div');
  popup.className = 'popup map-pick-choice-popup';
  popup.style.display = 'block';
  popup.innerHTML = `
    <div style="margin-bottom:12px;font-size:1.13em;">Виберіть, яку адресу вказати на мапі:</div>
    <button class="main-btn" id="pick-from-btn" style="margin-bottom:8px;"><i class="fa-solid fa-location-dot"></i> Звідки</button><br>
    <button class="main-btn" id="pick-to-btn"><i class="fa-solid fa-location-dot"></i> Куди</button>
    <button class="main-btn" id="close-map-pick-choice" style="background:#222;color:#ffd600;margin-top:14px;">Скасувати</button>
  `;
  document.body.appendChild(popup);
  document.getElementById('pick-from-btn').onclick = () => {
    document.body.removeChild(popup);
    if (!orderMap) { initOrderMap(); setTimeout(()=>enableMapPickSimple('from'), 250); }
    else enableMapPickSimple('from');
  };
  document.getElementById('pick-to-btn').onclick = () => {
    document.body.removeChild(popup);
    if (!orderMap) { initOrderMap(); setTimeout(()=>enableMapPickSimple('to'), 250); }
    else enableMapPickSimple('to');
  };
  document.getElementById('close-map-pick-choice').onclick = () => {
    document.body.removeChild(popup);
  };
}
if (mapPickMainBtn) {
  mapPickMainBtn.onclick = showMapPickChoice;
} 

function getRandomDriver() {
  const names = ['Олександр', 'Іван', 'Максим', 'Андрій', 'Віктор', 'Дмитро', 'Сергій'];
  const cars = [
    {brand: 'Toyota Camry', color: 'black', colorName: 'Чорний', colorHex: '#222', photo: 'https://randomuser.me/api/portraits/men/32.jpg'},
    {brand: 'Skoda Octavia', color: 'white', colorName: 'Білий', colorHex: '#fff', photo: 'https://randomuser.me/api/portraits/men/45.jpg'},
    {brand: 'Hyundai Sonata', color: 'blue', colorName: 'Синій', colorHex: '#1976d2', photo: 'https://randomuser.me/api/portraits/men/76.jpg'},
    {brand: 'Kia Optima', color: 'gray', colorName: 'Сірий', colorHex: '#888', photo: 'https://randomuser.me/api/portraits/men/85.jpg'},
    {brand: 'Volkswagen Passat', color: 'red', colorName: 'Червоний', colorHex: '#d32f2f', photo: 'https://randomuser.me/api/portraits/men/23.jpg'}
  ];
  const numbers = ['AA 1234 OO', 'KA 5678 BI', 'BC 4321 AC', 'AI 8765 CH', 'AB 2468 EK'];
  const phones = ['+380501234567', '+380671112233', '+380931234567', '+380991234567'];
  const statuses = ['Водій прямує до вас', 'Водій неподалік', 'Очікуйте авто біля під’їзду'];
  const times = [2, 3, 4, 5];
  const driver = {
    name: names[Math.floor(Math.random()*names.length)],
    ...cars[Math.floor(Math.random()*cars.length)],
    number: numbers[Math.floor(Math.random()*numbers.length)],
    phone: phones[Math.floor(Math.random()*phones.length)],
    status: statuses[Math.floor(Math.random()*statuses.length)],
    time: times[Math.floor(Math.random()*times.length)]
  };
  return driver;
}

function showOrderDetailsPopup() {
  const popup = document.getElementById('order-details-popup');
  if (!popup) return;
  const driver = getRandomDriver();
  popup.innerHTML = `
    <img class="driver-photo" src="${driver.photo}" alt="Фото водія">
    <div class="driver-name"><i class="fa-solid fa-user"></i> ${driver.name}</div>
    <div class="car-info"><i class="fa-solid fa-car"></i> ${driver.brand} <span class="car-color" style="background:${driver.colorHex}"></span> ${driver.colorName} <span class="car-number">${driver.number}</span></div>
    <div class="order-status"><i class="fa-solid fa-location-arrow"></i> ${driver.status}</div>
    <div class="order-time"><i class="fa-solid fa-clock"></i> Час подачі: ${driver.time} хв</div>
    <div class="driver-phone"><i class="fa-solid fa-phone"></i> <a href="tel:${driver.phone}" style="color:inherit;text-decoration:none;">${driver.phone}</a></div>
    <button class="close-details-btn">Закрити</button>
  `;
  popup.style.display = 'flex';
  document.body.style.overflow = 'hidden';
  popup.querySelector('.close-details-btn').onclick = () => {
    popup.style.display = 'none';
    document.body.style.overflow = '';
  };
}

// --- Зберігання замовлення в історію ---
function saveTripToHistory(trip) {
  const trips = JSON.parse(localStorage.getItem(LS_TRIPS)) || [];
  trips.push(trip);
  localStorage.setItem(LS_TRIPS, JSON.stringify(trips));
}

// Оновлений сабміт форми замовлення
if (orderForm) {
  orderForm.addEventListener('submit', async e => {
    e.preventDefault();
    // Збираємо всі дані замовлення
    const from = fromInput.value.trim();
    const to = toInput.value.trim();
    const carType = carTypeSelect ? carTypeSelect.value : 'econom';
    const payment = paymentType;
    const extras = [];
    if (document.getElementById('extra-childseat')?.checked) extras.push('Дитяче крісло');
    if (document.getElementById('extra-pet')?.checked) extras.push('Тварина');
    if (document.getElementById('extra-ac')?.checked) extras.push('Кондиціонер');
    const comment = document.getElementById('order-comment')?.value || '';
    // Дані маршруту (останній розрахунок)
    let distance = null, duration = null, price = null;
    if (routeInfoDiv && routeInfoDiv.innerText.match(/Відстань/)) {
      const m = routeInfoDiv.innerText.match(/Відстань: ([\d\.]+) км.*Час: (\d+) хв.*Ціна: (\d+)/);
      if (m) {
        distance = m[1];
        duration = m[2];
        price = m[3];
      }
    }
    // Дані водія/авто
    const driver = getRandomDriver();
    const trip = {
      date: new Date().toLocaleString('uk-UA', {dateStyle:'short', timeStyle:'short'}),
      from, to, carType, payment, extras, comment,
      distance, duration, price,
      driver
    };
    saveTripToHistory(trip);
    showOrderDetailsPopup();
    loadTrips();
    orderForm.reset();
    waypointsContainer.innerHTML = '';
    orderForm.style.display = 'none';
    if (paymentType === 'card') {
      const cardNumber = document.getElementById('card-number').value.replace(/\s+/g, '');
      const cardExp = document.getElementById('card-exp').value.trim();
      const cardCVV = document.getElementById('card-cvv').value.trim();
      if (!/^\d{16}$/.test(cardNumber)) {
        showPopup('Введіть коректний номер картки (16 цифр)');
        return;
      }
      if (!/^\d{2}\/\d{2}$/.test(cardExp)) {
        showPopup('Введіть термін дії у форматі MM/YY');
        return;
      }
      if (!/^\d{3}$/.test(cardCVV)) {
        showPopup('Введіть CVV (3 цифри)');
        return;
      }
    }
  });
}

function showReviewPopup(tripIdx) {
  const popup = document.getElementById('review-popup');
  if (!popup) return;
  popup.innerHTML = '';
  let rating = 0;
  let comment = '';
  const starsDiv = document.createElement('div');
  starsDiv.className = 'review-stars';
  for (let i = 1; i <= 5; i++) {
    const star = document.createElement('span');
    star.className = 'star';
    star.innerHTML = '★';
    star.onclick = () => {
      rating = i;
      Array.from(starsDiv.children).forEach((s, idx) => s.classList.toggle('selected', idx < i));
    };
    starsDiv.appendChild(star);
  }
  const textarea = document.createElement('textarea');
  textarea.className = 'review-comment';
  textarea.placeholder = 'Залиште коментар (необов’язково)';
  textarea.oninput = e => comment = e.target.value;
  const saveBtn = document.createElement('button');
  saveBtn.className = 'review-save-btn';
  saveBtn.textContent = 'Зберегти відгук';
  saveBtn.onclick = () => {
    if (rating === 0) { alert('Оцініть поїздку!'); return; }
    const trips = JSON.parse(localStorage.getItem(LS_TRIPS)) || [];
    if (trips[tripIdx]) {
      trips[tripIdx].review = { rating, comment };
      localStorage.setItem(LS_TRIPS, JSON.stringify(trips));
      loadTrips();
    }
    popup.style.display = 'none';
    document.body.style.overflow = '';
  };
  popup.appendChild(document.createElement('h3')).textContent = 'Ваша оцінка поїздки';
  popup.appendChild(starsDiv);
  popup.appendChild(textarea);
  popup.appendChild(saveBtn);
  popup.style.display = 'flex';
  document.body.style.overflow = 'hidden';
}

function renderReviewInline(card, trip, tripIdx) {
  let rating = trip.review ? trip.review.rating : 0;
  let comment = trip.review ? trip.review.comment : '';
  const reviewDiv = document.createElement('div');
  reviewDiv.className = 'trip-review-inline';
  reviewDiv.innerHTML = `<div style='font-weight:600;margin-bottom:2px;'>Оцініть поїздку</div>`;
  const starsDiv = document.createElement('div');
  starsDiv.className = 'review-stars';
  for (let i = 1; i <= 5; i++) {
    const star = document.createElement('span');
    star.className = 'star' + (i <= rating ? ' selected' : '');
    star.innerHTML = '★';
    star.onclick = () => {
      rating = i;
      Array.from(starsDiv.children).forEach((s, idx) => s.classList.toggle('selected', idx < i));
    };
    starsDiv.appendChild(star);
  }
  const commentWrap = document.createElement('div');
  commentWrap.className = 'review-comment-wrap';
  const commentIcon = document.createElement('span');
  commentIcon.className = 'review-comment-icon';
  commentIcon.innerHTML = '<i class="fa-solid fa-comment"></i>';
  const textarea = document.createElement('textarea');
  textarea.className = 'review-comment';
  textarea.placeholder = 'Залиште коментар (необов’язково)';
  textarea.value = comment;
  textarea.oninput = e => comment = e.target.value;
  commentWrap.appendChild(commentIcon);
  commentWrap.appendChild(textarea);
  const actionsDiv = document.createElement('div');
  actionsDiv.className = 'review-actions';
  const saveBtn = document.createElement('button');
  saveBtn.className = 'review-save-btn';
  saveBtn.textContent = 'Зберегти';
  saveBtn.onclick = () => {
    if (rating === 0) { alert('Оцініть поїздку!'); return; }
    const trips = JSON.parse(localStorage.getItem(LS_TRIPS)) || [];
    if (trips[tripIdx]) {
      trips[tripIdx].review = { rating, comment };
      localStorage.setItem(LS_TRIPS, JSON.stringify(trips));
      loadTrips();
    }
  };
  const cancelBtn = document.createElement('button');
  cancelBtn.className = 'review-cancel-btn';
  cancelBtn.textContent = 'Скасувати';
  cancelBtn.onclick = () => { loadTrips(); };
  actionsDiv.appendChild(saveBtn);
  actionsDiv.appendChild(cancelBtn);
  reviewDiv.appendChild(starsDiv);
  reviewDiv.appendChild(commentWrap);
  reviewDiv.appendChild(actionsDiv);
  card.appendChild(reviewDiv);
} 