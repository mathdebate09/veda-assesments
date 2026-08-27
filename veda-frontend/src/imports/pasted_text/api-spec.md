### Global Configurations
- **Base URL**: `http://localhost:3000/api/v1`
- **Auth Header**: `Authorization: Bearer <JWT_TOKEN>`
- **Response Format**: All successful responses return `{ success: true, data: { ... } }`. Errors return `{ success: false, statusCode: 4xx/5xx, message: string }`.

---

## 1. Authentication

### `POST /auth/register`
Creates teacher user and institute.
- **Request Body**:
  ```json
  {
    "name": "Prof. Alan Turing",
    "email": "teacher@vedaschool.edu",
    "password": "Password@123",
    "instituteName": "Veda Institute of Technology",
    "instituteLocation": "Cambridge, MA"
  }
  ```
- **Response (`data`)**:
  ```json
  {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI...",
    "user": {
      "id": "64f1a2b3c4d5e6f7a8b9c0d1",
      "name": "Prof. Alan Turing",
      "email": "teacher@vedaschool.edu",
      "role": "teacher",
      "institute": {
        "id": "64f1a2b3c4d5e6f7a8b9c0d0",
        "name": "Veda Institute of Technology",
        "location": "Cambridge, MA"
      }
    }
  }
  ```

### `POST /auth/login`
- **Request Body**:
  ```json
  {
    "email": "teacher@vedaschool.edu",
    "password": "Password@123"
  }
  ```
- **Response (`data`)**: Same format as register (`token`, `user`).

---

## 2. Exams & Question Paper Extraction

### `POST /exams`
Creates a draft exam.
- **Request Body**:
  ```json
  {
    "title": "Class 10 Biology Midterm",
    "subject": "Biology",
    "totalMarks": 50,
    "classroomId": "optional_classroom_id"
  }
  ```
- **Response (`data`)**: Exam object with status `"draft"`.

### `GET /exams`
Fetches all exams created by the authenticated teacher.
- **Response (`data`)**: Array of Exam objects.

### `GET /exams/:id`
Fetches an exam with its populated questions and classroom.
- **Response (`data`)**: Exam object + `questions: Question[]`.

### `POST /exams/:id/question-paper`
Uploads question paper (PDF or Image), auto-extracts classroom header & questions, rasterises pages, and sets status to `"ready"`.
- **Content-Type**: `multipart/form-data`
- **Body Form Fields**:
  - `file`: File blob/buffer (PDF, PNG, JPG)
- **Response (`data`)**:
  ```json
  {
    "exam": {
      "_id": "64f1a2b3c4d5e6f7a8b9c0d2",
      "title": "Class 10 Biology Midterm",
      "subject": "Biology",
      "totalMarks": 50,
      "status": "ready",
      "classroom": "64f1a2b3c4d5e6f7a8b9c0d1",
      "questionPaperUrl": "https://<blob_storage>/exam-files/qpaper_123.pdf",
      "questionPaperPageImages": [
        "https://<blob_storage>/exam-files/qpaper_page_1.png"
      ],
      "extractedHeader": {
        "className": "Class 10 B",
        "standard": "10",
        "subject": "Biology",
        "maxMarks": 50,
        "duration": "2 Hours"
      }
    },
    "questions": [
      {
        "_id": "64f1a2b3c4d5e6f7a8b9c0d6",
        "exam": "64f1a2b3c4d5e6f7a8b9c0d2",
        "number": "1",
        "subPart": null,
        "displayId": "1",
        "text": "What is photosynthesis?",
        "maxMarks": 5,
        "orderIndex": 0
      },
      {
        "_id": "64f1a2b3c4d5e6f7a8b9c0d7",
        "exam": "64f1a2b3c4d5e6f7a8b9c0d2",
        "number": "11",
        "subPart": "a",
        "displayId": "11a",
        "text": "Explain the role of chlorophyll.",
        "maxMarks": 5,
        "orderIndex": 1
      }
    ]
  }
  ```

---

## 3. Answer Sheets, Extraction & Mapping

### `POST /exams/:examId/answer-sheets`
Uploads student answer sheet, auto-creates/finds the student, extracts handwritten answer blocks, and maps them to questions.
- **Content-Type**: `multipart/form-data`
- **Body Form Fields**:
  - `file`: Student's answer sheet file (PDF or Image)
  - `studentName`: string (e.g. `"John Doe"`)
  - `studentRollNo`: string (optional, e.g. `"10B-01"`)
- **Response (`data`)**:
  ```json
  {
    "answerSheet": {
      "_id": "64f1a2b3c4d5e6f7a8b9c0d3",
      "exam": "64f1a2b3c4d5e6f7a8b9c0d2",
      "student": "64f1a2b3c4d5e6f7a8b9c0d8",
      "fileUrl": "https://<blob_storage>/exam-files/asheet_123.pdf",
      "pageCount": 2,
      "pageImages": [
        "https://<blob_storage>/exam-files/asheet_page_1.png",
        "https://<blob_storage>/exam-files/asheet_page_2.png"
      ],
      "status": "mapped"
    },
    "answerRegions": [
      {
        "_id": "64f1a2b3c4d5e6f7a8b9c0d5",
        "answerSheet": "64f1a2b3c4d5e6f7a8b9c0d3",
        "question": "64f1a2b3c4d5e6f7a8b9c0d6",
        "questionRef": "1",
        "extractedText": "Photosynthesis is the process by which plants convert light energy into chemical energy.",
        "isUnmatched": false,
        "segments": [
          {
            "pageIndex": 0,
            "boundingBox": {
              "x": 0.082,
              "y": 0.125,
              "width": 0.835,
              "height": 0.210
            }
          }
        ]
      }
    ]
  }
  ```

---

## 4. AI Grading & Evaluation

### `POST /exams/:examId/answer-sheets/:id/grade`
Triggers AI grading via DeepSeek for all attempted questions, scores unattempted questions as `0`, and generates an exam summary report.
- **Response (`data`)**:
  ```json
  {
    "grades": [
      {
        "_id": "64f1a2b3c4d5e6f7a8b9c0d4",
        "answerSheet": "64f1a2b3c4d5e6f7a8b9c0d3",
        "question": "64f1a2b3c4d5e6f7a8b9c0d6",
        "answerRegion": "64f1a2b3c4d5e6f7a8b9c0d5",
        "marksAwarded": 4.5,
        "maxMarks": 5,
        "isCorrect": true,
        "aiFeedback": "Accurate definition provided. Mentioning chlorophyll or sunlight explicitly would make it complete.",
        "teacherOverride": null
      }
    ],
    "summary": {
      "_id": "64f1a2b3c4d5e6f7a8b9c0d9",
      "answerSheet": "64f1a2b3c4d5e6f7a8b9c0d3",
      "totalScore": 42.5,
      "maxScore": 50,
      "percentage": 85.0,
      "overallFeedback": "Strong grasp of fundamental biological concepts with clear explanations.",
      "strengths": [
        "Well-structured photosynthesis explanations",
        "Clear cellular diagrams"
      ],
      "improvements": [
        "Include chemical formulas where applicable"
      ]
    }
  }
  ```

---

## 5. Main Split-View Payload (The Primary Frontend View)

### `GET /exams/:examId/answer-sheets/:id`
**This is the single endpoint consumed by the frontend Split-View screen.**
- **Response (`data`)**:
  ```json
  {
    "answerSheet": {
      "_id": "64f1a2b3c4d5e6f7a8b9c0d3",
      "exam": {
        "_id": "64f1a2b3c4d5e6f7a8b9c0d2",
        "title": "Class 10 Biology Midterm",
        "totalMarks": 50
      },
      "student": {
        "_id": "64f1a2b3c4d5e6f7a8b9c0d8",
        "name": "John Doe",
        "rollNo": "10B-01"
      },
      "pageImages": [
        "https://<blob_storage>/exam-files/asheet_page_1.png",
        "https://<blob_storage>/exam-files/asheet_page_2.png"
      ],
      "status": "graded",
      "totalScore": 42.5
    },
    "questions": [
      {
        "_id": "64f1a2b3c4d5e6f7a8b9c0d6",
        "number": "1",
        "subPart": null,
        "displayId": "1",
        "text": "What is photosynthesis?",
        "maxMarks": 5,
        "orderIndex": 0
      }
    ],
    "answerRegions": [
      {
        "_id": "64f1a2b3c4d5e6f7a8b9c0d5",
        "question": "64f1a2b3c4d5e6f7a8b9c0d6",
        "questionRef": "1",
        "extractedText": "Photosynthesis is the process...",
        "isUnmatched": false,
        "segments": [
          {
            "pageIndex": 0,
            "boundingBox": {
              "x": 0.082,
              "y": 0.125,
              "width": 0.835,
              "height": 0.210
            }
          }
        ]
      }
    ],
    "grades": [
      {
        "_id": "64f1a2b3c4d5e6f7a8b9c0d4",
        "question": "64f1a2b3c4d5e6f7a8b9c0d6",
        "answerRegion": "64f1a2b3c4d5e6f7a8b9c0d5",
        "marksAwarded": 4.5,
        "maxMarks": 5,
        "isCorrect": true,
        "aiFeedback": "Accurate definition provided.",
        "teacherOverride": null
      }
    ],
    "summary": {
      "totalScore": 42.5,
      "maxScore": 50,
      "percentage": 85.0,
      "overallFeedback": "Strong grasp of fundamental concepts.",
      "strengths": ["Clear explanations"],
      "improvements": ["Include chemical formulas"]
    }
  }
  ```

---

## 6. Teacher Adjustments & Overrides

### `PATCH /exams/:examId/answer-sheets/:id/grades/:gradeId`
Allows the teacher to manually override marks awarded. Automatically recalculates `answerSheet.totalScore` and summary percentage.
- **Request Body**:
  ```json
  {
    "marksAwarded": 5.0
  }
  ```
- **Response (`data`)**: Updated `QuestionGrade` object.

### `PATCH /exams/:examId/answer-sheets/:sheetId/regions/:regionId/assign`
Allows the teacher to manually link an unmatched handwritten answer block (`isUnmatched: true`) to a question.
- **Request Body**:
  ```json
  {
    "questionId": "64f1a2b3c4d5e6f7a8b9c0d6"
  }
  ```
- **Response (`data`)**: Updated `AnswerRegion` object with `question` set and `isUnmatched: false`.

---

## 7. Classrooms & Student Management

- `GET /classrooms`: Lists teacher's classrooms with `studentCount` and `examCount`.
- `GET /classrooms/:id`: Gets classroom with populated `students[]` and `exams[]`.
- `GET /classrooms/:id/students`: Gets students list for that classroom.
- `GET /classrooms/:id/exams`: Gets exams list for that classroom.

---

## 💡 Frontend Highlighting Instructions for the AI Prompt

When rendering answer highlights over `pageImages[segment.pageIndex]`:
1. **Bounding Box Coordinates**: `boundingBox` values (`x`, `y`, `width`, `height`) are **normalized percentages** between `0.0` and `1.0`.
2. **CSS Positioning**: Place an overlay `div` with absolute positioning inside a relative container wrapping the page image:
   ```css
   position: absolute;
   left: ${segment.boundingBox.x * 100}%;
   top: ${segment.boundingBox.y * 100}%;
   width: ${segment.boundingBox.width * 100}%;
   height: ${segment.boundingBox.height * 100}%;
   border: 2px solid #3b82f6;
   background-color: rgba(59, 130, 246, 0.2);
   border-radius: 4px;
   ```
3. **Multi-page Answers**: An `AnswerRegion` can have multiple items in `segments[]` (e.g. `pageIndex: 0` and `pageIndex: 1`), allowing seamless highlighting across page boundaries.
4. **Unanswered Questions**: Questions with no entry in `answerRegions` or `grade.aiFeedback === 'Not attempted.'` can be styled with an "Unanswered" tag.
