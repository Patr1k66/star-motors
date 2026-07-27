(function () {
  "use strict";

  var state = { data: null, activeCategory: "Все" };

  function $(id) {
    return document.getElementById(id);
  }

  function renderHero(data) {
    var meta = data.meta;
    $("logo-img").src = meta.logo;
    $("hero-title").textContent = meta.title;
    $("hero-subtitle").textContent = meta.tagline;
    $("hero-categories").textContent = meta.categoriesText;
    $("hero-status").textContent = data.schedule.status;
    $("hero-rating").textContent = meta.ratingValue;
    $("hero-review-count").textContent = meta.reviewCount + " отзывов";
    $("hero-address").textContent = data.contacts.address;

    var phone = data.contacts.phone;
    $("header-phone").textContent = phone;
    $("header-phone").href = "tel:+74959950101";
    $("hero-phone-btn").textContent = phone;
    $("hero-route-btn").href = data.contacts.mapUrl;

    $("contacts-address").textContent = data.contacts.address;
    $("contacts-phone").textContent = phone;
    $("contacts-phone").href = "tel:+74959950101";
    $("contacts-schedule").textContent = data.schedule.hours;

    $("reviews-rating").textContent = meta.ratingValue;
    $("reviews-count").textContent = meta.reviewCount + " отзывов";
    $("about-lead").textContent = meta.about;

    $("legal-name").textContent = "Наименование организации: " + data.legal.name;
    $("legal-ogrn").textContent = "ОГРН: " + data.legal.ogrn;
    $("legal-inn").textContent = "ИНН: " + data.legal.inn;

    $("map-frame").src =
      "https://yandex.ru/map-widget/v1/?ll=37.3818%2C55.7933&z=16&pt=37.3818%2C55.7933%2Cpm2orgl";
  }

  function renderTabs(categories) {
    var tabs = $("catalog-tabs");
    tabs.innerHTML = "";
    categories.forEach(function (cat) {
      var btn = document.createElement("button");
      btn.type = "button";
      btn.className = "catalog-tab" + (cat.text === state.activeCategory ? " active" : "");
      btn.textContent = cat.text;
      btn.addEventListener("click", function () {
        state.activeCategory = cat.text;
        renderTabs(categories);
        renderCatalog(state.data.catalog);
      });
      tabs.appendChild(btn);
    });
  }

  function renderCatalog(items) {
    var grid = $("catalog-grid");
    grid.innerHTML = "";
    var filtered =
      state.activeCategory === "Все"
        ? items
        : items.filter(function (item) {
            return item.category === state.activeCategory;
          });

    filtered.forEach(function (item) {
      var card = document.createElement("article");
      card.className = "catalog-card";
      card.innerHTML =
        '<h3 class="catalog-card__title"></h3>' +
        '<p class="catalog-card__price"></p>' +
        '<span class="catalog-card__btn">Спросить в чате</span>';
      card.querySelector(".catalog-card__title").textContent = item.title;
      card.querySelector(".catalog-card__price").textContent = item.price;
      card.addEventListener("click", function () {
        var toggle = document.getElementById("cb-toggle");
        if (toggle) toggle.click();
      });
      grid.appendChild(card);
    });
  }

  function renderReviews(reviews) {
    var grid = $("reviews-grid");
    grid.innerHTML = "";
    reviews.forEach(function (review) {
      var card = document.createElement("article");
      card.className = "review-card";
      card.innerHTML =
        '<div class="review-card__head">' +
        '<img alt="" />' +
        '<div><strong></strong><div class="review-card__meta"></div></div>' +
        "</div><p></p>";
      card.querySelector("img").src = review.avatar;
      card.querySelector("img").alt = review.name;
      card.querySelector("strong").textContent = review.name;
      card.querySelector(".review-card__meta").textContent =
        "★".repeat(review.rating || 5) + " · " + review.date;
      card.querySelector("p").textContent = review.text;
      grid.appendChild(card);
    });
  }

  function renderPhotos(photos) {
    var grid = $("photos-grid");
    grid.innerHTML = "";
    photos.forEach(function (src) {
      var img = document.createElement("img");
      img.src = src;
      img.alt = "Star Motors";
      img.loading = "lazy";
      grid.appendChild(img);
    });
  }

  function renderFeatures(features) {
    var grid = $("features-grid");
    grid.innerHTML = "";
    features.forEach(function (feature) {
      var chip = document.createElement("div");
      chip.className = "feature-chip";
      chip.textContent = feature;
      grid.appendChild(chip);
    });
  }

  function initNav() {
    var burger = $("burger");
    var nav = $("main-nav");
    burger.addEventListener("click", function () {
      nav.classList.toggle("open");
    });
    nav.querySelectorAll("a").forEach(function (link) {
      link.addEventListener("click", function () {
        nav.classList.remove("open");
      });
    });
  }

  fetch("data/site-data.json")
    .then(function (res) {
      if (!res.ok) throw new Error("Failed to load site data");
      return res.json();
    })
    .then(function (data) {
      state.data = data;
      renderHero(data);
      renderTabs(data.categories);
      renderCatalog(data.catalog);
      renderReviews(data.reviews);
      renderPhotos(data.photos);
      renderFeatures(data.features);
      initNav();
    })
    .catch(function (err) {
      console.error(err);
      document.body.insertAdjacentHTML(
        "afterbegin",
        '<p style="padding:16px;background:#fee;color:#900">Не удалось загрузить данные сайта.</p>'
      );
    });
})();
