const startBtn = document.getElementById("start-btn");
const statusText = document.getElementById("status");
const diaryList = document.getElementById("diary-list");

// Load data from LocalStorage on startup
let expenses = JSON.parse(localStorage.getItem("myExpenses")) || [];

const SpeechRecognition =
  window.SpeechRecognition || window.webkitSpeechRecognition;
const recognition = new SpeechRecognition();

recognition.onstart = () => {
  statusText.innerText = "Listening...";
};
recognition.onresult = (event) => {
  const transcript = event.results[0][0].transcript;
  processEntry(transcript);
};

function processEntry(text) {
  // Look for numbers in your speech
  const amountMatch = text.match(/\d+/g);
  const amount = amountMatch ? parseInt(amountMatch.join("")) : 0;

  const newEntry = {
    id: Date.now(),
    date: new Date(),
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

function calculateStats() {
  const now = new Date();

  const isToday = (d) => new Date(d).toDateString() === now.toDateString();
  const isThisWeek = (d) => now - new Date(d) < 7 * 24 * 60 * 60 * 1000;
  const isThisMonth = (d) => new Date(d).getMonth() === now.getMonth();

  const daySum = expenses
    .filter((e) => isToday(e.date))
    .reduce((s, e) => s + e.amount, 0);
  const weekSum = expenses
    .filter((e) => isThisWeek(e.date))
    .reduce((s, e) => s + e.amount, 0);
  const monthSum = expenses
    .filter((e) => isThisMonth(e.date))
    .reduce((s, e) => s + e.amount, 0);

  document.getElementById("day-total").innerText = daySum.toLocaleString();
  document.getElementById("week-total").innerText = weekSum.toLocaleString();
  document.getElementById("month-total").innerText = monthSum.toLocaleString();
}

function renderDiary() {
  diaryList.innerHTML = expenses
    .reverse()
    .map(
      (e) => `
        <div class="entry">
            <small>${new Date(e.date).toLocaleTimeString()}</small>
            <p>"${e.text}"</p>
            <strong>₦${e.amount.toLocaleString()}</strong>
        </div>
    `,
    )
    .join("");
  // Reverse it back for the internal array
  expenses.reverse();
}

startBtn.addEventListener("click", () => recognition.start());
document.getElementById("clear-btn").onclick = () => {
  if (confirm("Delete all entries?")) {
    expenses = [];
    saveAndRefresh();
  }
};

// Initial load
renderDiary();
calculateStats();

// ... (keep all your previous code here) ...

// Add this Download Function
document.getElementById("download-btn").onclick = () => {
  if (expenses.length === 0) {
    alert("No data to download yet!");
    return;
  }

  // Create CSV Header
  let csvContent =
    "data:text/csv;charset=utf-8,Date,Time,Description,Amount (Naira)\n";

  // Add each expense as a row
  expenses.forEach((e) => {
    const dateObj = new Date(e.date);
    const date = dateObj.toLocaleDateString();
    const time = dateObj.toLocaleTimeString();
    // Clean text to avoid breaking CSV format
    const cleanText = e.text.replace(/,/g, "");
    csvContent += `${date},${time},${cleanText},${e.amount}\n`;
  });

  // Create a hidden link and "click" it to trigger download
  const encodedUri = encodeURI(csvContent);
  const link = document.createElement("a");
  link.setAttribute("href", encodedUri);
  link.setAttribute(
    "download",
    `Spending_Diary_${new Date().toLocaleDateString()}.csv`,
  );
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};
