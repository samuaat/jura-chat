const STORAGE_KEY = "jura_anonymous_uid";

export function getAnonymousUserId(): string {
  if (typeof window === "undefined") return "";

  let uid = localStorage.getItem(STORAGE_KEY);
  if (!uid) {
    uid = crypto.randomUUID();
    localStorage.setItem(STORAGE_KEY, uid);
  }
  return uid;
}
