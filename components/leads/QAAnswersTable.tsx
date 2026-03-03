import { getLeadAnswers } from '@/lib/api/qa';
import type { QAAnswerWithQuestion } from '@/types/qa';

export interface QAAnswersTableProps {
  leadId: string;
}

export async function QAAnswersTable({ leadId }: QAAnswersTableProps) {
  const answers = await getLeadAnswers(leadId) as QAAnswerWithQuestion[];

  if (answers.length === 0) {
    return (
      <div className="bg-white rounded-lg border p-8">
        <div className="text-center text-gray-500 py-8">
          Henüz cevap yok.
        </div>
      </div>
    );
  }

  // Calculate total score
  const totalScore = answers.reduce((sum, answer) => sum + (answer.points_earned || 0), 0);

  return (
    <div className="bg-white rounded-lg border overflow-hidden">
      <table className="w-full">
        <thead className="bg-gray-50">
          <tr>
            <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Soru</th>
            <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Cevap</th>
            <th className="px-4 py-3 text-right text-sm font-medium text-gray-700">Puan</th>
          </tr>
        </thead>
        <tbody>
          {answers.map((answer, index) => {
            const question = answer.expand?.question_id;
            const questionText = question?.question_text || `Soru ${index + 1}`;
            const answerText = answer.selected_answer?.toUpperCase() || '-';

            // Find the option text for the selected answer
            let optionText = answerText;
            if (question?.options) {
              const optionIndex = answer.selected_answer?.charCodeAt(0) - 'a'.charCodeAt(0);
              if (optionIndex >= 0 && optionIndex < question.options.length) {
                optionText = `${answerText}) ${question.options[optionIndex]?.replace(/^[a-c]\)\s*/, '') || answerText}`;
              }
            }

            return (
              <tr key={answer.id || index} className="border-t">
                <td className="px-4 py-3 text-sm text-gray-900">{questionText}</td>
                <td className="px-4 py-3 text-sm">
                  <span className="px-2 py-1 bg-gray-100 rounded text-gray-700">
                    {optionText}
                  </span>
                </td>
                <td className="px-4 py-3 text-sm text-right font-medium text-green-600">
                  +{answer.points_earned}
                </td>
              </tr>
            );
          })}
        </tbody>
        <tfoot className="bg-gray-50 border-t">
          <tr>
            <td colSpan={2} className="px-4 py-3 text-sm font-medium text-gray-700">Toplam</td>
            <td className="px-4 py-3 text-sm text-right font-bold text-green-700">
              {totalScore}
            </td>
          </tr>
        </tfoot>
      </table>
    </div>
  );
}
