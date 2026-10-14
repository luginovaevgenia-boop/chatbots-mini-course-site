// Все ссылки кнопок сайта. Меняйте только значения справа, остальное не трогайте.
// "#" означает «ссылка ещё не заполнена».
window.LINKS = {
  freeLessonBot: "#",   // Telegram-бот: бесплатный пробный урок
  courseBot: "#",       // Telegram-бот: оплата курса за 7990 ₽
  lessonBot: "#",       // Telegram-бот: оплата урока за 990 ₽
  offer: "#",           // оферта
  privacy: "#",         // политика конфиденциальности
  consentData: "#",     // согласие на обработку персональных данных
  consentMailing: "#"   // согласие на рассылку
};

(function () {
  function apply() {
    var nodes = document.querySelectorAll("[data-link]");
    for (var i = 0; i < nodes.length; i++) {
      var key = nodes[i].getAttribute("data-link");
      var value = window.LINKS && window.LINKS[key];
      if (!value || value === "#") {
        nodes[i].setAttribute("href", "#");
        console.info("Ссылка не заполнена: " + key);
      } else {
        nodes[i].setAttribute("href", value);
      }
    }
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", apply);
  else apply();
})();
