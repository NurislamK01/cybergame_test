# АКТ Оқу Платформасы — Орнату нұсқаулығы

## Жоба туралы

4-сынып «Цифрлық сауаттылық / АКТ» пәніне арналған интерактивті оқыту 
платформасы. Геймификация элементтері мен Жасанды Интеллект (Gemini AI) 
интеграциясымен жасалған.

**Магистрлік диссертация жобасы.**

---

## 📁 Файлдар құрылымы

```
akt4/
├── index.html          ← Басты бет (тақырыптар, прогресс)
├── auth.html           ← Кіру / Тіркелу беті
├── topic.html          ← Тақырып беті (4 блок)
├── profile.html        ← Оқушы профилі
├── firebase-config.js  ← Firebase конфигурация + DB функциялары
└── ai-helper.js        ← Gemini AI чатбот виджеті
```

---

## 🚀 Жылдам бастау (Demo режим)

Firebase немесе API кілті жоқ болса, **Demo режим** бар!

1. `akt4/auth.html` файлын браузерде ашыңыз
2. «🎮 Demo ретінде кіру» батырмасын басыңыз
3. Платформаны толық пайдаланыңыз!

---

## ⚙️ Firebase орнату (толыққанды жұмыс үшін)

### 1-қадам: Firebase жобасы жасаңыз

1. https://console.firebase.google.com сайтына кіріңіз
2. «Add project» → Жоба атауын жазыңыз
3. Authentication → Enable → Email/Password
4. Firestore Database → Create database → Production mode

### 2-қадам: Конфигурация деректерін алыңыз

```
Project Settings → Your apps → Web app → Firebase SDK snippet → Config
```

### 3-қадам: `firebase-config.js` файлын жаңартыңыз

```javascript
const firebaseConfig = {
  apiKey: "СІЗДІҢ_API_КІЛТІҢІЗ",
  authDomain: "сіздің-жоба.firebaseapp.com",
  projectId: "сіздің-жоба-id",
  storageBucket: "сіздің-жоба.appspot.com",
  messagingSenderId: "123456789",
  appId: "1:123456789:web:abc123"
};
```

### 4-қадам: Firestore қауіпсіздік ережелері

Firebase Console → Firestore → Rules бөліміне мынаны қойыңыз:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /users/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
    match /progress/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
    match /badges/{userId}/{document=**} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
  }
}
```

---

## 🤖 Gemini AI орнату

1. https://aistudio.google.com/app/apikey сайтына кіріңіз
2. «Create API Key» батырмасын басыңыз
3. `ai-helper.js` файлындағы мына жолды жаңартыңыз:

```javascript
const GEMINI_API_KEY = "СІЗДІҢ_GEMINI_API_КІЛТІҢІЗ";
```

---

## 🗄️ Дерекқор схемасы (Firestore)

```
users/{userId}
  ├── displayName: string        // Оқушы аты
  ├── email: string              // Email
  ├── grade: number              // 4 (4-сынып)
  ├── avatar: string             // '🦊', '🐼' т.б.
  ├── totalCoins: number         // Жалпы монета саны
  ├── level: number              // 1-8 аралығында деңгей
  ├── xp: number                 // Тәжірибе ұпайлары
  └── createdAt: timestamp

progress/{userId}
  ├── completedTopics: string[]  // Аяқталған тақырыптар
  ├── totalScore: number         // Жалпы ұпай
  ├── lastActivity: timestamp
  └── topics: {
        [topicId]: {
          quiz: number,
          match: number,
          dragdrop: number
        }
      }

badges/{userId}/earned/{badgeId}
  ├── badgeId: string
  ├── earnedAt: timestamp
  ├── title: string
  └── icon: string
```

---

## 📚 Платформа мазмұны

### 3-бөлім: Бейне жасау «Табиғи құбылыстар»

| ID | Тақырып | Стандарт |
|----|---------|----------|
| `video-creation` | Бейне жазба жасау | 4.2.4.1 |
| `video-editing` | Бейнені өңдеу | 4.2.4.2 |
| `mini-project` | «Табиғат қандай көркем!» жобасы | 4.2.4.3 |

### 4-бөлім: Презентациялар «Қоршаған ортаны қорғау»

| ID | Тақырып | Стандарт |
|----|---------|----------|
| `slide-layout` | Слайд макеті & Ақпарат іздеу | 4.3.1.1 |
| `browser-params` | Браузер параметрлері | 4.3.1.2 |
| `presentation-sound` | Презентациядағы дыбыстар | 4.3.2.1 |
| `presentation-video` | Презентациядағы бейне | 4.3.2.2 |
| `presentation-animation` | Презентациядағы анимация | 4.3.2.3 |

---

## 🎮 Геймификация жүйесі

### Монета (Coins) жүйесі

| Ойын | Монета |
|------|--------|
| Quiz (Викторина) | +1-15 монета |
| Match (Сәйкестендіру) | +1-12 монета |
| Drag & Drop | +1-15 монета |

### Деңгей (Level) жүйесі

| Деңгей | Атау | XP |
|--------|------|----|
| 1 | Жас зерттеуші | 0 |
| 2 | Сандық оқушы | 100 |
| 3 | АКТ шебері | 300 |
| 4 | Бейне жасаушы | 600 |
| 5 | Презентатор | 1000 |
| 6 | Цифрлық маман | 1500 |
| 7 | АКТ чемпионы | 2500 |
| 8 | Супер шебер | 4000 |

> 1 монета = 10 XP

### Жетістіктер (Badges)

| Badge | Шарт |
|-------|------|
| 🌟 Алғашқы қадам! | Бірінші викторина |
| 🎬 Бейне шебері | 3-бөлім аяқталды |
| 📊 Презентация шебері | 4-бөлім аяқталды |
| 💰 Ұпай жинаушы | 100 монета жиналды |
| 🏆 Жас маман | 5-деңгейге жетті |

---

## 🤖 Adaptive Learning логикасы

Gemini AI оқушының деңгейіне байланысты сұрақтар генерациялайды:

- **1-2 деңгей** → Оңай сұрақтар
- **3-5 деңгей** → Орташа сұрақтар  
- **6-8 деңгей** → Қиын сұрақтар

`ai-helper.js` ішінде `getAdaptiveQuestion(topicId, level)` функциясы 
Gemini арқылы динамикалық сұрақ жасайды.

---

## 🛠️ Технологиялық стек

| Қабат | Технология |
|-------|-----------|
| Frontend | HTML5, CSS3, Vanilla JavaScript (ES Modules) |
| Backend | Firebase (Firestore + Authentication) |
| AI | Google Gemini 1.5 Flash API |
| Fonts | Google Fonts (Nunito) |
| Icons | Unicode Emoji |

---

## 📖 Жаңа тақырып қосу

`topic.html` файлындағы `TOPICS_DATA` объектіне жаңа тақырып қосыңыз:

```javascript
'your-topic-id': {
  title: 'Тақырып атауы',
  icon: '🎯',
  tag: '5-бөлім • 4.4.1.1',
  desc: 'Қысқа сипаттама',
  color: 'linear-gradient(135deg, #..., #...)',
  theory: {
    title: 'Теория тақырыбы',
    content: `<p>HTML мазмұн...</p>`
  },
  slides: [
    { emoji: '🎯', title: 'Слайд тақырыбы', body: 'Слайд мазмұны' },
  ],
  videos: [
    { title: 'Бейне атауы', desc: 'Сипаттама', youtubeId: 'YOUTUBE_ID' }
  ],
  quiz: [
    { q: 'Сұрақ?', opts: ['A','B','C','D'], correct: 0, exp: 'Түсінік' }
  ],
  match: {
    lefts: ['Сол 1', 'Сол 2'],
    rights: ['Оң 1', 'Оң 2'],
    pairs: [0, 1]
  },
  dragdrop: {
    items: ['Элемент 1', 'Элемент 2'],
    zones: ['Аймақ 1', 'Аймақ 2'],
    answers: [0, 1]
  }
}
```

`index.html` файлындағы `TOPICS` массивіне де қосыңыз:

```javascript
{
  id: 'your-topic-id',
  icon: '🎯',
  section: '5-бөлім',
  color: 'blue',
  title: 'Тақырып атауы',
  desc: 'Сипаттама',
  coins: 20,
}
```
