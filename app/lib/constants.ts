export const PUTER_WORKER_URL = import.meta.env.VITE_PUTER_WORKER_URL || "";

// Storage Paths
export const STORAGE_PATHS = {
    ROOT: "roomify",
    SOURCES: "roomify/sources",
    RENDERS: "roomify/renders",
} as const;

// Timing Constants (in milliseconds)
export const SHARE_STATUS_RESET_DELAY_MS = 1500;
export const PROGRESS_INCREMENT = 15;
export const REDIRECT_DELAY_MS = 600;
export const PROGRESS_INTERVAL_MS = 100;
export const PROGRESS_STEP = 5;

// UI Constants
export const GRID_OVERLAY_SIZE = "60px 60px";
export const GRID_COLOR = "#3B82F6";

// HTTP Status Codes
export const UNAUTHORIZED_STATUSES = [401, 403];

// Image Dimensions
export const IMAGE_RENDER_DIMENSION = 1024;

export const ROOMIFY_RENDER_PROMPT = `
TASK: Convert the input 2D floor plan into a **photorealistic, flat, top‑down orthographic layout**.

STRICT REQUIREMENTS (do not violate):
1) **STRICTLY ORTHOGRAPHIC**: Perfect 2D top-down view. Absolutely NO perspective, NO camera tilt, and NO vanishing points. The walls must be perfectly vertical in the render, showing only their top surface and thickness as seen from directly above.
2) **REMOVE ALL TEXT**: Do not render any letters, numbers, labels, dimensions, or annotations. Floors must be continuous where text used to be.
3) **GEOMETRY MUST MATCH**: Walls, rooms, doors, and windows must follow the exact lines and positions in the plan. Do not shift or resize.
4) **CLEAN, REALISTIC OUTPUT**: Crisp edges, balanced lighting, and realistic materials. No sketch/hand‑drawn look.
5) **NO EXTRA CONTENT**: Do not add rooms, furniture, or objects that are not clearly indicated by the plan.

STRUCTURE & DETAILS:
- **Walls**: Rendered as if looking straight down. Consistent wall thickness, showing the top profile (e.g., clean white or grey top edges).
- **Doors**: Convert door swing arcs into open doors, aligned to the plan, viewed from above.
- **Windows**: Convert thin perimeter lines into realistic glass windows, viewed from above.

FURNITURE & ROOM MAPPING (only where icons/fixtures are clearly shown):
- Bed icon → realistic bed viewed from top.
- Sofa icon → modern sectional or sofa viewed from top.
- Dining table icon → table with chairs viewed from top.
- Kitchen icon → counters with sink and stove viewed from top.
- Bathroom icon → toilet, sink, and tub/shower viewed from top.
- Office/study icon → desk, chair, and minimal shelving viewed from top.
- Porch/patio/balcony icon → outdoor seating or simple furniture viewed from top.
- Utility/laundry icon → washer/dryer and minimal cabinetry viewed from top.

STYLE & LIGHTING:
- Lighting: bright, neutral daylight from above. High clarity and balanced contrast. Flat shadows.
- Materials: realistic wood/tile floors, clean walls.
- Finish: professional flat architectural plan; no text, no watermarks, no logos.
`.trim();