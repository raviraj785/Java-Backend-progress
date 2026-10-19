(() => {
  "use strict";
  const STORAGE_KEY = "devtrack-java-backend-v2";
  const $ = (selector) => document.querySelector(selector);
  const state = loadState();
  let toastTimer;

  function loadState() {
    try {
      const parsed = JSON.parse(localStorage.getItem(STORAGE_KEY) || "{}");
      return { completed: parsed.completed || {}, entries: Array.isArray(parsed.entries) ? parsed.entries : [], updatedAt: parsed.updatedAt || null };
    } catch {
      return { completed: {}, entries: [], updatedAt: null };
    }
  }
  function saveState() {
    state.updatedAt = new Date().toISOString();
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
      $("#saveStatus").textContent = "● Saved locally";
      $("#saveStatus").style.color = "#209e78";
      $("#lastUpdated").textContent = "just now";
    } catch {
      $("#saveStatus").textContent = "● Save failed";
      $("#saveStatus").style.color = "#d65b6a";
      toast("Browser storage is unavailable. Export a backup.");
    }
  }
  function allTopics() {
    return window.ROADMAP.flatMap((phase, phaseIndex) => phase.topics.map(([time, title], topicIndex) => ({
      id: `${phaseIndex}-${topicIndex}-${time.replaceAll(":", "")}`, time, title, phaseIndex
    })));
  }
  const topics = allTopics();
  const total = topics.length;
  const isDone = id => Boolean(state.completed[id]);
  const doneCount = () => topics.filter(topic => isDone(topic.id)).length;
  const percent = () => total ? Math.round(doneCount() / total * 100) : 0;
  function formatDate(dateString, options = { day: "2-digit", month: "short", year: "numeric" }) {
    if (!dateString) return "—";
    const date = new Date(`${dateString}T12:00:00`);
    return Number.isNaN(date.getTime()) ? dateString : date.toLocaleDateString("en-IN", options);
  }
  function escapeHtml(value) {
    return String(value ?? "").replace(/[&<>"']/g, ch => ({ "&":"&amp;", "<":"&lt;", ">":"&gt;", '"':"&quot;", "'":"&#39;" }[ch]));
  }
  function renderRoadmap() {
    const query = $("#searchInput").value.trim().toLowerCase();
    const filter = $("#filterSelect").value;
    const container = $("#roadmapList");
    let visibleCount = 0;
    container.innerHTML = window.ROADMAP.map((phase, phaseIndex) => {
      const phaseTopics = phase.topics.map(([time, title], topicIndex) => ({
        id: `${phaseIndex}-${topicIndex}-${time.replaceAll(":", "")}`, time, title
      })).filter(topic => {
        const matchesQuery = !query || topic.title.toLowerCase().includes(query) || topic.time.includes(query);
        const matchesFilter = filter === "all" || (filter === "done" ? isDone(topic.id) : !isDone(topic.id));
        return matchesQuery && matchesFilter;
      });
      if (!phaseTopics.length) return "";
      visibleCount += phaseTopics.length;
      const phaseDone = phaseTopics.filter(topic => isDone(topic.id)).length;
      const pct = Math.round(phaseDone / phaseTopics.length * 100);
      return `<article class="phase-card" data-phase="${phaseIndex}">
        <div class="phase-header" role="button" tabindex="0" aria-expanded="true">
          <div class="phase-number">${String(phaseIndex + 1).padStart(2, "0")}</div>
          <div class="phase-title"><h3>${escapeHtml(phase.title)}</h3><p>${escapeHtml(phase.range)} · ${phase.topics.length} topics</p></div>
          <div class="phase-progress"><b>${phaseDone}/${phaseTopics.length}</b><div class="mini-bar"><span style="width:${pct}%"></span></div></div><span class="chevron">⌄</span>
        </div>
        <div class="topic-list">${phaseTopics.map(topic => `<label class="topic-row ${isDone(topic.id) ? "done" : ""}">
          <input class="topic-check" type="checkbox" data-topic="${topic.id}" ${isDone(topic.id) ? "checked" : ""} aria-label="Mark ${escapeHtml(topic.title)} complete">
          <span class="topic-name">${escapeHtml(topic.title)}</span><span class="timestamp">${escapeHtml(topic.time)}</span>
        </label>`).join("")}</div>
      </article>`;
    }).join("");
    if (!visibleCount) container.innerHTML = `<div class="empty-state">No topics match your search or filter.</div>`;
  }
  function renderDashboard() {
    const done = doneCount(), pct = percent();
    $("#mainPercent").textContent = `${pct}%`;
    $("#mainRing").style.background = `conic-gradient(#a49aff ${pct * 3.6}deg,#ffffff20 ${pct * 3.6}deg)`;
    $("#completedCount").textContent = done;
    $("#progressSub").textContent = `${done} of ${total} topics complete`;
    $("#statDone").textContent = done;
    $("#statLeft").textContent = total - done;
    $("#statSessions").textContent = state.entries.length;
    $("#statMinutes").textContent = state.entries.reduce((sum, entry) => sum + (Number(entry.minutes) || 0), 0).toLocaleString("en-IN");
    $("#dayCount").textContent = new Set(state.entries.map(entry => entry.date)).size;
    $("#lastUpdated").textContent = state.updatedAt ? formatDate(state.updatedAt.slice(0, 10), {day:"2-digit",month:"short"}) : "not yet";
  }
  function renderJournal() {
    const list = $("#journalList");
    const entries = [...state.entries].sort((a,b) => b.date.localeCompare(a.date) || b.createdAt - a.createdAt);
    if (!entries.length) {
      list.innerHTML = `<div class="empty-state">No study sessions yet. Log your first session above.</div>`;
      return;
    }
    list.innerHTML = entries.map(entry => {
      const d = new Date(`${entry.date}T12:00:00`);
      return `<article class="journal-entry">
        <div class="entry-date"><b>${d.getDate()}</b><span>${d.toLocaleDateString("en-IN",{month:"short"})}</span></div>
        <div class="entry-content"><h4>${escapeHtml(entry.topic)}</h4><p>${escapeHtml(entry.notes || "No extra notes added.")}</p><div class="entry-meta">${escapeHtml(formatDate(entry.date))} · ${Number(entry.minutes)||0} minutes studied</div></div>
        <button class="delete-entry" data-delete-entry="${entry.id}" aria-label="Delete this journal entry" title="Delete entry">×</button>
      </article>`;
    }).join("");
  }
  function renderAll() { renderDashboard(); renderRoadmap(); renderJournal(); }
  function toast(message) {
    const node = $("#toast");
    node.textContent = message;
    node.classList.add("show");
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => node.classList.remove("show"), 2600);
  }
  function exportBackup() {
    const payload = { app: "Java Backend Tracker", version: 2, exportedAt: new Date().toISOString(), completed: state.completed, entries: state.entries, updatedAt: state.updatedAt };
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `java-backend-progress-${new Date().toISOString().slice(0,10)}.json`;
    anchor.click();
    URL.revokeObjectURL(url);
    toast("Progress backup exported.");
  }
  function importBackup(file) {
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const data = JSON.parse(reader.result);
        if (!data || typeof data.completed !== "object" || !Array.isArray(data.entries)) throw new Error("Invalid backup");
        if (!confirm("Import this backup? It will replace the progress currently saved in this browser.")) return;
        state.completed = data.completed;
        state.entries = data.entries;
        saveState();
        renderAll();
        toast("Backup imported successfully.");
      } catch {
        toast("Could not read that backup file.");
      }
    };
    reader.readAsText(file);
  }

  $("#roadmapList").addEventListener("change", event => {
    const input = event.target.closest("[data-topic]");
    if (!input) return;
    state.completed[input.dataset.topic] = input.checked;
    if (!input.checked) delete state.completed[input.dataset.topic];
    saveState(); renderAll();
  });
  $("#roadmapList").addEventListener("click", event => {
    const header = event.target.closest(".phase-header");
    if (!header) return;
    if (event.target.closest(".topic-check")) return;
    const card = header.closest(".phase-card");
    card.classList.toggle("collapsed");
    header.setAttribute("aria-expanded", String(!card.classList.contains("collapsed")));
  });
  $("#roadmapList").addEventListener("keydown", event => {
    if ((event.key === "Enter" || event.key === " ") && event.target.matches(".phase-header")) {
      event.preventDefault(); event.target.click();
    }
  });
  $("#searchInput").addEventListener("input", renderRoadmap);
  $("#filterSelect").addEventListener("change", renderRoadmap);
  $("#dailyForm").addEventListener("submit", event => {
    event.preventDefault();
    const date = $("#studyDate").value;
    const minutes = Number($("#studyMinutes").value);
    const topic = $("#studyTopic").value.trim();
    const notes = $("#studyNotes").value.trim();
    if (!date || !topic || !Number.isFinite(minutes) || minutes < 0) return toast("Please complete the required fields.");
    state.entries.push({ id: `${Date.now()}-${Math.random().toString(16).slice(2)}`, date, minutes, topic, notes, createdAt: Date.now() });
    saveState(); renderAll();
    $("#dailyForm").reset();
    $("#studyDate").value = new Date().toISOString().slice(0,10);
    toast("Daily progress saved.");
  });
  $("#journalList").addEventListener("click", event => {
    const button = event.target.closest("[data-delete-entry]");
    if (!button) return;
    if (!confirm("Delete this daily journal entry?")) return;
    state.entries = state.entries.filter(entry => entry.id !== button.dataset.deleteEntry);
    saveState(); renderAll(); toast("Journal entry deleted.");
  });
  $("#logTodayBtn").addEventListener("click", () => {
    $("#daily").scrollIntoView({ behavior: "smooth" });
    $("#studyTopic").focus({ preventScroll: true });
  });
  $("#exportBtn").addEventListener("click", exportBackup);
  $("#importBtn").addEventListener("click", () => $("#importFile").click());
  $("#importFile").addEventListener("change", event => {
    if (event.target.files?.[0]) importBackup(event.target.files[0]);
    event.target.value = "";
  });
  $("#studyDate").value = new Date().toISOString().slice(0,10);
  renderAll();
})();
