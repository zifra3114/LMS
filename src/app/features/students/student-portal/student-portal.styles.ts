/** Student portal ke pages ki shared styling. */
export const PAGE_STYLES = `
  :host { display: block; color: #0f172a; }
  * { box-sizing: border-box; }

  .page-head { margin-bottom: 22px; }
  .page-head .kicker { display: inline-block; color: #1d4ed8; font-size: 10px; font-weight: 900; letter-spacing: .19em; text-transform: uppercase; }
  .page-head h1 { margin: 8px 0 6px; font-size: clamp(24px, 3vw, 32px); line-height: 1.15; font-weight: 950; letter-spacing: -.045em; color: #020617; }
  .page-head p { margin: 0; color: #64748b; font-size: 13px; line-height: 1.7; }

  .panel { border: 1px solid #e2e8f0; border-radius: 18px; background: #fff; padding: 20px; box-shadow: 0 2px 4px rgb(15 23 42 / 4%); min-width: 0; }
  .panel h2 { margin: 0 0 14px; font-size: 14px; font-weight: 900; color: #020617; }

  .cards { display: grid; grid-template-columns: repeat(auto-fill, minmax(290px, 1fr)); gap: 16px; }
  .item { display: flex; flex-direction: column; gap: 10px; border: 1px solid #e2e8f0; border-radius: 16px; background: #fff; padding: 18px; box-shadow: 0 2px 4px rgb(15 23 42 / 4%); transition: border-color .18s ease, box-shadow .18s ease, transform .18s ease; min-width: 0; }
  .item:hover { border-color: #93c5fd; box-shadow: 0 10px 24px rgb(15 23 42 / 8%); transform: translateY(-1px); }
  .item h3 { margin: 0; font-size: 14px; line-height: 1.4; font-weight: 900; color: #020617; overflow-wrap: anywhere; }
  .item .body { margin: 0; color: #64748b; font-size: 12px; line-height: 1.75; overflow-wrap: anywhere; display: -webkit-box; -webkit-line-clamp: 4; -webkit-box-orient: vertical; overflow: hidden; }
  .item .date { color: #94a3b8; font-size: 10.5px; font-weight: 700; }
  .chips { display: flex; flex-wrap: wrap; gap: 7px; }
  .chip { display: inline-flex; gap: 5px; align-items: center; padding: 5px 9px; border: 1px solid #dbeafe; border-radius: 8px; background: #eff6ff; color: #1d4ed8; font-size: 10px; font-weight: 800; }
  .chip b { color: #64748b; font-weight: 700; }
  .open-btn { align-self: flex-start; display: inline-flex; align-items: center; gap: 6px; padding: 9px 13px; border-radius: 10px; background: #020617; color: #fff; font-size: 11px; font-weight: 800; text-decoration: none; transition: background .2s ease; }
  .open-btn:hover { background: #1d4ed8; }

  .state { display: flex; flex-direction: column; align-items: center; gap: 8px; padding: 46px 20px; border: 1px dashed #cbd5e1; border-radius: 18px; background: #fff; text-align: center; color: #64748b; font-size: 12.5px; line-height: 1.7; }
  .state strong { color: #0f172a; font-size: 14px; }
  .state.error { border-color: #fecdd3; background: #fff1f2; color: #be123c; }
  .state.error strong { color: #9f1239; }
  .spinner { display: inline-block; width: 22px; height: 22px; border: 3px solid #2563eb; border-top-color: transparent; border-radius: 50%; animation: spin .8s linear infinite; }
  @keyframes spin { to { transform: rotate(360deg); } }

  @media (prefers-reduced-motion: reduce) {
    *, *::before, *::after { animation-duration: .01ms !important; transition-duration: .01ms !important; }
  }
`;