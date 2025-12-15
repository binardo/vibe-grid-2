#Visual Design Specification: Generative Grid

##1. The Material Language ("Digital Glass")Adhering to **Material Honesty**, we are treating "Glass" as our primary interface material. It provides context (seeing what is behind) and hierarchy (depth through blur) without clutter.

* **Base Layer (The Desk):**
* **Appearance:** A subtle, organic gradient background (warm beige to cool white) to emulate natural light. It should never be a flat hex code.
* **Behavior:** Static, anchoring the space.


* **Glass Layer (The Interface):**
* **Fill:** `rgba(255, 255, 255, 0.65)` (65% opacity white).
* **Backdrop Filter:** `blur(20px)` to `blur(40px)`. This creates the "frosted" look.
* **Border:** A 1px inside border of `rgba(255, 255, 255, 0.4)` to catch the "light" on the edges.
* **Shadow:** Large, soft, diffused shadows (`0px 8px 32px rgba(0, 0, 0, 0.08)`) to lift the glass off the background.



##2. Typography & Layout* **Typeface:** **Inter** or **San Francisco** (System UI).
* *Why:* Matches "Simplicity Through Reduction." It is invisible to the user, letting content dominate.


* **Hierarchy:**
* **Page Titles:** 24px-28px, Semibold, Tight tracking (-0.5px).
* **Grid Headers:** 14px, Medium, Uppercase, Tracking (1px) for readability.
* **Body/Prompt Text:** 15px or 16px, Regular. Line-height 1.6 (Breathing Room).
* **Metadata (SEDOL, Dates):** 12px, Regular, 60% opacity (Secondary information).


* **Spacing:**
* **Grid:** Adhere to a 4px/8px baseline grid.
* **Padding:** Generous. Cells should have at least 24px padding to allow text to "breathe" and not feel like a spreadsheet.



##3. Component Design & States###A. The Grid Library Cards* **Shape:** rounded-xl (16px radius).
* **Interaction (Hover):**
* Scale up slightly (1.01x).
* Shadow deepens and becomes slightly more opaque.
* **Why:** "Visual Affordance" – it invites the click.


* **The "..." Menu:**
* Appears on hover (Progressive Disclosure).
* When clicked, the dropdown should feel like a "floating shard" of glass—higher opacity (`0.9`) and higher blur (`40px`) to ensure legibility over the content below.



###B. The Main Grid View* **Frozen Headers:**
* Must have a stronger `backdrop-filter: blur(30px)` and slightly higher opacity (`0.85`) than standard cells so scrolling content "disappears" smoothly behind them.


* **Cells:**
* **Default:** Transparent or very low opacity white.
* **Streaming:** A subtle "active" pulse or faint blue gradient background `linear-gradient(180deg, rgba(56,189,248,0.1) 0%, transparent 100%)`.
* **Loading:** Use a custom "ring" spinner (as shown in mockups) in the bottom right. *Do not use system spinners.*


* **Search/Input Bar:**
* **State:** Floats above the content.
* **Focus:** When active, the border glows blue (`rgba(56, 189, 248, 0.5)`) and the shadow tightens to make it feel "closer" to the user.



###C. The Edit Prompt Modal (Hero Interaction)* **The Backdrop:**
* When the modal opens, the grid behind it must recede. Apply a `blur(8px)` and `scale(0.98)` to the *background grid container*. This pushes the context away and pulls focus to the modal.


* **The Pills (Dynamic Content):**
* **Look:** Small capsules, light blue background `rgba(56, 189, 248, 0.15)`, text `blue-600`.
* **Interaction:** When hovered, cursor changes to `grab`. When dragged, they pop up slightly (shadow increases) to simulate lifting physical tokens.


* **Text Area:**
* No visible borders. The text sits directly on the "glass." Focus is indicated by the cursor and a subtle darkening of the text color.



##4. Color Palette (Sophisticated & Intentional)Restricted palette to ensure content stands out.

| Role | Color | Hex/RGBA | Usage |
| --- | --- | --- | --- |
| **Surface** | **Glass White** | `rgba(255,255,255,0.65)` | Cards, Modals, Headers |
| **Primary** | **Electric Blue** | `#3B82F6` | Buttons, Active Toggles, Focus Rings |
| **Text** | **Ink Black** | `#1E293B` | Primary Text |
| **Text** | **Slate** | `#64748B` | Secondary Text, Labels |
| **Status** | **Purple** | `#8B5CF6` | Queued / Waiting dependencies |
| **Status** | **Blue** | `#3B82F6` | Streaming / Processing |

##5. Animation & Micro-InteractionsAdhering to **"Natural Physics"** and **"Purposeful Animation"**.

1. **Modal Entrance (Spring Physics):**
* Do not just fade in. The modal should "spring" up from the center, starting at 90% scale and expanding to 100% with a slight overshoot and settle. This gives it **mass**.
* *Duration:* ~400ms.


2. **Row Addition:**
* When a new company is added, the row should displace existing rows downwards (smooth height expansion) and then the content should fade in.
* *Why:* "Perceived Continuity" – users see where the new item fits physically.


3. **Streaming Text (The "Ghost in the Machine"):**
* Text should not appear character-by-character (too robotic).
* Use a "Soft Reveal": Words appear in chunks of 3-4, with a quick opacity fade (0 to 1) and a tiny Y-axis slide (2px up). This feels like the thought is "forming."


4. **Drag & Drop (Pills):**
* **Lift:** When a pill is grabbed, scale it to 1.05x and add a shadow.
* **Snap:** When released, it should "snap" into the text slot with a high-tension spring animation (fast, elastic).


5. **Hover States:**
* Use `transition: all 0.2s ease-out`. Buttons shouldn't just change color; they should subtly lift (transform-y: -1px).



##6. Specific "Obsessive Details"* **The "Glow" Effect:** On the "New Grid" and "Save Configuration" buttons, add a subtle inner shadow `inset 0 1px 0 rgba(255,255,255,0.4)` to the top edge. This makes the button feel like it has a physical beveled edge catching the light.
* **Blur Consistency:** Ensure the "Search Dropdown" blur matches the "Edit Modal" blur. Inconsistent glass refraction breaks the illusion of a unified material.
* **Empty States:** If a grid is empty, do not show blank lines. Show a beautiful, centered illustration (ghostly/glassy wireframe) encouraging the first search.
* **Scrollbars:** Custom scrollbars are mandatory. Thin, translucent pills that hover over the content, not thick gray browser bars.

This design system ensures your Generative Grid tool feels not like a database, but like a modern, fluid workspace for thought. There are attached screen mockups to see what the aim is.