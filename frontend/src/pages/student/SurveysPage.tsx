import { useEffect, useState } from "react";
import api from "../../api/axios";

interface Question {
  question_id: number;
  text: string;
  order: number;
}

interface Survey {
  survey_id: number;
  title: string;
  description: string;
  questions: Question[];
}

interface Answer {
  question: number;
  question_text: string;
  answer_text: string;
}

interface SurveyResponse {
  response_id: number;
  survey: number;
  submitted_at: string;
  answers: Answer[];
}

interface AnswerDraft {
  [questionId: number]: string;
}

function SurveyForm({
  survey,
  onSubmitted,
}: {
  survey: Survey;
  onSubmitted: () => void;
}) {
  const [answers, setAnswers] = useState<AnswerDraft>({});
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const sortedQuestions = [...survey.questions].sort(
    (a, b) => a.order - b.order
  );

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    // Validate all questions answered
    const unanswered = sortedQuestions.filter(
      (q) => !(answers[q.question_id] ?? "").trim()
    );
    if (unanswered.length > 0) {
      setError("Molimo odgovorite na sva pitanja.");
      return;
    }

    setSubmitting(true);
    try {
      await api.post("/surveys/responses/", {
        survey: survey.survey_id,
        answers: sortedQuestions.map((q) => ({
          question: q.question_id,
          answer_text: (answers[q.question_id] ?? "").trim(),
        })),
      });
      onSubmitted();
    } catch {
      setError("Greška pri slanju. Pokušajte ponovo.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="mt-4 space-y-4">
      {sortedQuestions.map((q, idx) => (
        <div key={q.question_id}>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">
            <span className="text-gray-400 mr-1.5">{idx + 1}.</span>
            {q.text}
          </label>
          <textarea
            rows={3}
            value={answers[q.question_id] ?? ""}
            onChange={(e) =>
              setAnswers((prev) => ({ ...prev, [q.question_id]: e.target.value }))
            }
            placeholder="Vaš odgovor..."
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
      ))}

      {error && (
        <p className="text-sm text-red-600 bg-red-50 border border-red-100 rounded-lg px-3 py-2">
          {error}
        </p>
      )}

      <div className="flex justify-end">
        <button
          type="submit"
          disabled={submitting}
          className="px-5 py-2 text-sm font-semibold bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {submitting ? "Slanje..." : "Pošalji odgovore"}
        </button>
      </div>
    </form>
  );
}

function SurveyCard({
  survey,
  onCompleted,
}: {
  survey: Survey;
  onCompleted: () => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  function handleSubmitted() {
    setSubmitted(true);
    onCompleted();
  }

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
      <div className="p-5">
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-gray-800 text-base">
              {survey.title}
            </h3>
            {survey.description && (
              <p className="text-sm text-gray-500 mt-1">{survey.description}</p>
            )}
            <p className="text-xs text-gray-400 mt-2">
              {survey.questions.length}{" "}
              {survey.questions.length === 1 ? "pitanje" : "pitanja"}
            </p>
          </div>

          {submitted ? (
            <span className="text-xs px-2.5 py-1 rounded-lg border font-medium bg-green-100 text-green-700 border-green-200 whitespace-nowrap">
              Hvala!
            </span>
          ) : (
            <button
              onClick={() => setExpanded((v) => !v)}
              className="shrink-0 px-4 py-1.5 text-sm font-semibold bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              {expanded ? "Zatvori" : "Ispuni anketu"}
            </button>
          )}
        </div>

        {submitted && (
          <div className="mt-3 bg-green-50 border border-green-100 rounded-lg px-3 py-2.5 text-sm text-green-700 font-medium">
            Hvala na odgovorima! Vaša anketa je uspješno poslana.
          </div>
        )}
      </div>

      {expanded && !submitted && (
        <div className="border-t border-gray-100 px-5 pb-5">
          <SurveyForm survey={survey} onSubmitted={handleSubmitted} />
        </div>
      )}
    </div>
  );
}

export default function SurveysPage() {
  const [surveys, setSurveys] = useState<Survey[]>([]);
  const [responses, setResponses] = useState<SurveyResponse[]>([]);
  const [loading, setLoading] = useState(true);
  // Track newly completed survey IDs in this session
  const [completedIds, setCompletedIds] = useState<Set<number>>(new Set());
  const [expandedResponses, setExpandedResponses] = useState<Set<number>>(new Set());

  useEffect(() => {
    Promise.all([
      api.get("/surveys/").then(({ data }) => data.results ?? data),
      api.get("/surveys/responses/").then(({ data }) => data.results ?? data),
    ])
      .then(([surveysData, responsesData]) => {
        setSurveys(surveysData);
        setResponses(responsesData);
      })
      .finally(() => setLoading(false));
  }, []);

  const respondedSurveyIds = new Set([
    ...responses.map((r) => r.survey),
    ...completedIds,
  ]);

  const availableSurveys = surveys.filter(
    (s) => !respondedSurveyIds.has(s.survey_id)
  );

  const completedSurveys = surveys.filter((s) => respondedSurveyIds.has(s.survey_id));

  function getResponseDate(surveyId: number): string | null {
    const r = responses.find((resp) => resp.survey === surveyId);
    return r ? r.submitted_at : null;
  }

  function formatDate(iso: string) {
    return new Date(iso).toLocaleDateString("hr-HR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20 text-gray-400 text-sm">
        Učitavanje...
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-6">
      <h1 className="text-xl font-bold text-gray-800 mb-6">Ankete</h1>

      {/* Available surveys */}
      <section className="mb-8">
        <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">
          Dostupne ankete
        </h2>

        {availableSurveys.length === 0 ? (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-8 text-center">
            <div className="text-3xl mb-2">✅</div>
            <p className="text-gray-500 text-sm">Nema dostupnih anketa.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {availableSurveys.map((survey) => (
              <SurveyCard
                key={survey.survey_id}
                survey={survey}
                onCompleted={() =>
                  setCompletedIds((prev) => new Set([...prev, survey.survey_id]))
                }
              />
            ))}
          </div>
        )}
      </section>

      {/* Completed surveys */}
      {completedSurveys.length > 0 && (
        <section>
          <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">
            Ispunjene ankete
          </h2>
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 divide-y divide-gray-50">
            {completedSurveys.map((survey) => {
              const dateStr = getResponseDate(survey.survey_id);
              return (
                <div
                  key={survey.survey_id}
                  className="px-5 py-4"
                >
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-700">
                        {survey.title}
                      </p>
                      {dateStr && (
                        <p className="text-xs text-gray-400 mt-0.5">
                          Ispunjeno: {formatDate(dateStr)}
                        </p>
                      )}
                      {!dateStr && completedIds.has(survey.survey_id) && (
                        <p className="text-xs text-gray-400 mt-0.5">
                          Ispunjeno upravo
                        </p>
                      )}
                      {(() => {
                        const r = responses.find((resp) => resp.survey === survey.survey_id);
                        if (!r || !r.answers || r.answers.length === 0) return null;
                        const isExpanded = expandedResponses.has(survey.survey_id);
                        return (
                          <div className="mt-2">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setExpandedResponses((prev) => {
                                  const next = new Set(prev);
                                  if (next.has(survey.survey_id)) next.delete(survey.survey_id);
                                  else next.add(survey.survey_id);
                                  return next;
                                });
                              }}
                              className="text-xs text-blue-600 hover:underline"
                            >
                              {isExpanded ? "Sakrij odgovore ▲" : "Pogledaj odgovore ▼"}
                            </button>
                            {isExpanded && (
                              <div className="mt-2 space-y-2">
                                {r.answers.map((a, i) => (
                                  <div key={i} className="text-xs bg-gray-50 rounded-lg px-3 py-2">
                                    <p className="font-medium text-gray-600">{a.question_text || `Pitanje ${i + 1}`}</p>
                                    <p className="text-gray-800 mt-0.5">{a.answer_text || "—"}</p>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        );
                      })()}
                    </div>
                    <span className="text-xs px-2.5 py-1 rounded-lg border font-medium bg-blue-100 text-blue-700 border-blue-200 whitespace-nowrap shrink-0">
                      Ispunjeno
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      )}
    </div>
  );
}
