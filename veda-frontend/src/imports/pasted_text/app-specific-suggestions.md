secondary application specific suggestions

## 1. WebSocket / polling for long operations

The two heavy operations — question paper processing and grading — can take 15-30 seconds. The frontend needs to know when they're done:

```
Add to the frontend prompt:

Processing states use polling. After calling:
- POST /exams/:id/question-paper
- POST /exams/:examId/answer-sheets/:id/grade

Poll GET /exams/:id every 2 seconds until exam.status changes from
'processing' to 'ready', or answerSheet.status changes from
'processing' to 'graded'. Stop polling on error or success.
Show a progress indicator during this time.

The upload screen's "Start Mapping" button should be disabled
and show a spinner while status === 'processing'.
```

---

## 2. Error states for every endpoint

Currently the doc only shows success shapes. Add:

```
Error handling:

400 Bad Request — validation failed, file too large, blank document
401 Unauthorized — missing or expired JWT, redirect to login
404 Not Found — exam/sheet/region not found
500 Internal Server Error — Azure or DeepSeek failure

For 500 errors on grading, show:
"AI grading failed for some questions. You can manually assign marks."
and still render whatever partial grades were saved.

For extraction failures (blank page, unreadable scan):
Show an inline error on the upload card:
"Could not read this file. Ensure it is not blank or password-protected."
```

---

## 3. Token storage and auth flow

```
Auth flow:

On login/register: store JWT in localStorage as 'vedaai_token'.
On every API request: read from localStorage and attach as
  Authorization: Bearer <token>

On 401 response: clear localStorage, redirect to /login.
Token expiry: 7 days. No refresh token — just re-login.

On app load: if no token in localStorage → redirect to /login.
If token exists → fetch GET /exams to verify it's still valid.
```

---

## 4. File upload constraints

```
File upload rules (enforce on frontend before sending):
- Accepted types: application/pdf, image/png, image/jpeg, image/jpg
- Max size: 10MB per file
- Show file name and size preview after selection
- Show error inline on the upload card if type or size is wrong
  before attempting the API call
- Both question paper and answer sheet must be selected before
  "Start Mapping" button becomes active
```

---

## 5. Question panel interaction states

This is the core UI from your Figma — the left panel needs more spec:

```
Question panel states per question card:

DEFAULT (no selection):
  - Show displayId badge (grey)
  - Show question text (truncated to 2 lines)
  - Show marks badge: "X/Y" in green if full marks,
    orange if partial, red if zero, grey if not attempted

SELECTED (teacher clicked):
  - Card gets orange border (as per Figma)
  - Right panel scrolls to and highlights answer region
  - If isUnmatched or no answerRegion → show "No answer found" banner
    in right panel, no highlight drawn

EXPANDED (chevron clicked, independent of selection):
  - Shows AI feedback text below question
  - Shows marks input field (pre-filled with marksAwarded or teacherOverride)
  - Input is editable — on blur or Enter calls
    PATCH /grades/:gradeId with { marksAwarded: newValue }
  - Validate: must be between 0 and maxMarks, numeric only

UNMATCHED ANSWER SECTION:
  - Below the main question list, a collapsible section
    "Unmatched Answers (N)" for answerRegions where isUnmatched === true
  - Each item shows the extracted text preview
  - Clicking highlights the region on the right panel
  - A dropdown lets teacher pick which question to assign it to
    → calls PATCH /regions/:regionId/assign { questionId }
  - On success the region moves out of unmatched and into the question's card
```

---

## 6. Summary panel

The Figma had a grading summary — spec it out:

```
Summary panel (shown after grading completes):

Rendered below the question list or in a separate tab.
Data source: summary object from GET /answer-sheets/:id

Display:
  - Circular score gauge: totalScore / maxScore (percentage)
  - Overall feedback paragraph
  - Strengths: green checkmark list
  - Improvements: amber warning list

Score badge colour rules:
  - percentage >= 75 → green
  - percentage >= 40 → amber
  - percentage < 40  → red
```

---

## 7. Page image rendering edge cases

```
Right panel edge cases:

BEFORE grading (status === 'mapped'):
  - Render page images and highlight answer regions
  - No grade badges yet
  - Show "Grade this sheet" CTA button at top

AFTER grading (status === 'graded'):
  - Same highlights but with coloured borders:
    green border → isCorrect true
    orange border → partial (marksAwarded > 0 but < maxMarks)
    red border → marksAwarded === 0 and attempted
  - Small badge at top-left of each highlight showing "X/Y"

PAGE IMAGES LOADING:
  - Each <img> should show a skeleton loader until onLoad fires
  - If an image 404s (blob deleted), show a grey placeholder
    with text "Page unavailable"

ZOOM:
  - Zoom slider controls a CSS scale on the page container
  - Range: 50% to 150%, default 100%
  - Both image and canvas scale together, no redraw needed
```

---

## 8. Classroom and exam list screens

These screens exist in the sidebar nav (Home, My Classroom, Assignments, Exams) but were never specced for the frontend:

```
/exams route (Exams list screen):
  Data: GET /exams
  Display each exam as a card:
    - title, subject, classroom name, status badge, createdAt
    - Click → go to exam detail or upload screen depending on status:
        status === 'draft'   → show upload screen
        status === 'ready'   → show answer sheet upload
        status === 'graded'  → show split view

/classrooms route (My Classroom screen):
  Data: GET /classrooms
  Display each classroom:
    - name, standard, subject
    - studentCount, examCount
    - Click → GET /classrooms/:id → show students list and exams list
```

---

## 9. One thing to remove from the current doc

The CSS highlighting approach in the current doc uses a `div` overlay with percentage-based `left/top/width/height`. That works but conflicts with what we specced earlier in this conversation — we agreed on a **canvas overlay** approach because:

- Canvas handles zoom scaling automatically with the image
- Multiple overlapping regions are cleaner to draw and clear
- The orange label tab (Q2 badge) at the top of the highlight is easier on canvas

Add this correction:

```
IMPORTANT — Override the highlight CSS approach in the doc:

Do NOT use absolute-positioned divs for highlights.
Use a <canvas> overlay instead:

- Each page: <div style="position:relative"> wrapping <img> + <canvas>
- Canvas internal resolution = img.naturalWidth × img.naturalHeight
- Canvas CSS: position:absolute, top:0, left:0, width:100%, height:100%,
  pointer-events:none
- On question select: clearRect entire canvas, then drawRect using
  boundingBox values multiplied by canvas.width / canvas.height
- Border: 2.5px solid #F97316 (orange), fill: rgba(249,115,22,0.12)
- Draw a small filled rect above the box as a label tab showing displayId
- On zoom: parent container width changes, canvas CSS scales with it,
  no redraw needed
```