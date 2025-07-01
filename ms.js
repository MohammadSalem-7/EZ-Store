// ========== بيانات العملات ==========
const currencyRates = {
  USD: 1,
  EGP: 50.05,
  SAR: 3.75,
  CPP: 1000000
};

let currentCurrency = "USD";
let cart = JSON.parse(localStorage.getItem("cart")) || [];

// ========== عند تغيير العملة ==========
const currencySelector = document.getElementById("currencySelector");
if (currencySelector) {
  currentCurrency = currencySelector.value;
  currencySelector.addEventListener("change", () => {
    currentCurrency = currencySelector.value;
    updatePrices();
    updateCartDisplay();
  });
}

// ========== تحديث أسعار المنتجات ==========
function updatePrices() {
  const prices = document.querySelectorAll(".product-price");
  prices.forEach(priceEl => {
    const base = parseFloat(priceEl.getAttribute("data-base"));
    const converted = (base * currencyRates[currentCurrency]).toFixed(2);
    priceEl.innerText = `${converted} ${currentCurrency}`;
  });
}

// ========== إضافة منتج للسلة ==========
const addBtns = document.querySelectorAll(".add-to-cart-btn");
addBtns.forEach(btn => {
  btn.addEventListener("click", () => {
    const card = btn.closest(".product-card");
    const id = card.getAttribute("data-id");
    const title = card.querySelector(".product-title").innerText;
    const price = parseFloat(card.getAttribute("data-price"));

    const idSelector = card.querySelector(".id-selector");
    const selectedSubId = idSelector ? idSelector.value : null;

    // تحقق من وجود select وقيمة غير فارغة
    if (idSelector && !selectedSubId) {
      alert("❗ يرجى اختيار عنصر من القائمة أولاً.");
      return;
    }

    const fullTitle = selectedSubId ? `${title} - ${selectedSubId}` : title;

    const existing = cart.find(
      item => item.id === id && item.subId === selectedSubId
    );
    if (existing) {
      existing.qty += 1;
    } else {
      cart.push({ id, title: fullTitle, price, subId: selectedSubId, qty: 1 });
    }

    localStorage.setItem("cart", JSON.stringify(cart));
    alert("✅ تم إضافة المنتج للسلة!");
    updateCartDisplay();
  });
});

// ========== عرض محتويات السلة ==========
function updateCartDisplay() {
  const container = document.getElementById("cart-items");
  if (!container) return;

  container.innerHTML = "";
  let total = 0;

  cart.forEach((item, index) => {
    const convertedPrice = item.price * currencyRates[currentCurrency];
    const lineTotal = convertedPrice * item.qty;
    total += lineTotal;

    const el = document.createElement("div");
    el.className = "cart-item";
    el.innerHTML = `
      <strong>${item.title}</strong> × ${item.qty}
      ${item.subId ? `<br><small>🔹 ID المختار: ${item.subId}</small>` : ""}
      <br>💰 السعر: ${lineTotal.toFixed(2)} ${currentCurrency}
      <br><button class="danger remove-btn" data-index="${index}">❌ حذف</button>
    `;
    container.appendChild(el);
  });

  // زر الحذف الفردي
  document.querySelectorAll(".remove-btn").forEach(btn => {
    btn.addEventListener("click", () => {
      const index = parseInt(btn.getAttribute("data-index"));
      cart.splice(index, 1);
      localStorage.setItem("cart", JSON.stringify(cart));
      updateCartDisplay();
    });
  });

  const totalEl = document.getElementById("totalAmount");
  if (totalEl) {
    totalEl.innerText = `الإجمالي: ${total.toFixed(2)} ${currentCurrency}`;
  }
}

// ========== إرسال الطلب ==========
const checkoutBtn = document.getElementById("checkoutBtn");
if (checkoutBtn) {
  checkoutBtn.addEventListener("click", () => {
    const nameInput = document.getElementById("customerName");
    if (!nameInput) return alert("❗ خانة الاسم غير موجودة.");

    const name = sanitize(nameInput.value.trim());

    if (!name || cart.length === 0) {
      alert("❗ يرجى إدخال الاسم وإضافة منتجات أولاً.");
      return;
    }

    const orderId = `#${Math.floor(100000 + Math.random() * 900000)}`;

    const productLines = cart
      .map(
        item =>
          `- ${item.title}${item.subId ? ` (ID: ${item.subId})` : ""} × ${
            item.qty
          }`
      )
      .join("\n");

    let total = 0;
    cart.forEach(item => {
      total += item.price * item.qty * currencyRates[currentCurrency];
    });

    const message = `
🛒 طلب جديد من: ${name}
📦 رقم الطلب: ${orderId}

📋 تفاصيل الطلب:
${productLines}

💰 الإجمالي: ${total.toFixed(2)} ${currentCurrency}

📲 العميل: ${name}
🔔 <@1372183091841470514>
    `.trim();

    sendToWebhook(message);

    alert(
      `✅ تم إرسال الطلب بنجاح!\n📦 رقم طلبك هو: ${orderId}\n🔔 برجاء اخذ صورة لرقم الطلب\n💎 شكرًا لاستخدامك متجرنا`
    );
    localStorage.removeItem("cart");
    cart = [];
    updateCartDisplay();
  });
}

// ========== زر مسح السلة ==========
const clearCartBtn = document.getElementById("clearCartBtn");
if (clearCartBtn) {
  clearCartBtn.addEventListener("click", () => {
    if (confirm("❗ هل أنت متأكد من مسح السلة؟")) {
      localStorage.removeItem("cart");
      cart = [];
      updateCartDisplay();
      alert("🗑️ تم مسح السلة بنجاح.");
    }
  });
}

// ========== إرسال الطلب إلى Webhook ==========
function sendToWebhook(message) {
  const webhookURL =
    "https://discord.com/api/webhooks/1386456920185110599/yzw3qGzoR8j8o8cQ9lPAG6i-9skEQ7TO-JQgZZzXDbvOuW27cfPbibDrPqQI2GnOSroN";
  const payload = {
    content: message
  };

  fetch(webhookURL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify(payload)
  });
}

// ========== تأمين ضد XSS ==========
function sanitize(str) {
  return str.replace(/[<>"'`]/g, "");
}

// ========== تحميل الصفحة ==========
window.addEventListener("DOMContentLoaded", () => {
  const saved = localStorage.getItem("cart");
  if (saved) {
    cart = JSON.parse(saved);
  }

  updatePrices();
  updateCartDisplay();
});

// ========== بتعت الصور الي ف id ==========
const idSelectors = document.querySelectorAll(".id-selector");

idSelectors.forEach(select => {
  select.addEventListener("change", () => {
    const selectedOption = select.options[select.selectedIndex];
    const imgURL = selectedOption.getAttribute("data-img");
    const desc = selectedOption.getAttribute("data-desc");
    const basePrice = parseFloat(selectedOption.getAttribute("data-price"));

    const card = select.closest(".product-card");
    const img = card.querySelector(".product-img");
    const descEl = card.querySelector(".dynamic-desc");
    const priceEl = card.querySelector(".dynamic-price");

    if (imgURL) {
      img.style.opacity = 0;
      setTimeout(() => {
        img.src = imgURL;
        img.onload = () => {
          img.style.opacity = 1;
        };
      }, 300);
    }

    if (descEl && desc) {
      descEl.textContent = desc;
    }

    if (priceEl && !isNaN(basePrice)) {
      priceEl.setAttribute("data-base", basePrice);
      const convertedPrice = (
        basePrice * currencyRates[currentCurrency]
      ).toFixed(2);
      priceEl.textContent = `${convertedPrice} ${currentCurrency}`;
      card.setAttribute("data-price", basePrice);
    }
  });
});
