/**
 * Reference imagery pulled from the WishDem design mockups
 * (Designs/*.html data-asset-id attributes). Centralised here so pages
 * reference one source instead of inlining CDN URLs.
 */
export const ASSETS = {
  homeHeroGift: {
    src: "https://skyagent-artifacts.skywork.ai/router/agent/2026-07-31/prod_agent_019fb49f-bdb6-7761-829d-d7971888d766/asset_44045a101d8e3a8d_8bb8bb7710ca48469128b665448cbf11.png",
    alt: "A sealed plum envelope prepared as a future gift",
  },
  createThemeVelvet: {
    src: "https://skyagent-artifacts.skywork.ai/router/agent/2026-07-31/prod_agent_019fb49f-bdb6-7761-829d-d7971888d766/asset_4a53e0c51c8c2865_7e1d641fa3314b44adaa588f7f203ed9.png",
    alt: "Velvet Night reveal theme",
  },
  paymentSealedLetter: {
    src: "https://skyagent-artifacts.skywork.ai/router/agent/2026-07-31/prod_agent_019fb49f-bdb6-7761-829d-d7971888d766/asset_3d1d06b0a05419dd_99fd66fd00ec4469a29a31269dccb834.png",
    alt: "A sealed plum envelope",
  },
  scheduledGift: {
    src: "https://skyagent-artifacts.skywork.ai/router/agent/2026-07-31/prod_agent_019fb49f-bdb6-7761-829d-d7971888d766/asset_a2817abf8c47e5ec_37e6ab1cfdfb460e9c694f734f192e40.png",
    alt: "A sealed future gift",
  },
  revealVelvetEnvelope: {
    src: "https://skyagent-artifacts.skywork.ai/router/agent/2026-07-31/prod_agent_019fb49f-bdb6-7761-829d-d7971888d766/asset_ff01d53063d642b2_b36d7f4ef4d34398955bb1539f6e1547.png",
    alt: "A sealed Velvet Night envelope",
  },
} as const;
