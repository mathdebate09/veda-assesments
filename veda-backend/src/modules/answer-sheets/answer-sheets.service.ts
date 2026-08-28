import {
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { Types } from 'mongoose';
import { AnswerSheetsRepository } from './answer-sheets.repository';
import { CreateAnswerSheetDto } from './dto/create-answer-sheet.dto';
import { AnswerSheetStatus } from '../../schemas/answer-sheet.schema';
import { StorageService } from '../storage/storage.service';
import {
  ExtractionService,
  ExtractedAnswer,
  ExtraAnswerData,
} from '../extraction/extraction.service';
import { GradingService, SingleGradeItem } from '../grading/grading.service';
import { QuestionsService } from '../questions/questions.service';
import { ExamsRepository } from '../exams/exams.repository';
import { StudentsService } from '../students/students.service';
import { sortPageFiles } from '../../common/utils/document.helpers';

@Injectable()
export class AnswerSheetsService {
  private readonly logger = new Logger(AnswerSheetsService.name);

  constructor(
    private readonly answerSheetsRepository: AnswerSheetsRepository,
    private readonly examsRepository: ExamsRepository,
    private readonly questionsService: QuestionsService,
    private readonly storageService: StorageService,
    private readonly extractionService: ExtractionService,
    private readonly gradingService: GradingService,
    private readonly studentsService: StudentsService,
  ) {}

  // ---------------------------------------------------------------------------
  // Helper methods
  // ---------------------------------------------------------------------------

  private buildQuestionsList(exam: any, legacyQuestions: any[] = []) {
    if (exam?.questionDistribution && exam.questionDistribution.length > 0) {
      return exam.questionDistribution.map((qd: any) => {
        const detail = exam.questions?.[qd.displayId];
        const legacyMatch = legacyQuestions.find((lq) => lq.displayId === qd.displayId);
        return {
          _id: legacyMatch ? legacyMatch._id.toString() : qd.displayId,
          number: qd.number,
          subPart: qd.subPart,
          displayId: qd.displayId,
          text: detail?.text || `Question ${qd.displayId}`,
          maxMarks: qd.maxMarks || 5,
          orderIndex: qd.orderIndex,
        };
      });
    }
    return legacyQuestions.map((q) => ({
      _id: q._id?.toString(),
      number: q.number,
      subPart: q.subPart,
      displayId: q.displayId,
      text: q.text,
      maxMarks: q.maxMarks || 5,
      orderIndex: q.orderIndex ?? 0,
    }));
  }

  private buildLegacyRegionsData(
    sheetId: Types.ObjectId,
    answers: Record<string, ExtractedAnswer>,
    extras: ExtraAnswerData[],
    legacyQuestions: any[],
  ) {
    const legacyQMap = new Map(
      legacyQuestions.map((q) => [q.displayId.toLowerCase(), q]),
    );
    const regionsData: any[] = [];

    for (const [qRef, ans] of Object.entries(answers)) {
      const matchedQ = legacyQMap.get(qRef.toLowerCase());
      regionsData.push({
        answerSheet: sheetId,
        question: matchedQ ? matchedQ._id : undefined,
        questionRef: qRef,
        extractedText: ans.text,
        isUnmatched: false,
        segments: ans.segments,
        createdAt: new Date(),
      });
    }

    for (const extra of extras) {
      regionsData.push({
        answerSheet: sheetId,
        question: undefined,
        questionRef: extra.questionRef,
        extractedText: extra.text,
        isUnmatched: true,
        segments: extra.segments,
        createdAt: new Date(),
      });
    }

    return regionsData;
  }

  // ---------------------------------------------------------------------------
  // Public API
  // ---------------------------------------------------------------------------

  async createAnswerSheet(
    examId: string,
    dto: CreateAnswerSheetDto,
    filesInput: Express.Multer.File[] | Express.Multer.File,
  ) {
    const rawFiles = Array.isArray(filesInput)
      ? filesInput
      : [filesInput].filter(Boolean);

    if (!rawFiles || rawFiles.length === 0) {
      throw new BadRequestException('Answer sheet file is required.');
    }

    const exam = await this.examsRepository.findById(examId);
    if (!exam) {
      throw new NotFoundException(`Exam with ID ${examId} not found.`);
    }

    // 1. Auto-create or find student record (inherit classroom from exam if present)
    const classroomId = exam.classroom
      ? typeof exam.classroom === 'object' && (exam.classroom as any)._id
        ? (exam.classroom as any)._id.toString()
        : exam.classroom.toString()
      : undefined;

    const student = await this.studentsService.findOrCreate(
      dto.studentName ?? dto.studentRollNo,
      classroomId,
      dto.studentRollNo,
    );

    const studentId = student._id.toString();

    // 2. Link exam to student
    await this.studentsService.addExam(studentId, examId);

    // Sort page files in ascending order if indexed
    const files = sortPageFiles(rawFiles);

    let pageBuffers: Buffer[] = [];
    let originalDocUrl: string | undefined;

    // Check if a single raw PDF was provided
    if (
      files.length === 1 &&
      (files[0].mimetype === 'application/pdf' ||
        files[0].originalname.toLowerCase().endsWith('.pdf'))
    ) {
      const origPath = this.storageService.getAnswerSheetPath(
        examId,
        studentId,
        undefined,
        files[0].originalname,
      );
      originalDocUrl = await this.storageService.uploadFile(
        files[0].buffer,
        origPath,
        files[0].mimetype || 'application/pdf',
      );
      pageBuffers = await this.storageService.rasterisePdfToBuffers(
        files[0].buffer,
        files[0].mimetype || 'application/pdf',
      );
    } else {
      pageBuffers = files.map((f) => f.buffer);
    }

    // 3. Upload rasterised page images to Azure inside folder: exams/{examId}/answer-sheets/{studentId}/page_N.png
    const pageImages: string[] = [];
    for (let i = 0; i < pageBuffers.length; i++) {
      const pageBlobPath = this.storageService.getAnswerSheetPath(
        examId,
        studentId,
        i + 1,
      );
      const url = await this.storageService.uploadFile(
        pageBuffers[i],
        pageBlobPath,
        'image/png',
      );
      pageImages.push(url);
    }

    const fileUrl = originalDocUrl || pageImages[0] || '';

    // 4. Fetch exam's question distribution and questions map
    const legacyQuestions = await this.questionsService.getQuestionsByExam(examId);
    const questionsList = this.buildQuestionsList(exam, legacyQuestions);

    // 5. Extract answer blocks using DeepSeek Vision against the question distribution
    let extractedAnswersMap: Record<string, ExtractedAnswer> = {};
    let extractedExtras: ExtraAnswerData[] = [];

    try {
      const extractionResult =
        await this.extractionService.extractAnswersFromImages(
          pageBuffers,
          questionsList,
        );
      extractedAnswersMap = extractionResult.answers;
      extractedExtras = extractionResult.extras;
    } catch (extractionError: any) {
      this.logger.warn(
        `Automated answer extraction skipped/failed: ${extractionError.message}. Uploading answer sheet so it can still be viewed and graded.`,
      );
    }

    const hasExtracted =
      Object.keys(extractedAnswersMap).length > 0 || extractedExtras.length > 0;

    // 6. Create AnswerSheet document with unified answers & extras
    const answerSheet = await this.answerSheetsRepository.createSheet({
      exam: new Types.ObjectId(examId),
      student: student._id,
      fileUrl,
      pageCount: pageImages.length,
      pageImages,
      status: hasExtracted
        ? AnswerSheetStatus.MAPPED
        : AnswerSheetStatus.UPLOADED,
      answers: extractedAnswersMap,
      extras: extractedExtras,
      uploadedAt: new Date(),
    });

    // 7. Generate legacy AnswerRegions for backwards-compatible API consumers
    const regionsData = this.buildLegacyRegionsData(
      answerSheet._id as Types.ObjectId,
      extractedAnswersMap,
      extractedExtras,
      legacyQuestions,
    );

    const answerRegions =
      regionsData.length > 0
        ? await this.answerSheetsRepository.createRegions(regionsData)
        : [];

    // 8. Return standardized response with both unified and legacy views
    return [
      {
        type: 'answer_sheet' as const,
        answerSheetId: answerSheet._id,
        studentId: student._id,
        answers: extractedAnswersMap,
        extras: extractedExtras,
        answerRegions,
        pageImages,
      },
    ];
  }

  async gradeAnswerSheet(examId: string, sheetId: string) {
    const sheet = await this.answerSheetsRepository.findSheetById(sheetId);
    if (
      !sheet ||
      (sheet.exam.toString() !== examId &&
        (sheet.exam as any)?._id?.toString() !== examId)
    ) {
      throw new NotFoundException(
        `Answer sheet with ID ${sheetId} not found for exam ${examId}.`,
      );
    }

    const exam = await this.examsRepository.findById(examId);
    if (!exam) {
      throw new NotFoundException(`Exam with ID ${examId} not found.`);
    }

    // Build questions map
    const legacyQuestions = await this.questionsService.getQuestionsByExam(examId);
    const questionsList = this.buildQuestionsList(exam, legacyQuestions);
    const questionsMap: Record<
      string,
      { displayId: string; text: string; maxMarks?: number | null }
    > = {};

    for (const q of questionsList) {
      questionsMap[q.displayId] = {
        displayId: q.displayId,
        text: q.text,
        maxMarks: q.maxMarks,
      };
    }

    const answersMap: Record<string, { text: string }> = {};
    if (sheet.answers && typeof sheet.answers === 'object') {
      for (const [k, v] of Object.entries(sheet.answers)) {
        answersMap[k] = { text: v.text };
      }
    } else {
      // Fallback from legacy answer regions
      const regions = await this.answerSheetsRepository.findRegionsBySheetId(sheetId);
      for (const r of regions) {
        if (r.questionRef) {
          answersMap[r.questionRef] = { text: r.extractedText };
        }
      }
    }

    // Run unified grading pipeline
    const gradingResult = await this.gradingService.gradeAllExamAnswers(
      questionsMap,
      answersMap,
    );

    // Save unified grading data on AnswerSheet document
    await this.answerSheetsRepository.updateSheet(sheetId, {
      grading: {
        grades: gradingResult.grades,
        summary: gradingResult.summary,
        gradedAt: gradingResult.gradedAt,
      },
      totalScore: gradingResult.totalScore,
      status: AnswerSheetStatus.GRADED,
    });

    // Also update/sync legacy QuestionGrade & ExamSummary documents for backwards compatibility
    await this.answerSheetsRepository.deleteGradesBySheetId(sheetId);
    const legacyQMap = new Map(legacyQuestions.map((q) => [q.displayId.toLowerCase(), q]));
    const regions = await this.answerSheetsRepository.findRegionsBySheetId(sheetId);
    const regionMap = new Map(
      regions.filter((r) => r.questionRef).map((r) => [r.questionRef.toLowerCase(), r]),
    );

    const gradesToCreate: any[] = [];
    for (const [qRef, gradeItem] of Object.entries(gradingResult.grades)) {
      const matchedQ = legacyQMap.get(qRef.toLowerCase());
      const matchedR = regionMap.get(qRef.toLowerCase());
      if (matchedQ) {
        gradesToCreate.push({
          answerRegion: matchedR ? matchedR._id : null,
          question: matchedQ._id,
          answerSheet: sheet._id,
          marksAwarded: gradeItem.marksAwarded,
          maxMarks: gradeItem.maxMarks,
          isCorrect: gradeItem.isCorrect,
          aiFeedback: gradeItem.aiFeedback,
          teacherOverride: gradeItem.teacherOverride ?? null,
          gradedAt: gradingResult.gradedAt,
        });
      }
    }

    const createdGrades =
      gradesToCreate.length > 0
        ? await this.answerSheetsRepository.createGrades(gradesToCreate)
        : [];

    const legacySummary = await this.answerSheetsRepository.saveSummary({
      answerSheet: sheet._id,
      totalScore: gradingResult.totalScore,
      maxScore: gradingResult.maxScore,
      percentage: gradingResult.percentage,
      overallFeedback: gradingResult.summary.overallFeedback,
      strengths: gradingResult.summary.strengths,
      improvements: gradingResult.summary.improvements,
      generatedAt: gradingResult.gradedAt,
    });

    return {
      grading: {
        grades: gradingResult.grades,
        summary: gradingResult.summary,
        gradedAt: gradingResult.gradedAt,
      },
      grades: createdGrades,
      summary: legacySummary,
    };
  }

  async getAnswerSheetDetails(examId: string, sheetId: string) {
    const sheet = await this.answerSheetsRepository.findSheetById(sheetId);
    if (!sheet) {
      throw new NotFoundException(`Answer sheet with ID ${sheetId} not found.`);
    }

    const exam = await this.examsRepository.findById(examId);

    const [legacyQuestions, legacyRegions, legacyGrades, legacySummary] =
      await Promise.all([
        this.questionsService.getQuestionsByExam(examId),
        this.answerSheetsRepository.findRegionsBySheetId(sheetId),
        this.answerSheetsRepository.findGradesBySheetId(sheetId),
        this.answerSheetsRepository.findSummaryBySheetId(sheetId),
      ]);

    const questionsList = this.buildQuestionsList(exam, legacyQuestions);

    // Convert sheet.answers & extras to unified AnswerRegions format
    const answerRegions: any[] = [];
    if (sheet.answers && typeof sheet.answers === 'object') {
      for (const [qRef, ans] of Object.entries(sheet.answers)) {
        const matchedQ = questionsList.find(
          (q) => q.displayId.toLowerCase() === qRef.toLowerCase(),
        );
        answerRegions.push({
          _id: `region_${qRef}`,
          question: matchedQ ? matchedQ._id : undefined,
          questionRef: qRef,
          extractedText: ans.text,
          isUnmatched: !matchedQ,
          segments: ans.segments || [],
        });
      }
    }
    if (sheet.extras && Array.isArray(sheet.extras)) {
      for (const extra of sheet.extras) {
        answerRegions.push({
          _id: extra.id || `extra_${extra.questionRef}`,
          question: undefined,
          questionRef: extra.questionRef,
          extractedText: extra.text,
          isUnmatched: true,
          segments: extra.segments || [],
        });
      }
    }

    const finalAnswerRegions =
      answerRegions.length > 0 ? answerRegions : legacyRegions;

    // Build unified grades array
    const gradesList: any[] = [];
    if (sheet.grading?.grades) {
      for (const [qRef, g] of Object.entries(sheet.grading.grades)) {
        const matchedQ = questionsList.find(
          (q) => q.displayId.toLowerCase() === qRef.toLowerCase(),
        );
        gradesList.push({
          _id: `grade_${qRef}`,
          question: matchedQ ? matchedQ._id : qRef,
          marksAwarded: g.marksAwarded,
          maxMarks: g.maxMarks,
          isCorrect: g.isCorrect,
          aiFeedback: g.aiFeedback,
          teacherOverride: g.teacherOverride ?? null,
        });
      }
    }

    const finalGrades = gradesList.length > 0 ? gradesList : legacyGrades;
    const finalSummary = sheet.grading?.summary || legacySummary;

    return {
      answerSheet: sheet,
      exam,
      questions: questionsList,
      questionsMap: exam?.questions || {},
      questionDistribution: exam?.questionDistribution || [],
      answers: sheet.answers || {},
      extras: sheet.extras || [],
      grading: sheet.grading,
      answerRegions: finalAnswerRegions,
      grades: finalGrades,
      summary: finalSummary,
    };
  }

  async updateGradeOverride(
    _examId: string,
    sheetId: string,
    gradeId: string,
    marksAwarded: number,
  ) {
    const sheet = await this.answerSheetsRepository.findSheetById(sheetId);
    if (!sheet) {
      throw new NotFoundException(`Answer sheet with ID ${sheetId} not found.`);
    }

    // Update inside sheet.grading.grades if available
    let updatedGrade: any = null;

    if (sheet.grading?.grades) {
      for (const [qRef, g] of Object.entries(sheet.grading.grades)) {
        if (qRef === gradeId || `grade_${qRef}` === gradeId) {
          g.teacherOverride = marksAwarded;
          updatedGrade = { ...g, _id: gradeId, question: qRef };
        }
      }

      // Recalculate totalScore
      let totalScore = 0;
      let maxScore = 0;
      for (const g of Object.values(sheet.grading.grades)) {
        totalScore += g.teacherOverride ?? g.marksAwarded;
        maxScore += g.maxMarks;
      }
      const percentage =
        maxScore > 0 ? Math.round((totalScore / maxScore) * 100 * 10) / 10 : 0;

      if (sheet.grading.summary) {
        sheet.grading.summary.totalScore = totalScore;
        sheet.grading.summary.percentage = percentage;
      }

      await this.answerSheetsRepository.updateSheet(sheetId, {
        grading: sheet.grading,
        totalScore,
      });
    }

    // Also update legacy QuestionGrade if present
    try {
      const legacyGrade = await this.answerSheetsRepository.findGradeById(gradeId);
      if (legacyGrade) {
        const legacyUpdated = await this.answerSheetsRepository.updateGrade(
          gradeId,
          { teacherOverride: marksAwarded },
        );
        if (!updatedGrade) updatedGrade = legacyUpdated;
      }
    } catch {
      // Non-fatal if gradeId was a questionRef
    }

    return updatedGrade || { marksAwarded, teacherOverride: marksAwarded };
  }

  async assignRegionToQuestion(
    examId: string,
    sheetId: string,
    regionId: string,
    questionId: string,
  ) {
    const sheet = await this.answerSheetsRepository.findSheetById(sheetId);
    if (!sheet) {
      throw new NotFoundException(`Answer sheet with ID ${sheetId} not found.`);
    }

    const exam = await this.examsRepository.findById(examId);
    if (!exam) {
      throw new NotFoundException(`Exam with ID ${examId} not found.`);
    }

    // Find the target question displayId
    let targetDisplayId = questionId;
    if (exam.questionDistribution) {
      const matchedQ = exam.questionDistribution.find(
        (qd) => qd.displayId === questionId || qd.number === questionId,
      );
      if (matchedQ) targetDisplayId = matchedQ.displayId;
    }

    // Check if region is in sheet.extras
    const extras = sheet.extras || [];
    const extraIdx = extras.findIndex(
      (e) => e.id === regionId || e.questionRef === regionId,
    );

    if (extraIdx !== -1) {
      const [matchedExtra] = extras.splice(extraIdx, 1);
      const answers = sheet.answers || {};
      answers[targetDisplayId] = {
        questionRef: targetDisplayId,
        text: matchedExtra.text,
        segments: matchedExtra.segments,
      };

      await this.answerSheetsRepository.updateSheet(sheetId, {
        answers,
        extras,
      });
    }

    // Also update legacy region if present
    try {
      await this.answerSheetsRepository.updateRegion(regionId, {
        question: new Types.ObjectId(questionId),
        isUnmatched: false,
      });
    } catch {
      // Handled in unified structure
    }

    return { success: true, questionRef: targetDisplayId };
  }

  async getAnswerSheetsForExam(examId: string) {
    return this.answerSheetsRepository.findSheetsByExam(examId);
  }
}
