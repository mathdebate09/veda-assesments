# Veda Assessments
>
> [Live](https://veda-assessments.jayowiee.com)

An AI Assistant to help teacher to upload a question paper and answer sheet and quickly understand which question was answered, where the answer is, and which questions were left unanswered.

> email me at <contact@jayowiee.com> for login creds

## Architecture Flow

```mermaid
flowchart LR
    Teacher[Teacher / Admin] --> FE[React + Vite Frontend]
    FE --> API[NestJS Backend API]
    API --> Auth[Auth + JWT]
    API --> Storage[Azure Storage / File Uploads]
    API --> DB[(MongoDB)]
    API --> AI[DeepSeek V4 Flash + Vision Models]

    FE -->|Upload question paper + answer sheet| API
    API -->|Process exam data| DB
    API -->|Analyze PDF regions and answers| AI
    AI -->|Return mapped answers + unattempted questions| API
    API -->|JSON + summary to UI| FE
    FE -->|View insights| Teacher
```

## Tech

### Backend

[![TYPESCRIPT](https://img.shields.io/badge/-TYPESCRIPT-000?style=for-the-badge&logo=typescript&logoColor=3178C6)](#)
[![NESTJS](https://img.shields.io/badge/-NESTJS-000?style=for-the-badge&logo=nestjs&logoColor=E0234E)](#)
[![MONGODB](https://img.shields.io/badge/-MONGODB-000?style=for-the-badge&logo=mongodb&logoColor=47A248)](#)
[![AZURE](https://img.shields.io/badge/-AZURE-000?style=for-the-badge&logo=microsoftazure&logoColor=0078D4)](#)

### AI

[![DEEPSEEK V4 FLASH](https://img.shields.io/badge/-DEEPSEEK%20V4%20FLASH-000?style=for-the-badge&logo=deepseek&logoColor=FFFFFF)](#)
[![DEEPSEEK V4 FLASH VISION](https://img.shields.io/badge/-DEEPSEEK%20V4%20FLASH%20VISION-000?style=for-the-badge&logo=deepseek&logoColor=FFFFFF)](#)

### Frontend

[![VITE](https://img.shields.io/badge/-VITE-000?style=for-the-badge&logo=vite&logoColor=646CFF)](#)
[![TAILWINDCSS](https://img.shields.io/badge/-TAILWINDCSS-000?style=for-the-badge&logo=tailwindcss&logoColor=06B6D4)](#)
[![FIGMA](https://img.shields.io/badge/-FIGMA-000?style=for-the-badge&logo=figma&logoColor=F24E1E)](#)
