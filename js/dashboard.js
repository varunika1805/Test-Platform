/**
 * dashboard.html — teacher PIN, Firestore + localStorage results,
 * tabs, theme toggle, AI question generation, and file upload.
 */

(function () {
  const gate = document.getElementById("teacher-gate");
  const dashboard = document.getElementById("dashboard-panel");
  const pinInput = document.getElementById("teacher-pin");
  const pinForm = document.getElementById("pin-form");
  const tbody = document.getElementById("results-body");
  const loadErr = document.getElementById("load-error");
  const dashboardHint = document.getElementById("dashboard-hint");

  const SESSION_KEY = "teacherDashboardOk";
  const THEME_KEY = "interviewLabTheme";
  const GEMINI_KEY_STORAGE = "geminiApiKeyDashboard";

  // ========== THEME TOGGLE ==========
  const themeToggle = document.getElementById("theme-toggle");
  const themeIcon = document.getElementById("theme-icon");
  const themeLabel = document.getElementById("theme-label");

  function setTheme(theme) {
    document.documentElement.setAttribute("data-theme", theme);
    localStorage.setItem(THEME_KEY, theme);
    updateThemeButton(theme);
  }

  function updateThemeButton(theme) {
    if (theme === "dark") {
      themeIcon.innerHTML = `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>
      </svg>`;
      themeLabel.textContent = "Dark";
    } else {
      themeIcon.innerHTML = `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <circle cx="12" cy="12" r="5"/>
        <line x1="12" y1="1" x2="12" y2="3"/>
        <line x1="12" y1="21" x2="12" y2="23"/>
        <line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/>
        <line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/>
        <line x1="1" y1="12" x2="3" y2="12"/>
        <line x1="21" y1="12" x2="23" y2="12"/>
        <line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/>
        <line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/>
      </svg>`;
      themeLabel.textContent = "Light";
    }
  }

  // Initialize theme
  const savedTheme = localStorage.getItem(THEME_KEY);
  const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
  const initialTheme = savedTheme || (prefersDark ? "dark" : "light");
  setTheme(initialTheme);

  if (themeToggle) {
    themeToggle.addEventListener("click", function () {
      const currentTheme = document.documentElement.getAttribute("data-theme");
      setTheme(currentTheme === "dark" ? "light" : "dark");
    });
  }

  // ========== TABS ==========
  const tabBtns = document.querySelectorAll(".tab-btn");
  const tabPanels = document.querySelectorAll(".tab-panel");

  tabBtns.forEach(function (btn) {
    btn.addEventListener("click", function () {
      const tabId = btn.getAttribute("data-tab");

      tabBtns.forEach(function (b) {
        b.classList.remove("active");
      });
      tabPanels.forEach(function (p) {
        p.classList.remove("active");
      });

      btn.classList.add("active");
      document.getElementById("tab-" + tabId).classList.add("active");
    });
  });

  // ========== PIN AUTHENTICATION ==========
  function showDashboard() {
    gate.style.display = "none";
    dashboard.style.display = "block";
    loadResults();
    initGeminiKey();
  }

  if (sessionStorage.getItem(SESSION_KEY) === "1") {
    showDashboard();
  }

  if (pinForm) {
    pinForm.addEventListener("submit", function (e) {
      e.preventDefault();
      const pin = (pinInput.value || "").trim();
      if (pin === TEACHER_PIN) {
        sessionStorage.setItem(SESSION_KEY, "1");
        showDashboard();
      } else {
        alert("Incorrect PIN.");
      }
    });
  }

  // ========== GEMINI API KEY ==========
  const geminiKeyInput = document.getElementById("gemini-api-key");
  const saveGeminiKeyBtn = document.getElementById("save-gemini-key");

  function initGeminiKey() {
    const savedKey = localStorage.getItem(GEMINI_KEY_STORAGE);
    if (savedKey && geminiKeyInput) {
      geminiKeyInput.value = savedKey;
    }
  }

  if (saveGeminiKeyBtn) {
    saveGeminiKeyBtn.addEventListener("click", function () {
      const key = geminiKeyInput.value.trim();
      if (key) {
        localStorage.setItem(GEMINI_KEY_STORAGE, key);
        alert("API key saved successfully!");
      } else {
        alert("Please enter an API key.");
      }
    });
  }

  // ========== AI QUESTION GENERATOR ==========
  const genCategorySelect = document.getElementById("gen-category");
  const customTopicGroup = document.getElementById("custom-topic-group");
  const aiGeneratorForm = document.getElementById("ai-generator-form");
  const generateBtn = document.getElementById("generate-btn");
  const aiOutput = document.getElementById("ai-output");
  const generatedContainer = document.getElementById("generated-questions-container");
  const saveGeneratedBtn = document.getElementById("save-generated-questions");

  let generatedQuestions = [];
  let generatedCategory = "";

  if (genCategorySelect) {
    genCategorySelect.addEventListener("change", function () {
      if (this.value === "Custom") {
        customTopicGroup.style.display = "block";
      } else {
        customTopicGroup.style.display = "none";
      }
    });
  }

  if (aiGeneratorForm) {
    aiGeneratorForm.addEventListener("submit", async function (e) {
      e.preventDefault();

      const apiKey = localStorage.getItem(GEMINI_KEY_STORAGE);
      if (!apiKey) {
        alert("Please save your Gemini API key first.");
        return;
      }

      const category = genCategorySelect.value;
      const customTopic = document.getElementById("gen-custom-topic").value.trim();
      const difficulty = document.getElementById("gen-difficulty").value;
      const count = parseInt(document.getElementById("gen-count").value, 10);
      const instructions = document.getElementById("gen-instructions").value.trim();

      const topic = category === "Custom" ? customTopic : category;
      if (!topic) {
        alert("Please enter a custom topic.");
        return;
      }

      generateBtn.disabled = true;
      generateBtn.innerHTML = '<span class="loading-spinner"></span> Generating...';

      try {
        const questions = await generateQuestionsWithGemini(
          apiKey,
          topic,
          difficulty,
          count,
          instructions
        );

        generatedQuestions = questions;
        generatedCategory = category === "Custom" ? customTopic : category;
        renderGeneratedQuestions(questions);
        aiOutput.style.display = "block";
      } catch (err) {
        console.error("Error generating questions:", err);
        alert("Error generating questions: " + err.message);
      } finally {
        generateBtn.disabled = false;
        generateBtn.innerHTML = `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/>
        </svg> Generate Questions`;
      }
    });
  }

  async function generateQuestionsWithGemini(apiKey, topic, difficulty, count, instructions) {
    const prompt = `Generate ${count} multiple-choice questions about "${topic}" at ${difficulty} difficulty level.

${instructions ? "Additional instructions: " + instructions : ""}

IMPORTANT: Respond with ONLY a valid JSON array, no markdown, no code blocks, just pure JSON.

Each question object must have exactly this structure:
{
  "q": "Question text here?",
  "options": ["Option A", "Option B", "Option C", "Option D"],
  "correctIndex": 0
}

The correctIndex should be 0, 1, 2, or 3 indicating which option is correct.
Make questions clear, educational, and appropriate for the difficulty level.
Ensure all 4 options are plausible but only one is correct.

Return ONLY the JSON array with ${count} question objects.`;

    const url =
      "https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=" +
      encodeURIComponent(apiKey);

    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
      }),
    });

    if (!res.ok) {
      const errText = await res.text();
      throw new Error("API Error: " + res.status + " " + errText);
    }

    const data = await res.json();
    const text =
      data.candidates &&
      data.candidates[0] &&
      data.candidates[0].content &&
      data.candidates[0].content.parts &&
      data.candidates[0].content.parts[0]
        ? data.candidates[0].content.parts[0].text
        : "";

    // Parse JSON from response
    let jsonStr = text.trim();
    // Remove markdown code blocks if present
    jsonStr = jsonStr.replace(/```json\n?/g, "").replace(/```\n?/g, "");
    
    const questions = JSON.parse(jsonStr);
    
    if (!Array.isArray(questions)) {
      throw new Error("Invalid response format");
    }

    return questions;
  }

  function renderGeneratedQuestions(questions) {
    generatedContainer.innerHTML = "";
    
    questions.forEach(function (q, idx) {
      const div = document.createElement("div");
      div.className = "generated-question";
      
      let optionsHtml = "";
      q.options.forEach(function (opt, i) {
        const isCorrect = i === q.correctIndex;
        optionsHtml += `<li class="${isCorrect ? "correct" : ""}">${String.fromCharCode(65 + i)}. ${escapeHtml(opt)}${isCorrect ? " (Correct)" : ""}</li>`;
      });

      div.innerHTML = `
        <p class="generated-question__text">Q${idx + 1}. ${escapeHtml(q.q)}</p>
        <ul class="generated-question__options">${optionsHtml}</ul>
      `;
      
      generatedContainer.appendChild(div);
    });
  }

  if (saveGeneratedBtn) {
    saveGeneratedBtn.addEventListener("click", function () {
      if (generatedQuestions.length === 0) {
        alert("No questions to save.");
        return;
      }

      // Save to localStorage
      const storageKey = "customQuestions_" + generatedCategory;
      const existing = JSON.parse(localStorage.getItem(storageKey) || "[]");
      const combined = existing.concat(generatedQuestions);
      localStorage.setItem(storageKey, JSON.stringify(combined));

      // Also add to QUESTION_BANK if it exists
      if (typeof QUESTION_BANK !== "undefined" && QUESTION_BANK[generatedCategory]) {
        generatedQuestions.forEach(function (q) {
          QUESTION_BANK[generatedCategory].push(q);
        });
      }

      alert(`${generatedQuestions.length} questions saved to "${generatedCategory}" category!`);
      generatedQuestions = [];
      aiOutput.style.display = "none";
    });
  }

  // ========== FILE UPLOAD ==========
  const dropzone = document.getElementById("dropzone");
  const fileInput = document.getElementById("file-input");
  const filePreview = document.getElementById("file-preview");
  const fileNameEl = document.getElementById("file-name");
  const questionCountEl = document.getElementById("question-count");
  const previewQuestionsEl = document.getElementById("preview-questions");
  const importBtn = document.getElementById("import-questions");
  const cancelImportBtn = document.getElementById("cancel-import");

  let uploadedData = null;

  if (dropzone) {
    dropzone.addEventListener("click", function () {
      fileInput.click();
    });

    dropzone.addEventListener("dragover", function (e) {
      e.preventDefault();
      dropzone.classList.add("dragover");
    });

    dropzone.addEventListener("dragleave", function () {
      dropzone.classList.remove("dragover");
    });

    dropzone.addEventListener("drop", function (e) {
      e.preventDefault();
      dropzone.classList.remove("dragover");
      const files = e.dataTransfer.files;
      if (files.length > 0) {
        handleFile(files[0]);
      }
    });
  }

  if (fileInput) {
    fileInput.addEventListener("change", function () {
      if (this.files.length > 0) {
        handleFile(this.files[0]);
      }
    });
  }

  function handleFile(file) {
    if (!file.name.endsWith(".json")) {
      alert("Please upload a JSON file.");
      return;
    }

    const reader = new FileReader();
    reader.onload = function (e) {
      try {
        const data = JSON.parse(e.target.result);
        
        if (!data.category || !data.questions || !Array.isArray(data.questions)) {
          throw new Error("Invalid format. JSON must have 'category' and 'questions' array.");
        }

        uploadedData = data;
        showFilePreview(file.name, data);
      } catch (err) {
        alert("Error parsing JSON: " + err.message);
      }
    };
    reader.readAsText(file);
  }

  function showFilePreview(filename, data) {
    fileNameEl.querySelector("span").textContent = filename;
    questionCountEl.textContent = data.questions.length + " questions";

    // Show preview of first 3 questions
    let previewHtml = "";
    const previewCount = Math.min(3, data.questions.length);
    for (let i = 0; i < previewCount; i++) {
      const q = data.questions[i];
      previewHtml += `
        <div class="generated-question" style="margin-bottom: 0.75rem;">
          <p class="generated-question__text" style="margin-bottom: 0.5rem;">Q${i + 1}. ${escapeHtml(q.q)}</p>
        </div>
      `;
    }
    if (data.questions.length > 3) {
      previewHtml += `<p class="sub" style="margin: 0;">...and ${data.questions.length - 3} more questions</p>`;
    }
    previewQuestionsEl.innerHTML = previewHtml;

    dropzone.style.display = "none";
    filePreview.style.display = "block";
  }

  if (importBtn) {
    importBtn.addEventListener("click", function () {
      if (!uploadedData) return;

      const category = uploadedData.category;
      const questions = uploadedData.questions;

      // Save to localStorage
      const storageKey = "customQuestions_" + category;
      const existing = JSON.parse(localStorage.getItem(storageKey) || "[]");
      const combined = existing.concat(questions);
      localStorage.setItem(storageKey, JSON.stringify(combined));

      // Also add to QUESTION_BANK if it exists
      if (typeof QUESTION_BANK !== "undefined") {
        if (!QUESTION_BANK[category]) {
          QUESTION_BANK[category] = [];
        }
        questions.forEach(function (q) {
          QUESTION_BANK[category].push(q);
        });
      }

      alert(`${questions.length} questions imported to "${category}" category!`);
      resetFileUpload();
    });
  }

  if (cancelImportBtn) {
    cancelImportBtn.addEventListener("click", function () {
      resetFileUpload();
    });
  }

  function resetFileUpload() {
    uploadedData = null;
    fileInput.value = "";
    filePreview.style.display = "none";
    dropzone.style.display = "block";
  }

  // ========== RESULTS TABLE ==========
  function formatLocalDate(ms) {
    if (!ms) return "-";
    try {
      return new Date(ms).toLocaleString();
    } catch (e) {
      return "-";
    }
  }

  function formatDate(dateField) {
    if (!dateField) return "-";
    try {
      if (dateField.toDate) {
        return dateField.toDate().toLocaleString();
      }
      if (dateField.seconds) {
        return new Date(dateField.seconds * 1000).toLocaleString();
      }
    } catch (e) {}
    return String(dateField);
  }

  function renderTableRow(d, isBrowserOnly) {
    const tr = document.createElement("tr");
    const dateStr = isBrowserOnly
      ? formatLocalDate(d.savedAt) + " (local)"
      : formatDate(d.date);
    tr.innerHTML =
      "<td>" +
      escapeHtml(String(d.name || "")) +
      "</td>" +
      "<td>" +
      escapeHtml(String(d.regNo || "")) +
      "</td>" +
      "<td>" +
      escapeHtml(String(d.category || "")) +
      "</td>" +
      "<td>" +
      escapeHtml(String(d.score ?? "")) +
      " / " +
      escapeHtml(String(d.total ?? "")) +
      "</td>" +
      "<td>" +
      escapeHtml(String(d.timeTaken || "")) +
      "</td>" +
      "<td>" +
      escapeHtml(dateStr) +
      "</td>";
    tbody.appendChild(tr);
  }

  function loadResults() {
    if (loadErr) loadErr.textContent = "";
    if (dashboardHint) dashboardHint.textContent = "";

    const localRows =
      typeof getLocalResults === "function" ? getLocalResults() : [];

    function mergeAndRender(cloudRows) {
      const merged = cloudRows.slice();
      for (let i = 0; i < localRows.length; i++) {
        merged.push(localRows[i]);
      }
      merged.sort(function (a, b) {
        return rowTimeMs(b) - rowTimeMs(a);
      });

      tbody.innerHTML = "";
      if (merged.length === 0) {
        tbody.innerHTML =
          '<tr><td colspan="6" style="text-align: center; padding: 2rem;">No results yet. Students must complete a test first.</td></tr>';
        if (!db && loadErr) {
          loadErr.style.display = "block";
          loadErr.textContent =
            "Firebase is not connected. Configure firebase-config.js to sync scores to the cloud.";
        }
        return;
      }

      for (let j = 0; j < merged.length; j++) {
        const row = merged[j];
        const browserOnly =
          row.localOnly === true ||
          (typeof row.savedAt === "number" && !row.date);
        renderTableRow(row, browserOnly);
      }

      if (dashboardHint) {
        if (!db && localRows.length > 0) {
          dashboardHint.textContent =
            "Showing attempts stored in this browser (Firebase not active).";
        } else if (db && localRows.length > 0) {
          dashboardHint.textContent =
            "Includes local attempts that were saved when cloud was unavailable.";
        }
      }
    }

    tbody.innerHTML = '<tr><td colspan="6" style="text-align: center; padding: 2rem;">Loading...</td></tr>';

    if (!db) {
      mergeAndRender([]);
      return;
    }

    db.collection("students")
      .orderBy("date", "desc")
      .get()
      .catch(function (err) {
        console.warn("orderBy(date) failed, loading without sort:", err);
        return db.collection("students").get();
      })
      .then(function (snap) {
        const cloudRows = [];
        snap.forEach(function (doc) {
          const d = doc.data();
          d._id = doc.id;
          cloudRows.push(d);
        });
        mergeAndRender(cloudRows);
      })
      .catch(function (err) {
        console.error(err);
        tbody.innerHTML = "";
        if (loadErr) {
          loadErr.style.display = "block";
          loadErr.textContent =
            "Error loading Firestore: " + (err.message || String(err));
        }
        mergeAndRender([]);
      });
  }

  function escapeHtml(str) {
    const d = document.createElement("div");
    d.textContent = str;
    return d.innerHTML;
  }
})();
