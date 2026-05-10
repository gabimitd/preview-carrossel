import type { Profile, PostContent, Slide, ThemeState } from "./types";
import { escapeHtml } from "./ig-frame-mobile";

export function renderDesktopFrame(opts: {
  profile: Profile | null;
  slides: Slide[];
  activeSlide: number;
  post: PostContent;
  theme: ThemeState;
}): string {
  const p = opts.profile;
  const dots = opts.slides
    .map((_, i) => `<span class="${i === opts.activeSlide ? "on" : ""}"></span>`)
    .join("");
  const captionUser = p?.username ?? "";

  const visibleComments = opts.post.visibleComments
    .map(
      (c) =>
        `<div class="row"><b>${escapeHtml(c.user)}</b> ${escapeHtml(c.text)}</div>`,
    )
    .join("");
  const moreLink =
    opts.post.commentsCount && opts.post.commentsCount !== "0"
      ? `<div class="more">Ver todos os ${escapeHtml(opts.post.commentsCount)} comentários</div>`
      : "";

  const trackHTML =
    opts.slides.length > 0
      ? `<div class="track" style="transform: translateX(-${opts.activeSlide * 100}%);">
           ${opts.slides
             .map((s) => `<div class="slide"><img src="${s.dataUrl}" alt="" /></div>`)
             .join("")}
         </div>`
      : "";

  return `
    <div class="ig" data-ig-theme="${opts.theme.igFrame}" data-ig-device="desktop">
      <div class="image-wrap">
        ${trackHTML}
        ${
          opts.slides.length > 1
            ? `<div class="nav">${opts.activeSlide + 1}/${opts.slides.length}</div>
               <div class="dots">${dots}</div>`
            : ""
        }
      </div>
      <div class="side">
        <div class="hdr">
          <div class="av"><img src="${p?.avatarDataUrl ?? ""}" alt="" /></div>
          <div>
            <div class="uname">
              ${escapeHtml(p?.username ?? "")}${
                p?.verified ? '<span class="verif">✓</span>' : ""
              }
            </div>
            <div class="meta">${
              opts.post.sponsored ? "Patrocinado" : escapeHtml(opts.post.location)
            }</div>
          </div>
        </div>
        <div class="comments" style="flex:1; overflow:auto; padding-top:10px">
          <div class="row"><b>${escapeHtml(captionUser)}</b> ${escapeHtml(opts.post.caption)}</div>
          ${visibleComments}
          ${moreLink}
        </div>
        <div class="actions"><span>♡</span><span>💬</span><span>➤</span><span class="save">🔖</span></div>
        <div class="likes">${escapeHtml(opts.post.likes)} curtidas</div>
        <div class="date">${escapeHtml(opts.post.timeAgo)}</div>
      </div>
    </div>
  `;
}
