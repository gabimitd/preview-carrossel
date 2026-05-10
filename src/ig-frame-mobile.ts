import type { Profile, PostContent, Slide, ThemeState } from "./types";

export function renderMobileFrame(opts: {
  profile: Profile | null;
  slides: Slide[];
  activeSlide: number;
  post: PostContent;
  theme: ThemeState;
}): string {
  const p = opts.profile;
  const slide = opts.slides[opts.activeSlide];
  const captionUser = p?.username ?? "";
  const dots = opts.slides
    .map((_, i) => `<span class="${i === opts.activeSlide ? "on" : ""}"></span>`)
    .join("");

  return `
    <div class="ig" data-ig-theme="${opts.theme.igFrame}" data-ig-device="mobile">
      <div class="hdr">
        <div class="av">
          <img src="${p?.avatarDataUrl ?? ""}" alt="" />
        </div>
        <div>
          <div class="uname">
            ${escapeHtml(p?.username ?? "")}${
              p?.verified ? '<span class="verif">✓</span>' : ""
            }
          </div>
          <div class="meta">
            ${opts.post.sponsored ? "Patrocinado" : escapeHtml(opts.post.location)}
          </div>
        </div>
      </div>
      <div class="image-wrap">
        ${slide ? `<img src="${slide.dataUrl}" alt="" />` : ""}
        ${
          opts.slides.length > 1
            ? `<div class="nav">${opts.activeSlide + 1}/${opts.slides.length}</div>
               <div class="dots">${dots}</div>`
            : ""
        }
      </div>
      <div class="actions">
        <span>♡</span><span>💬</span><span>➤</span>
        <span class="save">🔖</span>
      </div>
      <div class="likes">${escapeHtml(opts.post.likes)} curtidas</div>
      <div class="cap"><b>${escapeHtml(captionUser)}</b> ${escapeHtml(opts.post.caption)}</div>
      ${renderComments(opts.post)}
      <div class="date">${escapeHtml(opts.post.timeAgo)}</div>
    </div>
  `;
}

function renderComments(post: PostContent): string {
  const visible = post.visibleComments
    .map(
      (c) =>
        `<div class="row"><b>${escapeHtml(c.user)}</b> ${escapeHtml(c.text)}</div>`,
    )
    .join("");
  const more =
    post.commentsCount && post.commentsCount !== "0"
      ? `<div class="more">Ver todos os ${escapeHtml(post.commentsCount)} comentários</div>`
      : "";
  if (!visible && !more) return "";
  return `<div class="comments">${more}${visible}</div>`;
}

export function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}
