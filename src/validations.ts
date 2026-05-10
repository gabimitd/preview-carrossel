export function sanitizeUsername(input: string): string {
  let s = input.trim().replace(/\s+/g, "");
  if (s.startsWith("@")) s = s.slice(1);
  if (s.length > 30) s = s.slice(0, 30);
  return s;
}

export function clamp(s: string, max: number): string {
  return s.length > max ? s.slice(0, max) : s;
}

export function formatTimeAgoOrPassthrough(input: string): string {
  const t = input.trim();
  return t.length === 0 ? "Agora" : t;
}
