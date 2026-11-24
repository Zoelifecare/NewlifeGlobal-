/*
 * New Life Global: live content for the public WordPress website.
 *
 * Usage on any WordPress page (Custom HTML block):
 *   <script src="https://app.newlifeglobalaz.org/embed.js" defer></script>
 *   <div data-nlg="sermons" data-limit="6"></div>
 *
 * Blocks: announcements, latest-sermon, sermons, events (data-when="upcoming|past|all"), ministries, leaders,
 * gallery, services, contact, giving, form-contact, form-prayer, form-visit, form-newsletter, form-pledge, form-confirmation.
 * Everything comes from what staff publish in /admin; forms save into /admin.
 */
(function () {
  "use strict";
  if (window.__nlgEmbed) return;
  window.__nlgEmbed = true;

  var script = document.currentScript || document.querySelector('script[src*="/embed.js"]');
  var API = script ? new URL(script.src).origin : "https://app.newlifeglobalaz.org";
  var PHONE_FALLBACK = "602-879-9499";

  // ------------------------------------------------------------------ styles
  var css = [
    ".nlg{--g:#0b2624;--gold:#d8b879;--cream:#f6f1e7;--line:#e4dccb;font:inherit;color:inherit}",
    ".nlg *{box-sizing:border-box}",
    ".nlg-grid{display:grid;gap:1.25rem;grid-template-columns:repeat(auto-fill,minmax(var(--min,280px),1fr))}",
    ".nlg-card{background:#fff;color:var(--g);border-radius:18px;overflow:hidden;display:flex;flex-direction:column;box-shadow:0 1px 0 var(--line)}",
    ".nlg-card .b{padding:1.4rem 1.5rem 1.6rem;display:grid;gap:.45rem}",
    ".nlg-card h3{margin:0;font-size:1.2rem;line-height:1.25;color:var(--g)}",
    ".nlg-card p{margin:0;line-height:1.55}",
    ".nlg-k{font-size:.75rem;font-weight:700;letter-spacing:.14em;text-transform:uppercase;color:#8a6d2f}",
    ".nlg-m{font-size:.92rem;opacity:.8}",
    ".nlg-img{aspect-ratio:16/10;width:100%;object-fit:cover;display:block;background:var(--cream)}",
    ".nlg-vid{position:relative;aspect-ratio:16/9;background:#000;cursor:pointer;border:0;padding:0;width:100%;display:block}",
    ".nlg-vid img{width:100%;height:100%;object-fit:cover;display:block;opacity:.9}",
    ".nlg-vid span{position:absolute;inset:0;margin:auto;width:64px;height:64px;border-radius:50%;background:var(--gold);color:var(--g);display:flex;align-items:center;justify-content:center;font-size:1.4rem}",
    ".nlg-vid iframe{position:absolute;inset:0;width:100%;height:100%;border:0}",
    ".nlg-btn{display:inline-block;font:inherit;font-weight:700;padding:.75rem 1.4rem;border-radius:999px;border:0;background:var(--gold);color:var(--g)!important;text-decoration:none!important;cursor:pointer;margin:.25rem .35rem .25rem 0}",
    ".nlg-btn.ghost{background:transparent;border:1px solid currentColor;color:inherit!important}",
    ".nlg-list{display:grid;gap:.75rem;margin:0;padding:0;list-style:none}",
    ".nlg-list li{background:#fff;color:var(--g);border-radius:14px;padding:1rem 1.25rem}",
    ".nlg-gal{display:grid;gap:.6rem;grid-template-columns:repeat(auto-fill,minmax(200px,1fr))}",
    ".nlg-gal a{display:block;border-radius:12px;overflow:hidden}",
    ".nlg-gal img{width:100%;aspect-ratio:1;object-fit:cover;display:block;transition:transform .5s}",
    ".nlg-gal a:hover img{transform:scale(1.04)}",
    ".nlg-big{font-size:1.3rem;font-weight:700}",
    ".nlg-zeffy{position:relative;height:1150px;border-radius:18px;overflow:hidden;background:#fff}",
    ".nlg-zeffy iframe{position:absolute;inset:0;width:100%;height:100%;border:0}",
    ".nlg-form{display:grid;gap:.9rem;max-width:680px}",
    ".nlg-form label{display:grid;gap:.35rem;font-size:.95rem;font-weight:600}",
    ".nlg-form input,.nlg-form textarea,.nlg-form select{font:inherit;padding:.8rem 1rem;border:1px solid #cdbf9f;border-radius:12px;background:#fff;color:#0b2624;width:100%}",
    ".nlg-form textarea{min-height:130px}",
    ".nlg-row{display:grid;gap:.9rem;grid-template-columns:1fr 1fr}",
    "@media(max-width:640px){.nlg-row{grid-template-columns:1fr}}",
    ".nlg-check{display:flex!important;gap:.6rem;align-items:flex-start;font-weight:400!important}",
    ".nlg-check input{width:auto;margin-top:.3rem}",
    ".nlg-hp{position:absolute!important;left:-9999px!important;width:1px;height:1px;overflow:hidden}",
    ".nlg-status{min-height:1.2em;font-weight:600;margin:0}",
    ".nlg-status.ok{color:#2f6b3a}.nlg-status.err{color:#a3392b}",
    ".nlg-empty{opacity:.75;font-style:italic}",
  ].join("");
  var st = document.createElement("style");
  st.textContent = css;
  document.head.appendChild(st);

  // ------------------------------------------------------------------ helpers
  function esc(s) {
    return String(s == null ? "" : s).replace(/[&<>"']/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
    });
  }
  function para(s) {
    return esc(s).split(/\n{2,}/).map(function (p) { return "<p>" + p.replace(/\n/g, "<br>") + "</p>"; }).join("");
  }
  function safeUrl(u) {
    return /^https?:\/\//i.test(u || "") || /^tel:|^mailto:/i.test(u || "") ? u : null;
  }
  var TZ = "America/Phoenix";
  function fmtDate(iso, withTime) {
    if (!iso) return "";
    var d = new Date(iso.length === 10 ? iso + "T12:00:00" : iso);
    var o = { weekday: withTime ? "long" : undefined, month: "long", day: "numeric", year: "numeric", timeZone: TZ };
    var s = d.toLocaleDateString("en-US", o);
    if (withTime) s += " · " + d.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", timeZone: TZ });
    return s;
  }
  function limit(el, list) {
    var n = parseInt(el.getAttribute("data-limit") || "0", 10);
    return n > 0 ? list.slice(0, n) : list;
  }
  function empty(t) { return '<p class="nlg-empty">' + esc(t) + "</p>"; }
  function video(s) {
    var thumb = s.thumbnail || (s.youtubeId ? "https://i.ytimg.com/vi/" + s.youtubeId + "/hqdefault.jpg" : null);
    if (s.youtubeId) {
      return '<button type="button" class="nlg-vid" data-yt="' + esc(s.youtubeId) + '" aria-label="Play ' + esc(s.title) + '">' +
        (thumb ? '<img src="' + esc(thumb) + '" alt="" loading="lazy">' : "") + "<span>&#9658;</span></button>";
    }
    var url = safeUrl(s.videoUrl);
    return thumb ? (url ? '<a href="' + esc(url) + '">' : "") + '<img class="nlg-img" src="' + esc(thumb) + '" alt="" loading="lazy">' + (url ? "</a>" : "") : "";
  }
  function sermonCard(s) {
    return '<article class="nlg-card">' + video(s) + '<div class="b">' +
      (s.series ? '<span class="nlg-k">' + esc(s.series) + "</span>" : "") +
      "<h3>" + esc(s.title) + "</h3>" +
      '<p class="nlg-m">' + esc([s.speaker, fmtDate(s.preachedOn)].filter(Boolean).join(" · ")) + "</p>" +
      (s.scripture ? '<p class="nlg-m">' + esc(s.scripture) + "</p>" : "") +
      "</div></article>";
  }

  // ------------------------------------------------------------------ renderers
  var R = {
    announcements: function (el, d) {
      if (!d.announcements.length) { el.innerHTML = ""; return; }
      el.innerHTML = '<ul class="nlg-list">' + limit(el, d.announcements).map(function (a) {
        var u = safeUrl(a.linkUrl) || (a.linkUrl && a.linkUrl.charAt(0) === "/" ? API + a.linkUrl : null);
        return "<li><strong>" + esc(a.title) + "</strong>" + (a.body ? " " + esc(a.body) : "") +
          (u ? ' <a href="' + esc(u) + '">' + esc(a.linkLabel || "Learn more") + " &rarr;</a>" : "") + "</li>";
      }).join("") + "</ul>";
    },
    "latest-sermon": function (el, d) {
      var s = d.sermons.filter(function (x) { return x.featured; })[0] || d.sermons[0];
      el.innerHTML = s ? '<div class="nlg-card">' + video(s) + '<div class="b"><h3>' + esc(s.title) + '</h3><p class="nlg-m">' +
        esc([s.speaker, fmtDate(s.preachedOn)].filter(Boolean).join(" · ")) + "</p></div></div>" : empty("Messages coming soon.");
    },
    sermons: function (el, d) {
      var list = d.sermons;
      var cat = el.getAttribute("data-category");
      if (cat) list = list.filter(function (s) { return (s.category || "").toLowerCase() === cat.toLowerCase(); });
      list = limit(el, list);
      el.innerHTML = list.length ? '<div class="nlg-grid">' + list.map(sermonCard).join("") + "</div>" : empty("Messages coming soon.");
    },
    events: function (el, d) {
      var when = el.getAttribute("data-when") || "upcoming";
      var list = d.events.filter(function (e) { return when === "all" || (when === "upcoming" ? e.upcoming : !e.upcoming); });
      if (when !== "upcoming") list = list.slice().reverse();
      list = limit(el, list);
      if (!list.length) { el.innerHTML = empty(when === "upcoming" ? "No upcoming events right now. Join us any Sunday at 3:00 PM." : "No past events yet."); return; }
      el.innerHTML = '<div class="nlg-grid" style="--min:300px">' + list.map(function (e) {
        var reg = safeUrl(e.registrationUrl);
        return '<article class="nlg-card">' + (e.image ? '<img class="nlg-img" src="' + esc(e.image) + '" alt="' + esc(e.imageAlt) + '" loading="lazy">' : "") +
          '<div class="b">' + (e.category ? '<span class="nlg-k">' + esc(e.category) + "</span>" : "") +
          "<h3>" + esc(e.title) + "</h3>" +
          '<p class="nlg-m"><strong>' + esc(fmtDate(e.startsAt, true)) + "</strong>" + (e.endsAt && e.endsAt.slice(0, 10) !== e.startsAt.slice(0, 10) ? " to " + esc(fmtDate(e.endsAt, true)) : "") + "</p>" +
          (e.venue || e.address ? '<p class="nlg-m">' + esc([e.venue, e.address].filter(Boolean).join(", ")) + "</p>" : "") +
          (e.description ? para(e.description) : e.summary ? "<p>" + esc(e.summary) + "</p>" : "") +
          (reg ? '<p><a class="nlg-btn" href="' + esc(reg) + '">Register</a></p>' : "") +
          "</div></article>";
      }).join("") + "</div>";
    },
    ministries: function (el, d) {
      var list = limit(el, d.ministries);
      el.innerHTML = list.length ? '<div class="nlg-grid">' + list.map(function (m) {
        return '<article class="nlg-card">' + (m.image ? '<img class="nlg-img" src="' + esc(m.image) + '" alt="' + esc(m.imageAlt) + '" loading="lazy">' : "") +
          '<div class="b">' + (m.tagline ? '<span class="nlg-k">' + esc(m.tagline) + "</span>" : "") + "<h3>" + esc(m.name) + "</h3>" +
          (m.summary ? "<p>" + esc(m.summary) + "</p>" : "") +
          (m.schedule ? '<p class="nlg-m">' + esc(m.schedule) + "</p>" : "") + "</div></article>";
      }).join("") + "</div>" : empty("Ministries coming soon.");
    },
    leaders: function (el, d) {
      el.innerHTML = '<div class="nlg-grid" style="--min:220px">' + limit(el, d.leaders).map(function (l) {
        return '<article class="nlg-card">' + (l.photo ? '<img class="nlg-img" style="aspect-ratio:1" src="' + esc(l.photo) + '" alt="' + esc(l.name) + '" loading="lazy">' : "") +
          '<div class="b"><h3>' + esc(l.name) + '</h3><p class="nlg-m">' + esc(l.title) + "</p>" + (l.bio ? "<p>" + esc(l.bio) + "</p>" : "") + "</div></article>";
      }).join("") + "</div>";
    },
    gallery: function (el, d) {
      var list = limit(el, d.gallery);
      el.innerHTML = list.length ? '<div class="nlg-gal">' + list.map(function (g) {
        return '<a href="' + esc(g.url) + '" target="_blank" rel="noopener"><img src="' + esc(g.url) + '" alt="' + esc(g.alt || g.caption || "") + '" loading="lazy"></a>';
      }).join("") + "</div>" : empty("Photos coming soon.");
    },
    services: function (el, d) {
      el.innerHTML = '<ul class="nlg-list">' + d.church.services.map(function (s) {
        var join = safeUrl(s.joinUrl);
        return "<li><strong>" + esc(s.name) + "</strong><br>" + esc(s.day) + " · " + esc(s.time) + '<br><span class="nlg-m">' + esc(s.location) +
          (s.note ? " · " + esc(s.note) : "") + "</span>" + (join ? '<br><a href="' + esc(join) + '">Join online &rarr;</a>' : "") + "</li>";
      }).join("") + "</ul>";
    },
    contact: function (el, d) {
      var c = d.church, a = c.address, phone = c.phone || PHONE_FALLBACK;
      var maps = "https://www.google.com/maps/search/?api=1&query=" + encodeURIComponent(a.mapQuery || a.line1);
      el.innerHTML = '<div class="nlg-grid" style="--min:220px">' +
        '<div class="nlg-card"><div class="b"><span class="nlg-k">Call us</span><p class="nlg-big"><a href="tel:' + esc(phone.replace(/[^\d+]/g, "")) + '">' + esc(phone) + "</a></p></div></div>" +
        '<div class="nlg-card"><div class="b"><span class="nlg-k">Visit us</span><p>' + esc(a.line1) + "<br>" + esc(a.city + ", " + a.region + " " + a.postal) + '</p><p><a href="' + esc(maps) + '">Get directions &rarr;</a></p></div></div>' +
        (c.email ? '<div class="nlg-card"><div class="b"><span class="nlg-k">Email</span><p><a href="mailto:' + esc(c.email) + '">' + esc(c.email) + "</a></p></div></div>" : "") +
        c.social.map(function (s) {
          var u = safeUrl(s.url);
          return u ? '<div class="nlg-card"><div class="b"><span class="nlg-k">' + esc(s.label) + '</span><p><a href="' + esc(u) + '">' + esc(u.replace(/^https?:\/\/(www\.)?/, "").replace(/\/$/, "")) + "</a></p></div></div>" : "";
        }).join("") + "</div>";
    },
    giving: function (el, d) {
      var html = "";
      d.giving.forEach(function (m) {
        var url = safeUrl(m.url);
        if (m.kind === "online_link" && url && /^https:\/\/(www\.)?zeffy\.com\//.test(url)) {
          var embed = url.replace("/donation-form/", "/embed/donation-form/");
          html += '<div class="nlg-zeffy" id="card"><iframe title="Donation form powered by Zeffy" src="' + esc(embed) + '" allowpaymentrequest allowtransparency="true" allow="payment *"></iframe></div>';
        }
      });
      var cards = d.giving.filter(function (m) { return m.kind !== "online_link"; }).map(function (m) {
        var b = "";
        if (m.kind === "zelle" && m.handle) b = '<p class="nlg-big">' + esc(m.handle) + '</p><button type="button" class="nlg-btn" data-copy="' + esc(m.handle.replace(/[^\d@a-zA-Z.+_-]/g, "")) + '">Copy</button>';
        else if (m.kind === "cashapp" && m.handle) {
          var tag = m.handle.charAt(0) === "$" ? m.handle : "$" + m.handle;
          b = '<p class="nlg-big">' + esc(tag) + '</p><a class="nlg-btn" href="https://cash.app/' + esc(tag) + '">Open Cash App</a><button type="button" class="nlg-btn ghost" data-copy="' + esc(tag) + '">Copy</button>';
        } else if (m.location) b = '<p class="nlg-m">' + esc(m.location) + "</p>";
        return '<div class="nlg-card"><div class="b"><span class="nlg-k">' + esc(m.label) + "</span>" +
          (m.description ? "<p>" + esc(m.description) + "</p>" : "") + (m.instructions ? para(m.instructions) : "") + b + "</div></div>";
      });
      if (cards.length) html += '<div class="nlg-grid" style="--min:240px;margin-top:1.5rem">' + cards.join("") + "</div>";
      el.innerHTML = html || empty("Giving options coming soon.");
    },
  };

  // ------------------------------------------------------------------ forms (save into /admin)
  function field(label, name, type, req, extra) {
    var r = req ? " required" : "";
    var input = type === "textarea" ? '<textarea name="' + name + '"' + r + "></textarea>" : '<input type="' + type + '" name="' + name + '"' + r + (extra || "") + ">";
    return "<label>" + label + (req ? " *" : "") + input + "</label>";
  }
  function select(label, name, opts) {
    return "<label>" + label + '<select name="' + name + '">' + opts.map(function (o) { return '<option value="' + o[0] + '">' + o[1] + "</option>"; }).join("") + "</select></label>";
  }
  function row() { return '<div class="nlg-row">' + Array.prototype.join.call(arguments, "") + "</div>"; }
  var AMOUNT = ' min="1" step="0.01" inputmode="decimal"';
  var FORMS = {
    "form-contact": ["/api/forms/contact", "Send message",
      row(field("Name", "name", "text", 1), field("Email", "email", "email", 1)) + row(field("Phone", "phone", "tel"), field("Subject", "subject", "text")) + field("Message", "message", "textarea", 1)],
    "form-prayer": ["/api/forms/prayer", "Send prayer request",
      row(field("Name (optional)", "name", "text"), field("Email (optional)", "email", "email")) + field("Your prayer request", "request", "textarea", 1) +
      '<label class="nlg-check"><input type="checkbox" name="mayContact"> Our pastoral team may contact me about this request (needs an email)</label>'],
    "form-visit": ["/api/forms/visit", "Let us know you're coming",
      row(field("Name", "name", "text", 1), field("Email", "email", "email", 1)) + row(field("Phone", "phone", "tel"), field("Planned date", "visitDate", "date")) +
      row(field("How many are coming?", "partySize", "number", 0, ' min="1" max="50"'), "<span></span>") + field("Anything we should know? (optional)", "message", "textarea")],
    "form-newsletter": ["/api/forms/newsletter", "Subscribe", row(field("Name (optional)", "name", "text"), field("Email", "email", "email", 1))],
    "form-pledge": ["/api/giving/pledge", "Make my pledge",
      row(field("Full name", "name", "text", 1), field("Email", "email", "email", 1)) +
      row(field("Amount (USD)", "amount", "number", 1, AMOUNT), select("How often", "frequency", [["one_time", "One time"], ["weekly", "Weekly"], ["monthly", "Monthly"], ["quarterly", "Quarterly"], ["annually", "Annually"]])) +
      row(field("Phone (optional)", "phone", "tel"), field("I plan to give by", "expectedBy", "date")) + field("Message (optional)", "message", "textarea")],
    "form-confirmation": ["/api/giving/confirmation", "I sent my gift",
      select("How did you give?", "kind", [["zelle_confirmation", "Zelle"], ["cashapp_confirmation", "Cash App"], ["bank_transfer_confirmation", "Bank transfer"], ["cash_drop_notice", "Cash Drop at Sunday Service"]]) +
      row(field("Amount (USD)", "amount", "number", 1, AMOUNT), field("Date sent", "sentOn", "date")) +
      row(field("Name", "name", "text"), field("Email (for a confirmation)", "email", "email")) + field("Reference or note (optional)", "donorReference", "text")],
  };
  function renderForm(el, spec) {
    el.innerHTML = '<form class="nlg-form" novalidate>' + spec[2] +
      '<label class="nlg-hp" aria-hidden="true">Website<input name="website" tabindex="-1" autocomplete="off"></label>' +
      '<div><button type="submit" class="nlg-btn">' + spec[1] + '</button></div><p class="nlg-status" role="status" aria-live="polite"></p></form>';
    var f = el.querySelector("form"), status = f.querySelector(".nlg-status"), btn = f.querySelector("button");
    var started = Date.now();
    f.addEventListener("submit", function (e) {
      e.preventDefault();
      if (!f.reportValidity()) return;
      var data = {};
      new FormData(f).forEach(function (v, k) { data[k] = v; });
      f.querySelectorAll("input[type=checkbox]").forEach(function (c) { data[c.name] = c.checked; });
      data.fillMs = Date.now() - started;
      btn.disabled = true;
      status.className = "nlg-status";
      status.textContent = "Sending…";
      fetch(API + spec[0], { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data) })
        .then(function (r) { return r.json(); })
        .then(function (j) {
          var m = j.message || "";
          if (j.reference) m += " Reference: " + j.reference + ".";
          if (j.fieldErrors) m += " " + Object.keys(j.fieldErrors).map(function (k) { return j.fieldErrors[k]; }).join(" ");
          status.textContent = m;
          status.className = "nlg-status " + (j.ok ? "ok" : "err");
          if (j.ok) { f.reset(); started = Date.now(); }
        })
        .catch(function () {
          status.className = "nlg-status err";
          status.textContent = "Something went wrong. Please try again, or call " + PHONE_FALLBACK + ".";
        })
        .then(function () { btn.disabled = false; });
    });
  }

  // ------------------------------------------------------------------ boot
  document.addEventListener("click", function (e) {
    var v = e.target.closest && e.target.closest(".nlg-vid[data-yt]");
    if (v) {
      var id = v.getAttribute("data-yt");
      v.outerHTML = '<div class="nlg-vid"><iframe src="https://www.youtube-nocookie.com/embed/' + encodeURIComponent(id) +
        '?autoplay=1&rel=0" title="Video" allow="autoplay; encrypted-media; picture-in-picture; fullscreen" allowfullscreen></iframe></div>';
      return;
    }
    var c = e.target.closest && e.target.closest("[data-copy]");
    if (c) {
      var text = c.getAttribute("data-copy"), label = c.textContent;
      if (navigator.clipboard) navigator.clipboard.writeText(text);
      c.textContent = "Copied!";
      setTimeout(function () { c.textContent = label; }, 1800);
    }
  });

  var dataPromise = null;
  function load() {
    if (!dataPromise) dataPromise = fetch(API + "/api/public/content").then(function (r) { if (!r.ok) throw new Error(r.status); return r.json(); });
    return dataPromise;
  }

  function boot() {
    var els = document.querySelectorAll("[data-nlg]:not([data-nlg-done])");
    var needsData = false;
    els.forEach(function (el) {
      el.setAttribute("data-nlg-done", "1");
      el.classList.add("nlg");
      var kind = el.getAttribute("data-nlg");
      if (FORMS[kind]) renderForm(el, FORMS[kind]);
      else if (R[kind]) { needsData = true; el.innerHTML = '<p class="nlg-empty">Loading…</p>'; }
    });
    if (!needsData) return;
    load().then(function (d) {
      els.forEach(function (el) {
        var r = R[el.getAttribute("data-nlg")];
        if (r) { try { r(el, d); } catch (err) { el.innerHTML = ""; } }
      });
    }).catch(function () {
      els.forEach(function (el) { if (R[el.getAttribute("data-nlg")]) el.innerHTML = empty("Please refresh the page to load this section."); });
    });
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", boot);
  else boot();
})();
