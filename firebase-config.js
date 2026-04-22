// =============================================
// Firebase конфигурациясы және негізгі функциялар
// Мұнда өзіңіздің Firebase жобаңыздың деректерін енгізіңіз
// =============================================

import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";
import {
  getAuth,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  updateProfile,
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";
import {
  getFirestore,
  doc,
  setDoc,
  getDoc,
  updateDoc,
  increment,
  arrayUnion,
  serverTimestamp,
  collection,
  query,
  where,
  getDocs,
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

// =============================================
// ⚠️ МАҢЫЗДЫ: Мына деректерді Firebase Console-дан алыңыз
// https://console.firebase.google.com → Project Settings → Your apps
// =============================================
const firebaseConfig = {
  apiKey: "AIzaSyDEMO_REPLACE_WITH_YOUR_KEY",
  authDomain: "your-project.firebaseapp.com",
  projectId: "your-project-id",
  storageBucket: "your-project.appspot.com",
  messagingSenderId: "123456789",
  appId: "1:123456789:web:abcdef123456",
};

// Firebase инициализациясы
const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);

// =============================================
// AUTH ФУНКЦИЯЛАРЫ
// =============================================

/**
 * Жаңа оқушы тіркеу
 * @param {string} email
 * @param {string} password
 * @param {string} displayName - Оқушының аты
 */
export async function registerStudent(email, password, displayName) {
  const userCredential = await createUserWithEmailAndPassword(
    auth,
    email,
    password
  );
  const user = userCredential.user;

  // Профильді жаңарту
  await updateProfile(user, { displayName });

  // Firestore-да пайдаланушы профилін жасау
  await setDoc(doc(db, "users", user.uid), {
    displayName,
    email,
    grade: 4,
    avatar: "🦊", // Әдепкі аватар
    totalCoins: 0,
    level: 1,
    xp: 0,
    createdAt: serverTimestamp(),
  });

  // Прогресс коллекциясын инициализациялау
  await setDoc(doc(db, "progress", user.uid), {
    completedTopics: [],
    totalScore: 0,
    lastActivity: serverTimestamp(),
  });

  return user;
}

/**
 * Жүйеге кіру
 */
export async function loginStudent(email, password) {
  const userCredential = await signInWithEmailAndPassword(
    auth,
    email,
    password
  );
  return userCredential.user;
}

/**
 * Жүйеден шығу
 */
export async function logoutStudent() {
  await signOut(auth);
}

// =============================================
// ПАЙДАЛАНУШЫ ДЕРЕКТЕРІ
// =============================================

/**
 * Оқушы профилін оқу
 */
export async function getUserProfile(uid) {
  const docRef = doc(db, "users", uid);
  const docSnap = await getDoc(docRef);
  if (docSnap.exists()) {
    return { id: docSnap.id, ...docSnap.data() };
  }
  return null;
}

/**
 * Оқушы прогресін оқу
 */
export async function getUserProgress(uid) {
  const docRef = doc(db, "progress", uid);
  const docSnap = await getDoc(docRef);
  if (docSnap.exists()) {
    return docSnap.data();
  }
  return { completedTopics: [], totalScore: 0 };
}

// =============================================
// ҰПАЙ ЖӘНЕ ГЕЙМИФИКАЦИЯ ФУНКЦИЯЛАРЫ
// =============================================

/**
 * Оқушыға ұпай (coins) қосу
 * @param {string} uid - Оқушы ID
 * @param {number} coins - Қосылатын ұпай саны
 * @param {string} topicId - Тақырып ID
 * @param {string} gameType - Ойын түрі (quiz, match, dragdrop)
 * @param {number} score - Ойын нәтижесі
 */
export async function addCoins(uid, coins, topicId, gameType, score) {
  const userRef = doc(db, "users", uid);
  const progressRef = doc(db, "progress", uid);

  // XP есептеу (1 coin = 10 XP)
  const xpGained = coins * 10;

  // Ұпайларды жаңарту
  await updateDoc(userRef, {
    totalCoins: increment(coins),
    xp: increment(xpGained),
  });

  // Прогресті жаңарту
  await updateDoc(progressRef, {
    totalScore: increment(score),
    lastActivity: serverTimestamp(),
    [`topics.${topicId}.${gameType}`]: score,
  });

  // Деңгейді тексеру
  const profile = await getUserProfile(uid);
  const newLevel = calculateLevel(profile.xp + xpGained);
  if (newLevel > profile.level) {
    await updateDoc(userRef, { level: newLevel });
    await checkAndAwardBadges(uid, newLevel, topicId);
    return { coinsAdded: coins, levelUp: true, newLevel };
  }

  return { coinsAdded: coins, levelUp: false };
}

/**
 * Тақырыпты аяқталды деп белгілеу
 */
export async function markTopicCompleted(uid, topicId) {
  const progressRef = doc(db, "progress", uid);
  await updateDoc(progressRef, {
    completedTopics: arrayUnion(topicId),
    lastActivity: serverTimestamp(),
  });

  // Тақырып аяқталған badge тексеру
  await checkAndAwardBadges(uid, null, topicId);
}

// =============================================
// ДЕҢГЕЙ ЖҮЙЕСІ
// =============================================

/**
 * XP бойынша деңгейді есептеу
 */
export function calculateLevel(xp) {
  if (xp < 100) return 1;
  if (xp < 300) return 2;
  if (xp < 600) return 3;
  if (xp < 1000) return 4;
  if (xp < 1500) return 5;
  if (xp < 2500) return 6;
  if (xp < 4000) return 7;
  return 8; // Максималды деңгей
}

/**
 * XP прогресс пайызы (келесі деңгейге дейін)
 */
export function getLevelProgress(xp) {
  const thresholds = [0, 100, 300, 600, 1000, 1500, 2500, 4000, 9999];
  const level = calculateLevel(xp);
  const current = thresholds[level - 1];
  const next = thresholds[level];
  return Math.round(((xp - current) / (next - current)) * 100);
}

// =============================================
// ЖЕТІСТІКТЕР (BADGES)
// =============================================

export const BADGES = {
  first_quiz: {
    id: "first_quiz",
    title: "Алғашқы қадам!",
    description: "Бірінші викторинаны аяқтадың",
    icon: "🌟",
    color: "#F59E0B",
  },
  video_master: {
    id: "video_master",
    title: "Бейне шебері",
    description: "Бейне тақырыптарын аяқтадың",
    icon: "🎬",
    color: "#8B5CF6",
  },
  presentation_pro: {
    id: "presentation_pro",
    title: "Презентация шебері",
    description: "Презентация тақырыптарын аяқтадың",
    icon: "📊",
    color: "#3B82F6",
  },
  coin_collector: {
    id: "coin_collector",
    title: "Ұпай жинаушы",
    description: "100 ұпай жиnadың",
    icon: "💰",
    color: "#10B981",
  },
  level_5: {
    id: "level_5",
    title: "Жас маман",
    description: "5-деңгейге жеттің!",
    icon: "🏆",
    color: "#EF4444",
  },
};

/**
 * Badge берілетінін тексеру және беру
 */
export async function checkAndAwardBadges(uid, level, topicId) {
  const profile = await getUserProfile(uid);
  const progress = await getUserProgress(uid);
  const earnedBadges = await getEarnedBadges(uid);
  const earnedIds = earnedBadges.map((b) => b.badgeId);

  const newBadges = [];

  // Деңгей 5-ке жеткен badge
  if (level >= 5 && !earnedIds.includes("level_5")) {
    await awardBadge(uid, "level_5");
    newBadges.push(BADGES["level_5"]);
  }

  // 100 ұпай жинаған badge
  if (profile.totalCoins >= 100 && !earnedIds.includes("coin_collector")) {
    await awardBadge(uid, "coin_collector");
    newBadges.push(BADGES["coin_collector"]);
  }

  // Бейне тақырыптарын аяқтаған
  const videoTopics = ["video-creation", "video-editing", "mini-project"];
  if (
    videoTopics.every((t) => progress.completedTopics?.includes(t)) &&
    !earnedIds.includes("video_master")
  ) {
    await awardBadge(uid, "video_master");
    newBadges.push(BADGES["video_master"]);
  }

  return newBadges;
}

/**
 * Badge беру
 */
async function awardBadge(uid, badgeId) {
  const badgeRef = doc(db, "badges", uid, "earned", badgeId);
  await setDoc(badgeRef, {
    badgeId,
    earnedAt: serverTimestamp(),
    ...BADGES[badgeId],
  });
}

/**
 * Оқушының жетістіктерін алу
 */
export async function getEarnedBadges(uid) {
  const badgesRef = collection(db, "badges", uid, "earned");
  const snapshot = await getDocs(badgesRef);
  return snapshot.docs.map((d) => d.data());
}

// =============================================
// AUTH STATE LISTENER (глобальды)
// =============================================
export function onAuthChange(callback) {
  return onAuthStateChanged(auth, callback);
}
