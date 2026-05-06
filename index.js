require("dotenv").config();

const express = require("express");
const mongoose = require("mongoose");
const Appointment = require("./models/appointment");

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.urlencoded({ extended: true }));
app.use(express.static(__dirname));

const MONGO_URI = process.env.MONGO_URI;
const ADMIN_PASSWORD = "1234";

const loginAttempts = {};
const MAX_ATTEMPTS = 3;
const LOCK_TIME = 24 * 60 * 60 * 1000;

const timeSlots = [
  "10:00", "10:30", "11:00", "11:30",
  "12:00",
  "13:00", "13:30", "14:00", "14:30", "15:00"
];

mongoose.connect(MONGO_URI, {
  serverSelectionTimeoutMS: 15000,
  connectTimeoutMS: 15000
})
.then(() => console.log(" Bağlantı Başarılı"))
.catch(err => console.log("Bağlantı Hatası:", err.message));

function renderHomePage(formData = {}, bookedTimes = []) {
  const selectedService = formData.service || "";
  const selectedDate = formData.appointmentDate || "";

  const slotOptions = timeSlots.map(time => {
    const isBooked = bookedTimes.includes(time);
    const isSelected = formData.appointmentTime === time;

    return `
      <option value="${time}" ${isBooked ? "disabled" : ""} ${isSelected ? "selected" : ""}>
        ${isBooked ? "̶" + time.split("").join("̶") + "̶  DOLU" : time}
      </option>
    `;
  }).join("");


 /* Giriş sayfası HTML */
  return `
<!DOCTYPE html>
<html lang="tr">
<head>
<meta charset="UTF-8">
<title>CYBER0 Danışmanlık A.Ş. Randevu Platformu</title>

<style>
body {
  font-family: Arial, sans-serif;
  min-height: 100vh;
  margin: 0;
  padding: 30px 0;
  display: flex;
  justify-content: center;
  align-items: center;
  position: relative;
  overflow: hidden;
}

#bgVideo {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  object-fit: cover;
  z-index: -2;
}

.video-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(2, 6, 23, 0.65);
  z-index: -1;
}
.card {
  background: rgba(15, 23, 42, 0.75);
  width: 460px;
  padding: 30px;
  border-radius: 16px;
  box-shadow: 0 0 40px rgba(0, 255, 255, 0.2);
  text-align: center;
  backdrop-filter: blur(15px);
  border: 1px solid rgba(0, 255, 255, 0.2);
}


/* başlık */
.title {
  font-size: 30px;
  font-weight: bold;
  background: linear-gradient(90deg, #00f5ff, #2563eb);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  letter-spacing: 1px;
  margin-bottom: 4px;
}

.subtitle {
  font-size: 18px;
  color: #64748b;
  margin-top: 0;
  margin-bottom: 20px;
}

input, select {
  width: 90%;
  padding: 12px;
  margin: 10px 0;
  border: 1px solid #ccc;
  border-radius: 8px;
}

button, .btn {
  padding: 12px 22px;
  background: #2563eb;
  color: white;
  border: none;
  border-radius: 8px;
  font-weight: bold;
  cursor: pointer;
  text-decoration: none;
  display: inline-block;
  margin-top: 10px;
}

button:hover, .btn:hover {
  background: #082574;
}

.secondary {
  background: #0f172a;
}

.danger {
  background: #5b0707;
}

.actions {
  margin-top: 22px;
  padding-top: 18px;
  border-top: 1px solid #ddd;
}

.date-wrapper {
  position: relative;
  width: 90%;
  margin: 10px auto;
}

.date-wrapper input {
  width: 100%;
  box-sizing: border-box;
  padding-right: 42px;
}

.date-wrapper span {
  position: absolute;
  right: 12px;
  top: 20px;
  cursor: pointer;
}

.small-info {
  color: #475569;
  font-size: 13px;
}
</style>
</head>

<body>

<body>

<video autoplay muted loop playsinline id="bgVideo">
  <source src="/bg.mp4" type="video/mp4">
</video>
<div class="video-overlay"></div>

<div class="card">

  <h1 class="title">CYBER0 Danışmanlık A.Ş.</h1>
  <h2 class="subtitle">Randevu Platformu</h2>

  <form action="/add" method="POST">

    <input type="text" name="fullName" value="${formData.fullName || ""}" placeholder="Ad Soyad" required>

    <input 
      type="text" 
      name="identityNumber" 
      value="${formData.identityNumber || ""}"
      placeholder="Kimlik Numarası" 
      minlength="11" 
      maxlength="11" 
      pattern="[0-9]{11}" 
      required
    >

    <select name="service" id="serviceSelect" required>
      <option value="">Hizmet Seçin</option>
      <option value="Danışmanlık" ${selectedService === "Danışmanlık" ? "selected" : ""}>Danışmanlık</option>
      <option value="Teknik Destek" ${selectedService === "Teknik Destek" ? "selected" : ""}>Teknik Destek</option>
      <option value="Eğitim Görüşmesi" ${selectedService === "Eğitim Görüşmesi" ? "selected" : ""}>Eğitim Görüşmesi</option>
      <option value="Proje Görüşmesi" ${selectedService === "Proje Görüşmesi" ? "selected" : ""}>Proje Görüşmesi</option>
    </select>

    <div class="date-wrapper">
      <input id="appointmentDateForm" type="date" name="appointmentDate" value="${selectedDate}" required>
      <span onclick="openAppointmentCalendar()">📅</span>
    </div>

    <select name="appointmentTime" id="timeSelect" required>
      <option value="">Saat Seçin</option>
      ${slotOptions}
    </select>

    <button type="submit">Randevu Kaydet</button>
  </form>

  <div class="actions">
    <a class="btn secondary" href="/search-page">🔎 Randevu Ara</a>
    <a class="btn danger" href="/delete-page">🗑 Randevu Sil</a>
    <a class="btn" href="/admin-login"> Yönetici Paneli</a>
  </div>

</div>

<script>
function openAppointmentCalendar() {
  const input = document.getElementById("appointmentDateForm");
  if (input.showPicker) {
    input.showPicker();
  } else {
    input.focus();
  }
}

async function updateAvailableTimes() {
  const service = document.getElementById("serviceSelect").value;
  const appointmentDate = document.getElementById("appointmentDateForm").value;

  if (!service || !appointmentDate) return;

  const params = new URLSearchParams({
    service,
    appointmentDate
  });

  const response = await fetch("/available-times?" + params.toString());
  const data = await response.json();

  const timeSelect = document.getElementById("timeSelect");
  timeSelect.innerHTML = '<option value="">Saat Seçin</option>';

  data.slots.forEach(slot => {
    const option = document.createElement("option");
    option.value = slot.time;

    if (slot.booked) {
      option.disabled = true;
      option.textContent = slot.time + " - DOLU";
      option.style.textDecoration = "line-through";
      option.style.color = "gray";
    } else {
      option.textContent = slot.time;
    }

    timeSelect.appendChild(option);
  });
}

document.getElementById("serviceSelect").addEventListener("change", updateAvailableTimes);
document.getElementById("appointmentDateForm").addEventListener("change", updateAvailableTimes);
</script>

</body>
</html>
  `;
}



app.get("/", (req, res) => {
  res.send(renderHomePage());
});

app.get("/available-times", async (req, res) => {
  try {
    const { service, appointmentDate } = req.query;

    const appointments = await Appointment.find({
      service,
      appointmentDate
    });

    const bookedTimes = appointments.map(item => item.appointmentTime);

    const slots = timeSlots.map(time => ({
      time,
      booked: bookedTimes.includes(time)
    }));

    res.json({ slots });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post("/add", async (req, res) => {
  try {
    const { fullName, identityNumber, service, appointmentDate, appointmentTime } = req.body;

    const bookedAppointments = await Appointment.find({
      service,
      appointmentDate
    });

    const bookedTimes = bookedAppointments.map(item => item.appointmentTime);

    const existingSameServiceTime = await Appointment.findOne({
      service,
      appointmentDate,
      appointmentTime
    });

    if (existingSameServiceTime) {
      return res.send(renderHomePage(req.body, bookedTimes));
    }

    const identityExisting = await Appointment.findOne({
      identityNumber
    });

    if (identityExisting) {
      return res.send(`
        <h2 style="font-family:Arial; color:red; text-align:center; margin-top:50px;">
           Bu kimlik numarasıyla zaten bir randevu var
        </h2>
        <p style="font-family:Arial; text-align:center;">
          Randevunuzu arama bölümünden kontrol edebilirsiniz.
        </p>
        <div style="text-align:center;">
          <a href="/">Ana Sayfaya Dön</a>
        </div>
      `);
    }

    const appointment = new Appointment({
      fullName,
      identityNumber,
      service,
      appointmentDate,
      appointmentTime
    });

    await appointment.save();
    res.redirect("/success");

  } catch (err) {
    res.status(500).send("Randevu kaydedilirken hata oluştu: " + err.message);
  }
});



app.get("/search-page", (req, res) => {
  res.send(`
<!DOCTYPE html>
<html lang="tr">
<head>
<meta charset="UTF-8">
<title>Randevu Ara</title>
<style>
body {
  font-family: Arial, sans-serif;
  min-height: 100vh;
  margin: 0;
  padding: 30px 0;
  display: flex;
  justify-content: center;
  align-items: center;
  position: relative;
  overflow: hidden;
}

#bgVideo {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  object-fit: cover;
  z-index: -2;
}

.video-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(2, 6, 23, 0.65);
  z-index: -1;
}

.card {
  width: 520px;
  min-height: 330px;
  padding: 45px 50px;
  background: rgba(15, 23, 42, 0.82);
  color: white;
  border: 1px solid rgba(0, 255, 255, 0.25);
  box-shadow: 0 0 55px rgba(0, 255, 255, 0.22);
  backdrop-filter: blur(15px);
  border-radius: 22px;
  text-align: center;
}

h2 {
  font-size: 32px;
  margin-bottom: 35px;
}

input {
  width: 100%;
  box-sizing: border-box;
  padding: 17px;
  margin: 10px 0 25px;
  border: 1px solid rgba(255,255,255,0.25);
  border-radius: 12px;
  font-size: 17px;
}

button, a {
  width: 260px;
  box-sizing: border-box;
  display: block;
  padding: 15px 22px;
  margin: 16px auto 0;
  background: #06205a;
  color: white;
  border: none;
  border-radius: 12px;
  text-decoration: none;
  font-weight: bold;
  font-size: 17px;
  cursor: pointer;
}

button:hover, a:hover {
  background: #123b91;
}
</style>
</head>

<body>

<video autoplay muted loop playsinline id="bgVideo">
  <source src="/bg.mp4" type="video/mp4">
</video>
<div class="video-overlay"></div>

<div class="card">
  <h2>🔎 Randevu Ara</h2>
  <form action="/search-appointment" method="POST">
    <input type="text" name="identityNumber" placeholder="Kimlik numarası" minlength="11" maxlength="11" pattern="[0-9]{11}" required>
    <button type="submit">Randevumu Ara</button>
  </form>
  <a href="/">Ana Sayfa</a>
</div>

</body>
</html>
  `);
});

app.post("/search-appointment", async (req, res) => {
  try {
    const identityNumber = req.body.identityNumber;
    const appointment = await Appointment.findOne({ identityNumber });

    if (!appointment) {
      return res.send(`
        <h2 style="font-family:Arial; color:red; text-align:center; margin-top:50px;">
          ❌ Randevu bulunamadı
        </h2>
        <div style="text-align:center;">
          <a href="/search-page">Tekrar Ara</a>
        </div>
      `);
    }

    res.send(`
<!DOCTYPE html>
<html lang="tr">
<head>
<meta charset="UTF-8">
<title>Randevu Bilgisi</title>

<style>
body{
  font-family: Arial, sans-serif;
  min-height:100vh;
  margin:0;
  display:flex;
  justify-content:center;
  align-items:center;
  position:relative;
  overflow:hidden;
}

/* VIDEO ARKAPLAN */
#bgVideo{
  position:fixed;
  top:0;
  left:0;
  width:100%;
  height:100%;
  object-fit:cover;
  z-index:-2;
}

.video-overlay{
  position:fixed;
  top:0;
  left:0;
  width:100%;
  height:100%;
  background:rgba(2,6,23,0.65);
  z-index:-1;
}

/* KART */
.container{
  width:520px;
  background: rgba(15, 23, 42, 0.78);
  color:white;
  border:1px solid rgba(0,255,255,0.2);
  box-shadow:0 0 50px rgba(0,255,255,0.18);
  backdrop-filter: blur(15px);
  border-radius:20px;
  overflow:hidden;
}

/* BAŞLIK */
.header{
  padding:28px;
  text-align:center;
  font-size:22px;
  font-weight:bold;
  color:#3b82f6;
}

/* TABLO */
table{
  width:100%;
  border-collapse:collapse;
}

td{
  padding:18px;
  border:1px solid rgba(255,255,255,0.15);
  font-size:18px;
}

.label{
  background:#2563eb;
  font-weight:bold;
  width:45%;
}

.value{
  background:rgba(255,255,255,0.08);
}

/* BUTON */
.actions{
  padding:25px;
}

.btn{
  display:inline-block;
  background:#2563eb;
  color:white;
  text-decoration:none;
  padding:14px 22px;
  border-radius:10px;
  font-weight:bold;
  transition:0.3s;
}

.btn:hover{
  background:#1d4ed8;
}
</style>
</head>

<body>

<video autoplay muted loop playsinline id="bgVideo">
  <source src="/bg.mp4" type="video/mp4">
</video>

<div class="video-overlay"></div>

<div class="container">

  <div class="header">
    🔎 Randevu Bilgisi
  </div>

  <table>
    <tr>
      <td class="label">Ad Soyad</td>
      <td class="value">${appointment.fullName}</td>
    </tr>

    <tr>
      <td class="label">Kimlik Numarası</td>
      <td class="value">${appointment.identityNumber}</td>
    </tr>

    <tr>
      <td class="label">Hizmet</td>
      <td class="value">${appointment.service}</td>
    </tr>

    <tr>
      <td class="label">Tarih</td>
      <td class="value">${appointment.appointmentDate}</td>
    </tr>

    <tr>
      <td class="label">Saat</td>
      <td class="value">${appointment.appointmentTime}</td>
    </tr>

    <tr>
      <td class="label">Durum</td>
      <td class="value">${appointment.status}</td>
    </tr>
  </table>

  <div class="actions">
    <a class="btn" href="/">Ana Sayfaya Dön</a>
  </div>

</div>

</body>
</html>
    `);
  } catch (err) {
    res.status(500).send("Randevu aranırken hata oluştu: " + err.message);
  }
});
app.get("/delete-page", (req, res) => {
  res.send(`
<!DOCTYPE html>
<html lang="tr">
<head>
<meta charset="UTF-8">
<title>Randevu Sil</title>
<style>
body {
  font-family: Arial, sans-serif;
  min-height: 100vh;
  margin: 0;
  padding: 30px 0;
  display: flex;
  justify-content: center;
  align-items: center;
  position: relative;
  overflow: hidden;
}

#bgVideo {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  object-fit: cover;
  z-index: -2;
}

.video-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(2, 6, 23, 0.65);
  z-index: -1;
}

.card {
  width: 520px;
  padding: 45px 50px;
  border-radius: 22px;
  background: rgba(15, 23, 42, 0.82);
  color: white;
  border: 1px solid rgba(0, 255, 255, 0.25);
  box-shadow: 0 0 55px rgba(0, 255, 255, 0.22);
  backdrop-filter: blur(15px);
  text-align: center;
}

h2 {
  font-size: 32px;
  margin-bottom: 18px;
}

p {
  font-size: 18px;
  color: #cbd5e1;
}

input {
  width: 100%;
  box-sizing: border-box;
  padding: 17px;
  margin: 20px 0;
  border-radius: 12px;
  font-size: 17px;
}

button, a {
  width: 260px;
  box-sizing: border-box;
  display: block;
  padding: 15px 22px;
  margin: 16px auto 0;
  color: white;
  border: none;
  border-radius: 12px;
  text-decoration: none;
  font-weight: bold;
  font-size: 17px;
}

button {
  background: #dc2626;
}

a {
  background: #06205a;
}
</style>
</head>

<body>

<video autoplay muted loop playsinline id="bgVideo">
  <source src="/bg.mp4" type="video/mp4">
</video>
<div class="video-overlay"></div>

<div class="card">
  <h2>🗑 Randevu Sil</h2>
  <p>Randevunuzu silmek için kimlik numaranızı girin.</p>

  <form action="/delete-by-identity" method="POST">
    <input type="text" name="identityNumber" placeholder="Kimlik numarası" minlength="11" maxlength="11" pattern="[0-9]{11}" required>
    <button type="submit">Randevumu Sil</button>
  </form>

  <a href="/">Ana Sayfa</a>
</div>

</body>
</html>
  `);
});

app.post("/delete-by-identity", async (req, res) => {
  try {
    const identityNumber = req.body.identityNumber;

    const deletedAppointment = await Appointment.findOneAndDelete({ identityNumber });

    if (!deletedAppointment) {
      return res.send(`
        <h2 style="font-family:Arial; color:red; text-align:center; margin-top:50px;">
          ❌ Silinecek randevu bulunamadı
        </h2>
        <div style="text-align:center;">
          <a href="/delete-page">Tekrar Dene</a>
        </div>
      `);
    }

    res.send(`
      <h2 style="font-family:Arial; color:green; text-align:center; margin-top:50px;">
        ✅ Randevu başarıyla silindi
      </h2>
      <p style="font-family:Arial; text-align:center;">
        ${deletedAppointment.fullName} adına kayıtlı randevu silindi.
      </p>
      <div style="text-align:center;">
        <a href="/">Ana Sayfaya Dön</a>
      </div>
    `);
  } catch (err) {
    res.status(500).send("Randevu silinirken hata oluştu: " + err.message);
  }
});

app.get("/success", (req, res) => {
  res.send(`
<!DOCTYPE html>
<html lang="tr">
<head>
<meta charset="UTF-8">
<title>Randevu Başarılı</title>
<style>
body {
  font-family: Arial, sans-serif;
  min-height: 100vh;
  margin: 0;
  padding: 30px 0;
  display: flex;
  justify-content: center;
  align-items: center;
  position: relative;
  overflow: hidden;
}

#bgVideo {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  object-fit: cover;
  z-index: -2;
}

.video-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(2, 6, 23, 0.65);
  z-index: -1;
}

.card {
  width: 560px;
  padding: 45px 50px;
  border-radius: 22px;
  background: rgba(15, 23, 42, 0.82);
  color: white;
  border: 1px solid rgba(0, 255, 255, 0.25);
  box-shadow: 0 0 55px rgba(0, 255, 255, 0.22);
  backdrop-filter: blur(15px);
  text-align: center;
}

h2 {
  color: #22c55e;
  font-size: 34px;
  margin-bottom: 20px;
}

p {
  font-size: 20px;
  color: #e2e8f0;
}

a {
  display: inline-block;
  margin-top: 20px;
  background: #2563eb;
  color: white;
  padding: 15px 24px;
  border-radius: 12px;
  text-decoration: none;
  font-weight: bold;
  font-size: 17px;
}
</style>
</head>

<body>

<video autoplay muted loop playsinline id="bgVideo">
  <source src="/bg.mp4" type="video/mp4">
</video>
<div class="video-overlay"></div>

<div class="card">
  <h2>✅ Randevu Başarıyla Oluşturuldu</h2>
  <p>Randevunuz sisteme kaydedildi.</p>
  <a href="/">Yeni Randevu Oluştur</a>
</div>

</body>
</html>
  `);
});

app.get("/admin-login", (req, res) => {
  res.send(`
<!DOCTYPE html>
<html lang="tr">
<head>
<meta charset="UTF-8">
<title>Admin Giriş</title>

<style>
body {
  font-family: Arial, sans-serif;
  min-height: 100vh;
  margin: 0;
  display: flex;
  justify-content: center;
  align-items: center;
  position: relative;
  overflow: hidden;
}

/* VIDEO */
#bgVideo {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  object-fit: cover;
  z-index: -2;
}

.video-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(2, 6, 23, 0.65);
  z-index: -1;
}

/* CARD */
.card {
  background: rgba(15, 23, 42, 0.85);
  color: white;
  width: 420px;
  padding: 35px;
  border-radius: 18px;
  box-shadow: 0 0 50px rgba(0,255,255,0.2);
  backdrop-filter: blur(15px);
  text-align: center;
  border: 1px solid rgba(0,255,255,0.25);
}

h2 {
  margin-bottom: 10px;
}

p {
  color: #94a3b8;
}

input {
  width: 100%;
  padding: 14px;
  margin: 18px 0;
  border-radius: 10px;
  border: 1px solid rgba(255,255,255,0.2);
  font-size: 16px;
}

/* BUTTON */
button {
  width: 100%;
  padding: 14px;
  background: #2563eb;
  color: white;
  border: none;
  border-radius: 10px;
  font-weight: bold;
  cursor: pointer;
}

button:hover {
  background: #1e40af;
}

a {
  display: block;
  margin-top: 15px;
  color: #38bdf8;
  text-decoration: none;
}
</style>
</head>

<body>

<video autoplay muted loop playsinline id="bgVideo">
  <source src="/bg.mp4" type="video/mp4">
</video>
<div class="video-overlay"></div>

<div class="card">
  <h2>🔐 Admin Giriş</h2>
  <p>Admin paneline erişmek için şifre girin.</p>

  <form action="/admin-login" method="POST">
    <input type="password" name="password" placeholder="Admin şifresi" required>
    <button type="submit">Giriş Yap</button>
  </form>

  <a href="/">Ana Sayfaya Dön</a>
</div>

</body>
</html>

  `);
});

app.post("/admin-login", (req, res) => {
  const password = req.body.password;
  const userIp = req.ip;

  if (!loginAttempts[userIp]) {
    loginAttempts[userIp] = { attempts: 0, lockedUntil: null };
  }

  const userAttempt = loginAttempts[userIp];

  if (userAttempt.lockedUntil && Date.now() < userAttempt.lockedUntil) {
    const remainingMs = userAttempt.lockedUntil - Date.now();
    const remainingHours = Math.ceil(remainingMs / (1000 * 60 * 60));

    return res.send(`
      <h2 style="font-family:Arial; color:red; text-align:center; margin-top:50px;">🔒 Admin paneli kilitlendi</h2>
      <p style="font-family:Arial; text-align:center;">Yaklaşık ${remainingHours} saat sonra tekrar deneyebilirsiniz.</p>
      <div style="text-align:center;"><a href="/">Ana Sayfaya Dön</a></div>
    `);
  }

  if (password === ADMIN_PASSWORD) {
    loginAttempts[userIp] = { attempts: 0, lockedUntil: null };
    return res.redirect("/dashboard");
  }

  userAttempt.attempts++;

  if (userAttempt.attempts >= MAX_ATTEMPTS) {
    userAttempt.lockedUntil = Date.now() + LOCK_TIME;

    return res.send(`
      <h2 style="font-family:Arial; color:red; text-align:center; margin-top:50px;">🔒 Admin paneli 24 saatliğine kilitlendi</h2>
      <p style="font-family:Arial; text-align:center;">3 kez hatalı şifre girdiniz.</p>
      <div style="text-align:center;"><a href="/">Ana Sayfaya Dön</a></div>
    `);
  }

  const remainingAttempts = MAX_ATTEMPTS - userAttempt.attempts;

  res.send(`
    <h2 style="font-family:Arial; color:red; text-align:center; margin-top:50px;">❌ Hatalı şifre</h2>
    <p style="font-family:Arial; text-align:center;">Kalan deneme hakkınız: ${remainingAttempts}</p>
    <div style="text-align:center;"><a href="/admin-login">Tekrar dene</a></div>
  `);
});

app.get("/dashboard", async (req, res) => {
  try {
    const appointments = await Appointment.find().sort({ createdAt: -1 });

    const rows = appointments.map(item => `
      <tr>
        <td>${item.fullName}</td>
        <td>${item.identityNumber || "-"}</td>
        <td>${item.service}</td>
        <td>${item.appointmentDate}</td>
        <td>${item.appointmentTime}</td>
        <td><span class="badge">${item.status}</span></td>
        <td>
          <a class="approve" href="/status/${item._id}/Onaylandı">Onayla</a>
          <a class="cancel" href="/status/${item._id}/İptal">İptal</a>
          <a class="delete" href="/delete/${item._id}">Sil</a>
        </td>
      </tr>
    `).join("");

    res.send(`
<!DOCTYPE html>
<html lang="tr">
<head>
<meta charset="UTF-8">
<title>Admin Paneli</title>

<style>
body {
  font-family: Arial, sans-serif;
  min-height: 100vh;
  margin: 0;
  padding: 40px;
  position: relative;
  overflow: hidden;
}

/* VIDEO */
#bgVideo {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  object-fit: cover;
  z-index: -2;
}

.video-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(2, 6, 23, 0.7);
  z-index: -1;
}

/* PANEL */
.container {
  max-width: 1100px;
  margin: auto;
  background: rgba(15, 23, 42, 0.85);
  padding: 30px;
  border-radius: 18px;
  box-shadow: 0 0 40px rgba(0,255,255,0.2);
  backdrop-filter: blur(15px);
  color: white;
}

h2 {
  text-align: center;
  margin-bottom: 20px;
  color: #38bdf8;
}

/* TABLE */
table {
  width: 100%;
  border-collapse: collapse;
}

th, td {
  border: 1px solid rgba(255,255,255,0.2);
  padding: 12px;
  text-align: center;
}

th {
  background: #2563eb;
  color: white;
}

td {
  background: rgba(255,255,255,0.05);
}

.badge {
  background: rgba(56,189,248,0.2);
  color: #38bdf8;
  padding: 6px 10px;
  border-radius: 20px;
}

/* ACTIONS */
a {
  text-decoration: none;
  margin: 3px;
  font-weight: bold;
}

.approve { color: #22c55e; }
.cancel { color: orange; }
.delete { color: red; }

.btn {
  display: inline-block;
  margin-top: 20px;
  background: #2563eb;
  color: white;
  padding: 10px 16px;
  border-radius: 8px;
}
</style>
</head>

<body>

<video autoplay muted loop playsinline id="bgVideo">
  <source src="/bg.mp4" type="video/mp4">
</video>
<div class="video-overlay"></div>

<div class="container">
  <h2>📊 Randevu Yönetim Paneli</h2>

  <table>
    <tr>
      <th>Ad Soyad</th>
      <th>Kimlik No</th>
      <th>Hizmet</th>
      <th>Tarih</th>
      <th>Saat</th>
      <th>Durum</th>
      <th>İşlem</th>
    </tr>
    ${rows || `<tr><td colspan="7">Henüz randevu yok.</td></tr>`}
  </table>

  <a class="btn" href="/">+ Yeni Randevu</a>
</div>

</body>
</html>

    `);
  } catch (err) {
    res.status(500).send("Dashboard yüklenirken hata oluştu: " + err.message);
  }
});

app.get("/status/:id/:status", async (req, res) => {
  try {
    await Appointment.findByIdAndUpdate(req.params.id, {
      status: req.params.status
    });

    res.redirect("/dashboard");
  } catch (err) {
    res.status(500).send("Durum güncellenirken hata oluştu: " + err.message);
  }
});

app.get("/delete/:id", async (req, res) => {
  try {
    await Appointment.findByIdAndDelete(req.params.id);
    res.redirect("/dashboard");
  } catch (err) {
    res.status(500).send("Randevu silinirken hata oluştu: " + err.message);
  }
});

app.listen(PORT, () => {
  console.log(`Sunucu hazır: http://localhost:${PORT}`);
});