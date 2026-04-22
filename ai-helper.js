// =============================================
// Gemini AI Чатбот — «Ақылды көмекші» виджеті
// Gemini API арқылы оқушыларға жауап береді
// =============================================

// ⚠️ Мына кілтті https://aistudio.google.com/app/apikey сайтынан алыңыз
const GEMINI_API_KEY = "YOUR_GEMINI_API_KEY_HERE";
const GEMINI_API_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-latest:generateContent?key=${GEMINI_API_KEY}`;

// Оқушы деңгейіне байланысты сұрақтың қиындығы
let currentStudentLevel = 1;

/**
 * Gemini API-ге сұраныс жіберу
 * @param {string} userMessage - Оқушының сұрағы
 * @param {string} topicContext - Ағымдағы тақырып контексті
 */
export async function askAI(userMessage, topicContext = "") {
  // Жүйелік нұсқау — AI-дің жауап беру стилін анықтайды
  const systemPrompt = `
Сен "Зере" деген атпен танымал дос AI-помощник. Сен 4-сыныптың 
«Цифрлық сауаттылық / АКТ» пәні бойынша оқушыларға көмек бересің.

Ережелер:
1. Қазақ тілінде жауап бер (немесе оқушы қандай тілде сұраса, сол тілде)
2. Жауаптарың қысқа, түсінікті және достық болсын (10 жасар балаға арналған)
3. Эмодзи қолдан — бірақ тым көп емес 😊
4. Техникалық терминдерді қарапайым тілмен түсіндір
5. Оқушыны мақтап, ынталандыр
6. ${topicContext ? `Ағымдағы тақырып: ${topicContext}` : ""}
7. Оқушының деңгейі: ${currentStudentLevel} (бұл деңгейге сай жауап бер)

Жауап беруге тиыс тақырыптар: бейне жасау, бейне өңдеу, 
презентация, браузер параметрлері, анимация, дыбыс, АКТ.
`;

  const requestBody = {
    contents: [
      {
        parts: [
          {
            text: systemPrompt + "\n\nОқушының сұрағы: " + userMessage,
          },
        ],
      },
    ],
    generationConfig: {
      temperature: 0.7,
      maxOutputTokens: 400,
      topP: 0.8,
    },
  };

  const response = await fetch(GEMINI_API_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(requestBody),
  });

  if (!response.ok) {
    throw new Error("AI қате жіберді. Кейінірек қайталап көр.");
  }

  const data = await response.json();
  return data.candidates[0].content.parts[0].text;
}

/**
 * Оқушы деңгейін орнату (adaptive learning үшін)
 */
export function setStudentLevel(level) {
  currentStudentLevel = level;
}

/**
 * Adaptive сұрақ ұсыну (оқушының деңгейіне байланысты)
 * @param {string} topicId - Тақырып ID
 * @param {number} level - Оқушы деңгейі
 */
export async function getAdaptiveQuestion(topicId, level) {
  const difficulty = level <= 2 ? "оңай" : level <= 5 ? "орташа" : "қиын";

  const prompt = `
${topicId} тақырыбы бойынша 4-сынып оқушысына арналған ${difficulty} деңгейдегі 
бір сұрақ жаз. Сұрақтың 4 жауабы болсын (A, B, C, D). 
Дұрыс жауапты да көрсет. JSON форматында:
{
  "question": "...",
  "options": ["A. ...", "B. ...", "C. ...", "D. ..."],
  "correct": "A",
  "explanation": "..."
}
Тек JSON қайтар, басқа мәтін жоқ.
`;

  const requestBody = {
    contents: [{ parts: [{ text: prompt }] }],
    generationConfig: { temperature: 0.8, maxOutputTokens: 300 },
  };

  const response = await fetch(GEMINI_API_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(requestBody),
  });

  const data = await response.json();
  const text = data.candidates[0].content.parts[0].text;

  // JSON-ды таза алу
  const jsonMatch = text.match(/\{[\s\S]*\}/);
  if (jsonMatch) {
    return JSON.parse(jsonMatch[0]);
  }
  return null;
}

// =============================================
// ЧАТБОТ UI КОМПОНЕНТІ
// =============================================

export function createChatbotWidget(topicContext = "") {
  // HTML/CSS/JS чатбот виджетін жасау
  const widgetHTML = `
    <div id="chatbot-widget" class="chatbot-widget">
      <!-- Белсендіру батырмасы -->
      <button id="chatbot-toggle" class="chatbot-toggle" aria-label="ЖИ Көмекші">
        <span class="chatbot-icon">🤖</span>
        <span class="chatbot-pulse"></span>
      </button>
      
      <!-- Чат панелі -->
      <div id="chatbot-panel" class="chatbot-panel hidden">
        <div class="chatbot-header">
          <div class="chatbot-avatar">🦋</div>
          <div class="chatbot-info">
            <h4>Зере</h4>
            <span>Ақылды көмекші • Онлайн</span>
          </div>
          <button id="chatbot-close" class="chatbot-close">✕</button>
        </div>
        
        <div id="chatbot-messages" class="chatbot-messages">
          <div class="chatbot-message bot">
            <div class="message-bubble">
              Сәлем! Мен Зере — сенің ақылды досың! 🌟<br>
              АКТ пәні бойынша кез келген сұрағыңды қойа аласың!
            </div>
          </div>
        </div>
        
        <div class="chatbot-input-area">
          <input 
            id="chatbot-input" 
            type="text" 
            placeholder="Сұрағыңды жаз..." 
            autocomplete="off"
          />
          <button id="chatbot-send">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="m22 2-7 20-4-9-9-4z"/><path d="M22 2 11 13"/>
            </svg>
          </button>
        </div>
      </div>
    </div>
  `;

  // Стильдер
  const styles = `
    .chatbot-widget {
      position: fixed;
      bottom: 24px;
      right: 24px;
      z-index: 9999;
      font-family: 'Nunito', sans-serif;
    }
    .chatbot-toggle {
      width: 64px; height: 64px;
      border-radius: 50%;
      background: linear-gradient(135deg, #7C3AED, #4F46E5);
      border: none; cursor: pointer;
      box-shadow: 0 8px 32px rgba(124,58,237,0.5);
      position: relative;
      transition: transform 0.3s ease, box-shadow 0.3s ease;
    }
    .chatbot-toggle:hover { transform: scale(1.1); box-shadow: 0 12px 40px rgba(124,58,237,0.6); }
    .chatbot-icon { font-size: 28px; display: block; }
    .chatbot-pulse {
      position: absolute; top: 4px; right: 4px;
      width: 14px; height: 14px; border-radius: 50%;
      background: #10B981;
      animation: pulse 2s infinite;
    }
    @keyframes pulse {
      0%,100% { transform: scale(1); opacity: 1; }
      50% { transform: scale(1.3); opacity: 0.7; }
    }
    .chatbot-panel {
      position: absolute; bottom: 80px; right: 0;
      width: 340px; height: 480px;
      background: white;
      border-radius: 24px;
      box-shadow: 0 20px 60px rgba(0,0,0,0.2);
      display: flex; flex-direction: column;
      overflow: hidden;
      animation: slideUp 0.3s ease;
    }
    @keyframes slideUp {
      from { opacity: 0; transform: translateY(20px); }
      to { opacity: 1; transform: translateY(0); }
    }
    .chatbot-panel.hidden { display: none; }
    .chatbot-header {
      background: linear-gradient(135deg, #7C3AED, #4F46E5);
      padding: 16px; display: flex; align-items: center; gap: 12px;
    }
    .chatbot-avatar { font-size: 32px; }
    .chatbot-info h4 { color: white; margin: 0; font-size: 16px; font-weight: 700; }
    .chatbot-info span { color: rgba(255,255,255,0.8); font-size: 12px; }
    .chatbot-close {
      margin-left: auto; background: rgba(255,255,255,0.2);
      border: none; color: white; width: 28px; height: 28px;
      border-radius: 50%; cursor: pointer; font-size: 14px;
      transition: background 0.2s;
    }
    .chatbot-close:hover { background: rgba(255,255,255,0.3); }
    .chatbot-messages {
      flex: 1; padding: 16px; overflow-y: auto;
      display: flex; flex-direction: column; gap: 12px;
      background: #F8F7FF;
    }
    .chatbot-message { display: flex; }
    .chatbot-message.user { justify-content: flex-end; }
    .message-bubble {
      max-width: 80%; padding: 10px 14px;
      border-radius: 18px; font-size: 14px; line-height: 1.5;
    }
    .chatbot-message.bot .message-bubble {
      background: white;
      box-shadow: 0 2px 8px rgba(0,0,0,0.1);
      border-bottom-left-radius: 4px;
      color: #1F2937;
    }
    .chatbot-message.user .message-bubble {
      background: linear-gradient(135deg, #7C3AED, #4F46E5);
      color: white;
      border-bottom-right-radius: 4px;
    }
    .message-typing {
      display: flex; gap: 4px; padding: 10px 14px;
      background: white; border-radius: 18px; border-bottom-left-radius: 4px;
      width: fit-content; box-shadow: 0 2px 8px rgba(0,0,0,0.1);
    }
    .typing-dot {
      width: 8px; height: 8px; border-radius: 50%;
      background: #7C3AED; animation: bounce 1s infinite;
    }
    .typing-dot:nth-child(2) { animation-delay: 0.2s; }
    .typing-dot:nth-child(3) { animation-delay: 0.4s; }
    @keyframes bounce { 0%,100% { transform: translateY(0); } 50% { transform: translateY(-6px); } }
    .chatbot-input-area {
      display: flex; padding: 12px; gap: 8px;
      border-top: 1px solid #E5E7EB; background: white;
    }
    #chatbot-input {
      flex: 1; padding: 10px 14px; border-radius: 20px;
      border: 2px solid #E5E7EB; outline: none; font-size: 14px;
      font-family: 'Nunito', sans-serif; transition: border 0.2s;
    }
    #chatbot-input:focus { border-color: #7C3AED; }
    #chatbot-send {
      width: 42px; height: 42px; border-radius: 50%;
      background: linear-gradient(135deg, #7C3AED, #4F46E5);
      border: none; cursor: pointer; color: white;
      display: flex; align-items: center; justify-content: center;
      transition: transform 0.2s;
    }
    #chatbot-send:hover { transform: scale(1.1); }
    @media (max-width: 480px) {
      .chatbot-panel { width: calc(100vw - 32px); right: -12px; }
    }
  `;

  return { widgetHTML, styles };
}

/**
 * Чатботты инициализациялау
 * DOM-ға қосылғаннан кейін шақырылуы керек
 */
export function initChatbot(topicContext = "") {
  const toggleBtn = document.getElementById("chatbot-toggle");
  const panel = document.getElementById("chatbot-panel");
  const closeBtn = document.getElementById("chatbot-close");
  const input = document.getElementById("chatbot-input");
  const sendBtn = document.getElementById("chatbot-send");
  const messagesDiv = document.getElementById("chatbot-messages");

  // Панельді ашу/жабу
  toggleBtn.addEventListener("click", () => {
    panel.classList.toggle("hidden");
    if (!panel.classList.contains("hidden")) {
      input.focus();
    }
  });
  closeBtn.addEventListener("click", () => panel.classList.add("hidden"));

  // Хабарлама жіберу
  async function sendMessage() {
    const message = input.value.trim();
    if (!message) return;

    // Оқушы хабарламасы
    appendMessage(message, "user");
    input.value = "";

    // Жазу анимациясы
    const typingEl = appendTyping();

    try {
      // AI-дан жауап алу
      const response = await askAI(message, topicContext);
      typingEl.remove();
      appendMessage(response, "bot");
    } catch (err) {
      typingEl.remove();
      appendMessage(
        "Кешіріңіз, қазір қосыла алмадым. Интернет байланысын тексеріңіз 🌐",
        "bot"
      );
    }

    messagesDiv.scrollTop = messagesDiv.scrollHeight;
  }

  sendBtn.addEventListener("click", sendMessage);
  input.addEventListener("keypress", (e) => {
    if (e.key === "Enter") sendMessage();
  });

  function appendMessage(text, type) {
    const msgDiv = document.createElement("div");
    msgDiv.className = `chatbot-message ${type}`;
    msgDiv.innerHTML = `<div class="message-bubble">${text.replace(/\n/g, "<br>")}</div>`;
    messagesDiv.appendChild(msgDiv);
    messagesDiv.scrollTop = messagesDiv.scrollHeight;
    return msgDiv;
  }

  function appendTyping() {
    const typingDiv = document.createElement("div");
    typingDiv.className = "chatbot-message bot";
    typingDiv.innerHTML = `
      <div class="message-typing">
        <div class="typing-dot"></div>
        <div class="typing-dot"></div>
        <div class="typing-dot"></div>
      </div>`;
    messagesDiv.appendChild(typingDiv);
    messagesDiv.scrollTop = messagesDiv.scrollHeight;
    return typingDiv;
  }
}
