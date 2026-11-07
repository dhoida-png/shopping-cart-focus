const goodsList = [
  { id: 1, title: "Миша дротова", cost: 350 },
  { id: 2, title: "Миша бездротова", cost: 650 },
  { id: 3, title: "Навушники", cost: 1200 },
  { id: 4, title: "Клавіатура", cost: 950 },
  { id: 5, title: "Окуляри для ПК", cost: 500 },
]

function getCart() {
  try {
    return JSON.parse(localStorage.getItem("cart")) || []
  } catch (error) {
    console.error("Помилка зчитування з localStorage:", error)
    return []
  }
}

function saveCart(cartData) {
  try {
    localStorage.setItem("cart", JSON.stringify(cartData))
  } catch (error) {
    console.error("Помилка запису у localStorage:", error)
  }
}

function updateCartBadge() {
  const badge = document.querySelector("#cartBadge")
  if (!badge) return
  const totalCount = getCart().reduce((sum, item) => sum + item.qty, 0)
  badge.textContent = totalCount
}

function initCatalogPage() {
  const catalogBody = document.querySelector("#catalogBody")
  const productSelector = document.querySelector("#productSelect")
  const qtyInput = document.querySelector("#productQty")
  const addToCartBtn = document.querySelector("#addToCartBtn")
  const notification = document.querySelector("#catalogNotification")

  if (!catalogBody || !productSelector || !addToCartBtn) return

  let tableRows = ""
  let selectOptions = `<option value="" disabled selected>Оберіть позицію...</option>`

  goodsList.forEach(item => {
    tableRows += `
      <tr>
        <td>${item.id}</td>
        <td>${item.title}</td>
        <td>${item.cost} грн</td>
      </tr>
    `
    selectOptions += `<option value="${item.id}">${item.title} (${item.cost} грн)</option>`
  })

  catalogBody.innerHTML = tableRows
  productSelector.innerHTML = selectOptions
  updateCartBadge()

  addToCartBtn.addEventListener("click", () => {
    const selectedId = Number(productSelector.value)
    const qty = Number(qtyInput.value)

    if (!selectedId || isNaN(qty) || qty < 1 || !Number.isInteger(qty)) {
      if (notification) {
        notification.style.color = "#ef4444"
        notification.textContent = !selectedId
          ? "Будь ласка, оберіть товар зі списку!"
          : "Кількість повинна бути цілим додатним числом від 1!"
      }
      return
    }

    const activeProduct = goodsList.find(item => item.id === selectedId)
    const cart = getCart()
    const existing = cart.find(item => item.id === selectedId)

    if (existing) {
      existing.qty += qty
    } else {
      cart.push({
        id: activeProduct.id,
        title: activeProduct.title,
        cost: activeProduct.cost,
        qty,
      })
    }

    saveCart(cart)
    updateCartBadge()

    if (notification) {
      notification.style.color = "#059669"
      notification.textContent = `Додано: ${activeProduct.title} (${qty} шт.)`
      qtyInput.value = "1"
      setTimeout(() => (notification.textContent = ""), 2500)
    }
  })
}

const informalNamesPattern =
  /^[А-ЩЬЮЯЇІЄҐA-Z][а-щьюяїієґa-z]*(?:ша|ик|чик|очка|енька|уня|уся|ася|аня|ня)$/iu

const russianPatterns =
  /^(?:Никита|Николай|Александр|Александра|Андрей|Алексей|Сергей|Михаил|Владимир|Евгений|Дмитрий|Артем|Даниил|Кирилл|Глеб|Илья|Павел|Антон|Филипп|Тимофей|Матвей|Наташа|Маша|Даша|Саша|Паша|Миша|Коля|Дима|Женя|Слава)$|.*(?:[вдст]ей|аксандр|етр)$/i

const allowedShortNames = new Set([
  "Іван",
  "Олег",
  "Юрій",
  "Гліб",
  "Яків",
  "Ілля",
  "Марк",
  "Анна",
  "Яна",
  "Юлія",
  "Віра",
  "Алла",
  "Інна",
  "Ніна",
  "Лідія",
  "David",
  "John",
  "Alex",
  "Mark",
  "Mary",
])

function isValidRealName(name) {
  if (/[ыэъёЫЭЪЁ]/i.test(name)) return false

  if (
    !/^(?:[А-ЩЬЮЯЇІЄҐ][а-щьюяїієґ'-]{2,19}|[A-Z][a-z'-]{2,19})$/u.test(name)
  ) {
    return false
  }

  if (/(.)\1\1/i.test(name) || /^(.{2,})\1$/iu.test(name)) {
    return false
  }

  if (informalNamesPattern.test(name) || russianPatterns.test(name)) {
    return false
  }

  if (/^(?:Олен|Марин|Катер|Тетян|Оксан|Світлан|Натал)$/i.test(name)) {
    return false
  }

  if (name.length <= 4 && !allowedShortNames.has(name)) {
    return false
  }

  if (
    !/[аеєиіїоуюяaeiouy]/i.test(name) ||
    /[^аеєиіїоуюяaeiouy'-]{4,}/i.test(name)
  ) {
    return false
  }

  return true
}

function initCartPage() {
  const cartSummary = document.querySelector("#cartSummary")
  const clearCartBtn = document.querySelector("#clearCartBtn")
  const nameInput = document.querySelector("#customerName")
  const deliveryCheck = document.querySelector("#needsShipping")
  const paymentSelect = document.querySelector("#paymentType")
  const calculateBtn = document.querySelector("#calculate")
  const resetBtn = document.querySelector("#resetBtn")
  const errorBox = document.querySelector("#error")
  const resultBox = document.querySelector("#result")

  if (!cartSummary || !calculateBtn || !nameInput) return

  function toggleOrderFormLock(isLocked) {
    if (deliveryCheck) deliveryCheck.disabled = isLocked
    if (paymentSelect) paymentSelect.disabled = isLocked
    if (calculateBtn) calculateBtn.disabled = isLocked
    document.querySelectorAll('input[name="clientStatus"]').forEach(radio => {
      radio.disabled = isLocked
    })

    if (isLocked && resultBox) {
      resultBox.classList.remove("success")
      resultBox.innerHTML = ""
    }
  }

  function validateCustomerName() {
    const name = nameInput.value.trim()

    if (!name) {
      errorBox.textContent = "Поле імені обов'язкове до заповнення!"
      nameInput.classList.add("invalid")
      toggleOrderFormLock(true)
      return false
    }

    if (/\s/.test(name)) {
      errorBox.textContent = "Введіть лише одне ім'я без пробілів!"
      nameInput.classList.add("invalid")
      toggleOrderFormLock(true)
      return false
    }

    if (!isValidRealName(name)) {
      errorBox.textContent =
        "Введіть коректне ім'я українською мовою з великої літери (наприклад: Андрій, Тетяна)!"
      nameInput.classList.add("invalid")
      toggleOrderFormLock(true)
      return false
    }

    errorBox.textContent = ""
    nameInput.classList.remove("invalid")
    toggleOrderFormLock(false)
    return true
  }

  function renderCartItems() {
    const cart = getCart()
    if (cart.length === 0) {
      cartSummary.innerHTML = `<p class="empty-cart-msg">Кошик порожній. Перейдіть на головну сторінку для вибору товарів.</p>`
      if (resultBox) {
        resultBox.classList.remove("success")
        resultBox.innerHTML = ""
      }
      return
    }

    let html = ""
    cart.forEach((item, index) => {
      html += `
        <div class="cart-summary-item">
          <div class="cart-item-info">
            <span class="cart-item-name"><strong>${item.title}</strong></span>
            <span class="cart-item-price">${item.cost} грн/шт</span>
          </div>
          <div class="cart-qty-controls">
            <button type="button" class="qty-btn qty-decrease" data-index="${index}" title="Зменшити на 1">−</button>
            <span class="cart-item-qty-value">${item.qty} шт.</span>
            <button type="button" class="qty-btn qty-increase" data-index="${index}" title="Збільшити на 1">+</button>
          </div>
          <div class="cart-item-total-col">
            <span class="cart-item-sum">${item.cost * item.qty} грн</span>
            <button type="button" class="cart-item-del-btn" data-index="${index}" title="Видалити позицію">✕</button>
          </div>
        </div>
      `
    })
    cartSummary.innerHTML = html

    const attachCartEvents = (selector, action) => {
      document.querySelectorAll(selector).forEach(btn => {
        btn.addEventListener("click", e => {
          const idx = Number(e.currentTarget.getAttribute("data-index"))
          const currentCart = getCart()
          action(currentCart, idx)
          saveCart(currentCart)
          renderCartItems()
          if (resultBox && resultBox.classList.contains("success")) {
            calculateBtn.click()
          }
        })
      })
    }

    attachCartEvents(".qty-decrease", (cart, idx) => {
      if (cart[idx].qty > 1) cart[idx].qty -= 1
      else cart.splice(idx, 1)
    })

    attachCartEvents(".qty-increase", (cart, idx) => {
      cart[idx].qty += 1
    })

    attachCartEvents(".cart-item-del-btn", (cart, idx) => {
      cart.splice(idx, 1)
    })
  }

  if (clearCartBtn) {
    clearCartBtn.addEventListener("click", () => {
      localStorage.removeItem("cart")
      renderCartItems()
    })
  }

  nameInput.addEventListener("input", () => {
    if (validateCustomerName()) {
      localStorage.setItem("savedCustomerName", nameInput.value.trim())
    }
  })

  nameInput.addEventListener("blur", validateCustomerName)

  const savedName = localStorage.getItem("savedCustomerName")
  if (savedName) nameInput.value = savedName

  if (deliveryCheck) {
    deliveryCheck.addEventListener("change", () => {
      const baseSum = getCart().reduce(
        (acc, item) => acc + item.cost * item.qty,
        0,
      )
      if (deliveryCheck.checked && baseSum < 1500) {
        errorBox.textContent = `Увага: сума товарів (${baseSum} грн) менша за 1500 грн. Кур'єрська доставка можлива лише від 1500 грн!`
      } else {
        errorBox.textContent = ""
      }
    })
  }

  function evalDiscount(sum, isRegularClient) {
    if (!isRegularClient) return 0
    return sum >= 2000 ? 15 : 5
  }

  calculateBtn.addEventListener("click", () => {
    const cart = getCart()
    if (cart.length === 0) {
      errorBox.textContent =
        "Кошик порожній! Оберіть товари на головній сторінці."
      return
    }

    if (!validateCustomerName()) {
      nameInput.focus()
      return
    }

    const selectedStatus = document.querySelector(
      'input[name="clientStatus"]:checked',
    )
    const statusGroup = document.querySelector("#statusGroup")
    if (!selectedStatus) {
      errorBox.textContent = "Оберіть, чи купували ви у нас раніше!"
      if (statusGroup) statusGroup.classList.add("invalid-group")
      return
    }
    if (statusGroup) statusGroup.classList.remove("invalid-group")

    const isRegular = selectedStatus.value === "regular"
    const needsShipping = deliveryCheck ? deliveryCheck.checked : false
    const paymentMethod = paymentSelect
      ? paymentSelect.options[paymentSelect.selectedIndex].text
      : "Готівка"

    const baseSum = cart.reduce((acc, item) => acc + item.cost * item.qty, 0)
    const discountPercent = evalDiscount(baseSum, isRegular)
    const discountMoney = (baseSum * discountPercent) / 100
    const sumAfterDiscount = baseSum - discountMoney

    const MIN_FREE_SHIPPING_LIMIT = 1500
    if (needsShipping && sumAfterDiscount < MIN_FREE_SHIPPING_LIMIT) {
      const diff = MIN_FREE_SHIPPING_LIMIT - sumAfterDiscount
      errorBox.textContent = `Загальна вартість замовлення (${sumAfterDiscount} грн) менша за 1500 грн! Додайте товарів ще на ${diff} грн або зніміть відмітку доставки.`
      if (resultBox) {
        resultBox.classList.remove("success")
        resultBox.innerHTML = ""
      }
      return
    }

    errorBox.textContent = ""

    if (resultBox) {
      resultBox.innerHTML = `
        <div class="receipt-header">Чек замовлення</div>
        <div class="receipt-item"><span>Клієнт:</span> <strong>${nameInput.value.trim()}</strong></div>
        <div class="receipt-item"><span>Позицій:</span> <span>${cart.reduce((a, b) => a + b.qty, 0)} шт.</span></div>
        <div class="receipt-item"><span>Вартість:</span> <span>${baseSum} грн</span></div>
        <div class="receipt-item"><span>Знижка:</span> <span>${discountPercent}% (-${discountMoney} грн)</span></div>
        <div class="receipt-item"><span>Доставка:</span> <span>${needsShipping ? "Безкоштовна кур'єром" : "Самовивіз"}</span></div>
        <div class="receipt-item"><span>Оплата:</span> <span>${paymentMethod}</span></div>
        <div class="receipt-item receipt-total"><span>До сплати:</span> <span>${sumAfterDiscount} грн</span></div>
      `
      resultBox.classList.add("success")
    }
  })

  // Кнопка очищення форми розрахунку
  if (resetBtn) {
    resetBtn.addEventListener("click", () => {
      if (deliveryCheck) deliveryCheck.checked = false
      const checkedRadio = document.querySelector(
        'input[name="clientStatus"]:checked',
      )
      if (checkedRadio) checkedRadio.checked = false
      if (paymentSelect) paymentSelect.selectedIndex = 0
      if (resultBox) {
        resultBox.classList.remove("success")
        resultBox.innerHTML = ""
      }
      errorBox.textContent = ""
      nameInput.classList.remove("invalid")
      validateCustomerName()
    })
  }

  renderCartItems()
  validateCustomerName()
}

function bootstrap() {
  initCatalogPage()
  initCartPage()
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", bootstrap)
} else {
  bootstrap()
}
