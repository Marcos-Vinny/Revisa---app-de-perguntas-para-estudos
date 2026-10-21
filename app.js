(function () {
  var STORAGE_KEY = "flashcards.v2";
  var OLD_KEY = "flashcards.v1";

  var data = load();
  var order = [];
  var pos = 0;
  var results = {};
  var finished = false;
  var busy = false;
  var dirty = false;
  var editingId = null;
  var setMode = "new";

  function uid() { return Date.now().toString(36) + Math.random().toString(36).slice(2, 7); }

  function load() {
    var d = null;
    try {
      var raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        var p = JSON.parse(raw);
        if (p && Array.isArray(p.sets)) d = p;
      }
      if (!d) {
        var old = localStorage.getItem(OLD_KEY);
        var list = old ? JSON.parse(old) : [];
        if (!Array.isArray(list)) list = [];
        d = { sets: [{ id: uid(), name: "Geral", cards: list }], current: null };
      }
    } catch (e) {
      d = { sets: [{ id: uid(), name: "Geral", cards: [] }], current: null };
    }
    if (d.sets.length > 0) {
      var ok = d.sets.some(function (s) { return s.id === d.current; });
      if (!ok) d.current = d.sets[0].id;
    } else {
      d.current = null;
    }
    return d;
  }
  function save() {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(data)); } catch (e) {}
  }
  function curSet() {
    if (!data.current || data.sets.length === 0) return null;
    return data.sets.find(function (s) { return s.id === data.current; }) || null;
  }
  function cardsOf() {
    var s = curSet();
    return s ? s.cards : [];
  }
  function byId(id) { return cardsOf().find(function (c) { return c.id === id; }); }
  function esc(s) {
    return String(s).replace(/[&<>"']/g, function (m) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[m];
    });
  }
  function shuffleArray(arr) {
    var a = arr.slice();
    for (var i = a.length - 1; i > 0; i--) {
      var j = Math.floor(Math.random() * (i + 1));
      var t = a[i]; a[i] = a[j]; a[j] = t;
    }
    return a;
  }

  var $ = function (id) { return document.getElementById(id); };
  var main = $("main"), counter = $("counter");
  var btnShuffle = $("btnShuffle"), btnChooseSet = $("btnChooseSet");
  var btnRenameSet = $("btnRenameSet"), setDropdownPanel = $("setDropdownPanel");
  var setOptionsList = $("setOptionsList"), btnCreateWhenEmpty = $("btnCreateWhenEmpty");
  var currentSetName = $("currentSetName");

  function startSession(ids) {
    order = ids.slice();
    pos = 0;
    results = {};
    finished = false;
  }
  function resetDeck() {
    var cards = cardsOf();
    startSession(cards.map(function (c) { return c.id; }));
  }

  function renderEditorHeader() {
    var s = curSet();
    if (s) {
      currentSetName.textContent = s.name + " (" + s.cards.length + ")";
      btnRenameSet.style.display = "inline-flex";
    } else {
      currentSetName.textContent = "Nenhum conjunto cadastrado";
      btnRenameSet.style.display = "none";
    }
  }

  function renderSetDropdownList() {
    if (data.sets.length === 0) {
      setOptionsList.innerHTML = '<div class="empty-list" style="padding:10px;">Nenhum conjunto.</div>';
      btnCreateWhenEmpty.style.display = "block";
      return;
    }
    btnCreateWhenEmpty.style.display = "none";
    setOptionsList.innerHTML = data.sets.map(function (s) {
      return '<div class="set-option-item' + (s.id === data.current ? ' active' : '') + '" data-setid="' + s.id + '">' +
        '<span>' + esc(s.name) + '</span><span style="opacity:0.6;">(' + s.cards.length + ')</span>' +
      '</div>';
    }).join("");
  }

  function renderPlayer(animateEnter) {
    var s = curSet();
    if (!s || s.cards.length === 0) {
      counter.textContent = "";
      main.innerHTML = '<div class="message"><div class="big">📝</div><p>' + 
        (!s ? 'Nenhum conjunto selecionado.<br>Toque em <b>Editar perguntas</b> para criar ou escolher um conjunto.' : 'Este conjunto ainda não tem perguntas.<br>Toque em <b>Editar perguntas</b> para cadastrar as primeiras.') + 
        '</p></div>';
      btnShuffle.disabled = true;
      return;
    }
    btnShuffle.disabled = false;

    if (finished) {
      renderSummary();
      return;
    }

    var c = byId(order[pos]);
    if (!c) {
      resetDeck();
      if (order.length === 0) return;
      c = byId(order[pos]);
    }
    counter.textContent = (pos + 1) + " / " + order.length;
    main.innerHTML =
      '<div class="row" id="row">' +
        '<div class="stage" id="stage">' +
          '<div class="card' + (animateEnter ? " enter" : "") + '" id="card">' +
            '<div class="face front"><div class="tag">Pergunta</div><div class="text">' + esc(c.q) + '</div><div class="hint">toque para ver a resposta</div></div>' +
            '<div class="face back"><div class="tag">Resposta</div><div class="text">' + esc(c.a) + '</div></div>' +
          '</div>' +
          '<div class="shuffle-layer" id="shuffleLayer"></div>' +
        '</div>' +
        '<div class="rates">' +
          '<button class="rate ok" data-rate="ok">Acertou</button>' +
          '<button class="rate wrong" data-rate="wrong">Errou</button>' +
          '<button class="rate partial" data-rate="partial">Incompleta</button>' +
        '</div>' +
      '</div>';
    $("card").addEventListener("click", function () {
      if (busy) return;
      var on = this.classList.toggle("flipped");
      $("row").classList.toggle("revealed", on);
    });
  }

  function renderSummary() {
    var wrong = order.filter(function (id) { return results[id] === "wrong"; });
    var partial = order.filter(function (id) { return results[id] === "partial"; });
    var okCount = order.length - wrong.length - partial.length;
    var missed = wrong.length + partial.length;
    counter.textContent = order.length + " / " + order.length;

    var html = '<div class="summary"><div class="head">' +
      '<div class="big">' + (missed === 0 ? "🎉" : "📋") + '</div>' +
      '<h2>' + (missed === 0 ? "Você acertou tudo!" : "Fim do conjunto") + '</h2></div>' +
      '<div class="stats"><span>✅ ' + okCount + '</span><span>❌ ' + wrong.length + '</span><span>🟡 ' + partial.length + '</span></div>' +
      '<div class="summary-list">';
    if (wrong.length) {
      html += '<h3 class="wrong">Você errou</h3>' + wrong.map(function (id) {
        return '<div class="li wrong">' + esc(byId(id).q) + '</div>';
      }).join("");
    }
    if (partial.length) {
      html += '<h3 class="partial">Incompletas</h3>' + partial.map(function (id) {
        return '<div class="li partial">' + esc(byId(id).q) + '</div>';
      }).join("");
    }
    html += '</div><div class="actions">' +
      '<button class="btn-soft" id="btnRepeat">🔁 Repetir</button>' +
      '<button class="btn-primary" id="btnReview"' + (missed === 0 ? " disabled" : "") + '>📖 Revisar</button>' +
      '</div></div>';
    main.innerHTML = html;
  }

  function rate(kind) {
    if (busy || finished) return;
    var card = $("card");
    if (!card || !card.classList.contains("flipped")) return;
    results[order[pos]] = kind;
    busy = true;
    card.classList.remove("flipped");
    $("row").classList.remove("revealed");
    setTimeout(function () {
      if (pos < order.length - 1) { pos++; } else { finished = true; }
      renderPlayer(true);
      busy = false;
    }, 350);
  }

  function repeatSession() {
    if (busy) return;
    startSession(order);
    renderPlayer(true);
  }
  function reviewMissed() {
    if (busy) return;
    var missed = order.filter(function (id) { return results[id] === "wrong" || results[id] === "partial"; });
    if (!missed.length) return;
    startSession(missed);
    renderPlayer(true);
  }

  function shuffleDeck() {
    if (busy || cardsOf().length === 0) return;
    busy = true;
    if (finished) { resetDeck(); renderPlayer(false); }
    var card = $("card");
    if (card) { card.classList.remove("flipped"); card.style.visibility = "hidden"; }
    $("row").classList.remove("revealed");
    var layer = $("shuffleLayer");
    var html = "";
    var emojis = ["🐶", "🐱", "🐴", "🐮", "🐰", "🐾"];
    for (var i = 0; i < 6; i++) {
      var dx = Math.round((Math.random() - 0.5) * 220);
      var dy = Math.round((Math.random() - 0.5) * 160);
      var rz = Math.round((Math.random() - 0.5) * 60);
      html += '<div class="mini" style="--dx:' + dx + 'px;--dy:' + dy + 'px;--rz:' + rz + 'deg;animation-delay:' + (i * 0.08) + 's">' + emojis[i % emojis.length] + '</div>';
    }
    layer.innerHTML = html;
    layer.classList.add("on");

    setTimeout(function () {
      startSession(shuffleArray(cardsOf().map(function (c) { return c.id; })));
      renderPlayer(true);
      busy = false;
    }, 1900);
  }

  function renderList() {
    var list = $("list");
    var cards = cardsOf();
    if (cards.length === 0) {
      list.innerHTML = '<div class="empty-list">Nenhuma pergunta neste conjunto.<br>Toque em <b>+ Nova pergunta</b> para começar.</div>';
      return;
    }
    list.innerHTML = cards.map(function (c, i) {
      return '<div class="item">' +
        '<div class="q">' + (i + 1) + '. ' + esc(c.q) + '</div>' +
        '<div class="a">' + esc(c.a) + '</div>' +
        '<div class="row2">' +
          '<button class="btn-soft btn-small" data-edit="' + c.id + '">✏️ Editar</button>' +
          '<button class="btn-danger btn-small" data-del="' + c.id + '">🗑 Apagar</button>' +
        '</div></div>';
    }).join("");
  }

  function updateEditorCounter() {
    var s = curSet();
    var n = s ? s.cards.length : 0;
    counter.textContent = n + (n === 1 ? " pergunta" : " perguntas");
  }

  function openModal(id) {
    if (!curSet()) { alert("Crie ou escolha um conjunto primeiro."); openSetModal("new"); return; }
    editingId = id || null;
    var c = id ? byId(id) : null;
    $("modalTitle").textContent = c ? "Editar pergunta" : "Nova pergunta";
    $("inQ").value = c ? c.q : "";
    $("inA").value = c ? c.a : "";
    $("modalBg").classList.add("on");
    setTimeout(function () { $("inQ").focus(); }, 50);
  }
  function closeModal() { $("modalBg").classList.remove("on"); editingId = null; }

  function saveModal() {
    var q = $("inQ").value.trim(), a = $("inA").value.trim();
    if (!q || !a) { alert("Preencha a pergunta e a resposta."); return; }
    if (editingId) {
      var c = byId(editingId);
      c.q = q; c.a = a;
    } else {
      cardsOf().push({ id: uid(), q: q, a: a });
    }
    dirty = true;
    save();
    closeModal();
    renderList();
    renderEditorHeader();
    updateEditorCounter();
  }

  function deleteCard(id) {
    var c = byId(id);
    if (!c) return;
    if (!confirm("Apagar esta pergunta?\n\n" + c.q)) return;
    var s = curSet();
    s.cards = s.cards.filter(function (x) { return x.id !== id; });
    dirty = true;
    save();
    renderList();
    renderEditorHeader();
    updateEditorCounter();
  }

  function openSetModal(mode) {
    setMode = mode;
    $("setModalTitle").textContent = mode === "new" ? "Novo conjunto" : "Renomear conjunto";
    var s = curSet();
    $("inSet").value = mode === "new" ? "" : (s ? s.name : "");
    $("setModalBg").classList.add("on");
    setTimeout(function () { $("inSet").focus(); }, 50);
  }
  function closeSetModal() { $("setModalBg").classList.remove("on"); }

  function saveSetModal() {
    var name = $("inSet").value.trim();
    if (!name) { alert("Digite um nome para o conjunto."); return; }
    if (setMode === "new") {
      var s = { id: uid(), name: name, cards: [] };
      data.sets.push(s);
      data.current = s.id;
      dirty = true;
    } else {
      var cur = curSet();
      if (cur) cur.name = name;
    }
    save();
    closeSetModal();
    renderEditorHeader();
    renderList();
    updateEditorCounter();
    resetDeck();
  }

  function deleteSet() {
    var s = curSet();
    if (!s) return;
    if (!confirm('Apagar o conjunto "' + s.name + '" e todas as ' + s.cards.length + ' perguntas dele?')) return;
    data.sets = data.sets.filter(function (x) { return x.id !== s.id; });
    data.current = data.sets.length > 0 ? data.sets[0].id : null;
    dirty = true;
    save();
    renderEditorHeader();
    renderList();
    updateEditorCounter();
    resetDeck();
  }

  function enterEditor() {
    document.body.classList.add("editing");
    renderEditorHeader();
    updateEditorCounter();
    renderList();
  }
  function leaveEditor() {
    document.body.classList.remove("editing");
    if (dirty) { resetDeck(); dirty = false; }
    renderPlayer(false);
  }

  // Eventos do seletor de conjuntos
  btnChooseSet.addEventListener("click", function () {
    var isOpen = setDropdownPanel.style.display === "block";
    if (isOpen) {
      setDropdownPanel.style.display = "none";
    } else {
      renderSetDropdownList();
      setDropdownPanel.style.display = "block";
    }
  });

  setOptionsList.addEventListener("click", function (e) {
    var item = e.target.closest(".set-option-item");
    if (!item) return;
    data.current = item.dataset.setid;
    save();
    setDropdownPanel.style.display = "none";
    renderEditorHeader();
    renderList();
    updateEditorCounter();
    resetDeck();
  });

  btnCreateWhenEmpty.addEventListener("click", function () {
    setDropdownPanel.style.display = "none";
    openSetModal("new");
  });

  document.addEventListener("click", function (e) {
    if (!e.target.closest(".set-management-header")) {
      setDropdownPanel.style.display = "none";
    }
  });

  btnShuffle.addEventListener("click", shuffleDeck);
  $("btnEdit").addEventListener("click", enterEditor);
  $("btnDone").addEventListener("click", leaveEditor);
  $("btnAdd").addEventListener("click", function () { openModal(null); });
  $("btnCancel").addEventListener("click", closeModal);
  $("btnSave").addEventListener("click", saveModal);
  $("modalBg").addEventListener("click", function (e) { if (e.target === this) closeModal(); });
  
  $("btnNewSet").addEventListener("click", function () { openSetModal("new"); });
  btnRenameSet.addEventListener("click", function () { openSetModal("rename"); });
  $("btnDelSet").addEventListener("click", deleteSet);
  
  $("btnSetCancel").addEventListener("click", closeSetModal);
  $("btnSetSave").addEventListener("click", saveSetModal);
  $("setModalBg").addEventListener("click", function (e) { if (e.target === this) closeSetModal(); });

  $("btnAbout").addEventListener("click", function () { $("aboutBg").classList.add("on"); });
  $("btnAboutClose").addEventListener("click", function () { $("aboutBg").classList.remove("on"); });
  $("aboutBg").addEventListener("click", function (e) { if (e.target === this) this.classList.remove("on"); });
  $("inSet").addEventListener("keydown", function (e) { if (e.key === "Enter") saveSetModal(); });
  
  $("list").addEventListener("click", function (e) {
    var t = e.target.closest("button");
    if (!t) return;
    if (t.dataset.edit) openModal(t.dataset.edit);
    if (t.dataset.del) deleteCard(t.dataset.del);
  });
  
  main.addEventListener("click", function (e) {
    var t = e.target.closest("button");
    if (!t) return;
    if (t.dataset.rate) rate(t.dataset.rate);
    if (t.id === "btnRepeat") repeatSession();
    if (t.id === "btnReview") reviewMissed();
  });  

  document.addEventListener("keydown", function (e) {
    if (document.body.classList.contains("editing")) return;
    if (document.querySelector(".modal-bg.on")) return;
    var map = { "1": "ok", "2": "wrong", "3": "partial" };
    if (map[e.key]) rate(map[e.key]); 
  });

  window.__fc = { cards: cardsOf, order: function () { return order; }, shuffleArray: shuffleArray };

  resetDeck();
  renderPlayer(false);

  if ("serviceWorker" in navigator) {
    window.addEventListener("load", function () {
      navigator.serviceWorker.register("sw.js").catch(function () {});
    });
  }
})();