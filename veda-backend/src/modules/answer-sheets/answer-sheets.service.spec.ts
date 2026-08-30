import { AnswerSheetsService } from './answer-sheets.service';

describe('AnswerSheetsService.getExamAssessment', () => {
  it('should reuse the cached assessment when submission count is unchanged', async () => {
    const generateAssessmentAnalytics = jest.fn().mockResolvedValue({
      learningGaps: [{ topic: 'Algebra', gapPercent: 25 }],
      teacherInsights: ['Review algebra drills.'],
    });

    const answerSheetsRepository = {
      findSheetsByExam: jest.fn().mockResolvedValue([
        {
          _id: 'sheet-1',
          totalScore: 70,
          grading: { summary: { percentage: 70, totalScore: 70 } },
          student: { name: 'Alice' },
        },
        {
          _id: 'sheet-2',
          totalScore: 80,
          grading: { summary: { percentage: 80, totalScore: 80 } },
          student: { name: 'Bob' },
        },
      ]),
    };

    const examsRepository = {
      findById: jest.fn().mockResolvedValue({
        _id: 'exam-1',
        title: 'Math Quiz',
        subject: 'Mathematics',
        totalMarks: 100,
        questionDistribution: [],
        assessmentCache: {
          submissionCount: 2,
          learningGaps: [{ topic: 'Algebra', gapPercent: 25 }],
          teacherInsights: ['Review algebra drills.'],
          generatedAt: new Date('2024-01-01T00:00:00Z'),
        },
      }),
      update: jest.fn(),
    };

    const questionsService = {
      getQuestionsByExam: jest.fn().mockResolvedValue([]),
    };

    const service = new AnswerSheetsService(
      answerSheetsRepository as any,
      examsRepository as any,
      questionsService as any,
      {} as any,
      {} as any,
      { generateAssessmentAnalytics } as any,
      {} as any,
    );

    const result = await service.getExamAssessment('exam-1');

    expect(generateAssessmentAnalytics).not.toHaveBeenCalled();
    expect(result.learningGaps).toEqual([{ topic: 'Algebra', gapPercent: 25 }]);
    expect(result.teacherInsights).toEqual(['Review algebra drills.']);
  });
});
