const startBtn = document.getElementById("start-btn");
const statusText = document.getElementById("status");
const diaryList = document.getElementById("diary-list");
const searchInput = document.getElementById("search-input");

let expenses = JSON.parse(localStorage.getItem("myExpenses")) || [];
let isRecording = false;

// SET YOUR BUDGET HERE
const MONTHLY_BUDGET = 80000;

const SpeechRecognition =
  window.SpeechRecognition || window.webkitSpeechRecognition;
const recognition = new SpeechRecognition();
recognition.continuous = false;
recognition.lang = "en-NG"; // Optimized for Nigerian accents

recognition.onstart = () => {
  isRecording = true;
  startBtn.classList.add("recording");
  startBtn.innerText = "🛑";
  statusText.innerText = "Listening... Tap to stop";
};

recognition.onresult = (event) => {
  processEntry(event.results[0][0].transcript);
};

recognition.onend = () => {
  isRecording = false;
  startBtn.classList.remove("recording");
  startBtn.innerText = "🎤";
};

startBtn.onclick = () => {
  isRecording ? recognition.stop() : recognition.start();
};

searchInput.oninput = () => {
  renderDiary(searchInput.value.toLowerCase());
};

function processEntry(text) {
  const amountMatch = text.match(/\d+/g);
  const amount = amountMatch ? parseInt(amountMatch.join("")) : 0;
  const newEntry = {
    id: Date.now(),
    date: new Date().toISOString(),
    text: text,
    amount: amount,
  };
  expenses.push(newEntry);
  saveAndRefresh();
}

function saveAndRefresh() {
  localStorage.setItem("myExpenses", JSON.stringify(expenses));
  renderDiary();
  calculateStats();
}

function renderDiary(filter = "") {
  const displayList = [...expenses]
    .reverse()
    .filter((e) => e.text.toLowerCase().includes(filter));
  diaryList.innerHTML = displayList
    .map((e) => {
      const d = new Date(e.date);
      return `
        <div class="entry" id="entry-${e.id}">
            <div class="entry-header">
                <small>📅 ${d.toLocaleDateString("en-GB", { day: "2-digit", month: "short" })} | 🕒 ${d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</small>
            </div>
            <div class="entry-content">
                <p id="text-display-${e.id}">"${e.text}"</p>
                <strong id="amount-display-${e.id}">₦${e.amount.toLocaleString()}</strong>
            </div>
            <div class="entry-actions">
                <button onclick="startEdit(${e.id})" class="edit-btn">Edit</button>
                <button onclick="deleteEntry(${e.id})" class="del-text">Delete</button>
            </div>
        </div>`;
    })
    .join("");
}

function calculateStats() {
  const now = new Date();
  const isToday = (d) => new Date(d).toDateString() === now.toDateString();
  const isThisMonth = (d) => new Date(d).getMonth() === now.getMonth();

  const daySum = expenses
    .filter((e) => isToday(e.date))
    .reduce((s, e) => s + e.amount, 0);
  const monthSum = expenses
    .filter((e) => isThisMonth(e.date))
    .reduce((s, e) => s + e.amount, 0);

  document.getElementById("day-total").innerText = daySum.toLocaleString();
  document.getElementById("month-total").innerText = monthSum.toLocaleString();

  // Progress Bar Logic
  const percent = Math.min((monthSum / MONTHLY_BUDGET) * 100, 100);
  const bar = document.getElementById("budget-bar");
  bar.style.width = percent + "%";

  // Change color to red if spending exceeds 80% of budget
  bar.style.backgroundColor = percent > 80 ? "#d32f2f" : "#2e7d32";
}

function startEdit(id) {
  const entry = expenses.find((e) => e.id === id);
  document.getElementById(`entry-${id}`).innerHTML = `
        <div class="edit-mode">
            <input type="text" id="edit-text-${id}" value="${entry.text}">
            <input type="number" id="edit-amt-${id}" value="${entry.amount}">
            <div class="entry-actions">
                <button onclick="saveEdit(${id})" class="save-btn">Save ✅</button>
                <button onclick="renderDiary()" class="del-text">Cancel</button>
            </div>
        </div>`;
}

function saveEdit(id) {
  const index = expenses.findIndex((e) => e.id === id);
  expenses[index].text = document.getElementById(`edit-text-${id}`).value;
  expenses[index].amount =
    parseInt(document.getElementById(`edit-amt-${id}`).value) || 0;
  saveAndRefresh();
}

function deleteEntry(id) {
  if (confirm("Are you sure you want to delete this?")) {
    expenses = expenses.filter((e) => e.id !== id);
    saveAndRefresh();
  }
}

document.getElementById("download-btn").onclick = () => {
  let csv = "Date,Time,Description,Amount(Naira)\n";
  expenses.forEach((e) => {
    const d = new Date(e.date);
    csv += `${d.toLocaleDateString()},${d.toLocaleTimeString()},${e.text.replace(/,/g, "")},${e.amount}\n`;
  });
  const blob = new Blob([csv], { type: "text/csv" });
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `Spending_Report_${new Date().toLocaleDateString()}.csv`;
  a.click();
};

document.getElementById("clear-btn").onclick = () => {
  if (confirm("This will delete ALL data. Are you sure?")) {
    expenses = [];
    saveAndRefresh();
  }
};

renderDiary();
calculateStats();
