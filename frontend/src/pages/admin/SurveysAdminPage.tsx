import { useState, useEffect } from "react";
import api from "../../api/axios";

interface Question {
  id?: number;
  text: string;
  order: number;
}

interface Survey {
  survey_id: number;
  title: string;
  description: string;
  is_active: boolean;
  created_at: string;
  questions_count: number;
  response_count: number;
}

interface Answer {
  question_text: string;
  answer_text: string;
}

interface Response {
  id: number;
  student_name: string;
  submitted_at: string;
  answers: Answer[];
}

const EMPTY_FORM = {
  title: "",
  description: "",
};

export default function SurveysAdminPage() {
  const [surveys, setSurveys] = useState<Survey[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Create form
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [questions, setQuestions] = useState<{ text: string }[]>([{ text: "" }]);
  const [formError, setFormError] = useState("");
  const [formSaving, setFormSaving] = useState(false);

  // Responses modal
  const [responsesModal, setResponsesModal] = useState<Survey | null>(null);
  const [responses, setResponses] = useState<Response[]>([]);
  const [responsesLoading, setResponsesLoading] = useState(false);

  function load() {
    setLoading(true);
    setError("");
    api
      .get("/surveys/")
      .then(({ data }) => setSurveys(data.results ?? data))
      .catch(() => setError("Greška pri učitavanju anketa."))
      .finally(() => setLoading(false));
  }

  useEffect(() => {
    load();
  }, []);

  function openCreate() {
    setForm(EMPTY_FORM);
    setQuestions([{ text: "" }]);
    setFormError("");
    setShowForm(true);
  }

  function addQuestion() {
    setQuestions([...questions, { text: "" }]);
  }

  function removeQuestion(index: number) {
    if (questions.length === 1) return;
    setQuestions(questions.filter((_, i) => i !== index));
  }

  function updateQuestion(index: number, text: string) {
    setQuestions(questions.map((q, i) => (i === index ? { text } : q)));
  }

  async function handleCreate() {
    setFormError("");
    if (!form.title.trim()) {
      setFormError("Naslov ankete je obavezan.");
      return;
    }
    const filledQuestions = questions.filter((q) => q.text.trim() !== "");
    if (filledQuestions.length === 0) {
      setFormError("Dodaj barem jedno pitanje.");
      return;
    }
    setFormSaving(true);
    try {
      await api.post("/surveys/", {
        title: form.title,
        description: form.description,
        questions: filledQuestions.map((q, i) => ({ text: q.text, order: i + 1 })),
      });
      setShowForm(false);
      load();
    } catch (err: any) {
      setFormError(JSON.stringify(err.response?.data ?? "Greška pri kreiranju."));
    } finally {
      setFormSaving(false);
    }
  }

  async function handleToggleActive(survey: Survey) {
    try {
      await api.patch(`/surveys/${survey.survey_id}/`, { is_active: !survey.is_active });
      load();
    } catch {
      alert("Greška pri promjeni statusa ankete.");
    }
  }

  async function handleDelete(survey: Survey) {
    if (!confirm(`Obriši anketu "${survey.title}"? Ovo se ne može poništiti.`)) return;
    try {
      await api.delete(`/surveys/${survey.survey_id}/`);
      load();
    } catch {
      alert("Greška pri brisanju ankete.");
    }
  }

  async function openResponses(survey: Survey) {
    setResponsesModal(survey);
    setResponses([]);
    setResponsesLoading(true);
    try {
      const { data } = await api.get(`/surveys/${survey.survey_id}/responses/`);
      setResponses(data.results ?? data);
    } catch {
      setResponses([]);
    } finally {
      setResponsesLoading(false);
    }
  }

  const inputCls =
    "border border-gray-300 rounded-lg px-3 py-2 text-sm w-full focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900";

  return (
    <div className="max-w-7xl mx-auto px-4 py-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl font-bold text-gray-900">Ankete</h1>
        <button
          onClick={openCreate}
          className="px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
          aria-label="Kreiraj novu anketu"
        >
          + Nova anketa
        </button>
      </div>

      {loading && <p className="text-gray-500 text-sm">Učitavanje...</p>}

      {error && (
        <div role="alert" className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
          {error}
        </div>
      )}

      {!loading && !error && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-x-auto">
          <table className="w-full text-sm" aria-label="Tablica anketa">
            <thead>
              <tr className="bg-gray-50 text-left text-gray-500 text-xs uppercase">
                <th className="px-4 py-3">Naslov</th>
                <th className="px-4 py-3">Pitanja</th>
                <th className="px-4 py-3">Odgovori</th>
                <th className="px-4 py-3">Aktivna</th>
                <th className="px-4 py-3">Kreirana</th>
                <th className="px-4 py-3">Akcije</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {surveys.map((s) => (
                <tr key={s.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 font-medium text-gray-900">{s.title}</td>
                  <td className="px-4 py-3 text-gray-700">{s.questions_count ?? "—"}</td>
                  <td className="px-4 py-3 text-gray-700">{s.response_count ?? "—"}</td>
                  <td className="px-4 py-3">
                    <span
                      className={`text-xs px-2 py-0.5 rounded font-medium ${
                        s.is_active ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"
                      }`}
                    >
                      {s.is_active ? "Da" : "Ne"}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-gray-600">
                    {new Date(s.created_at).toLocaleDateString("hr-HR")}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex gap-2 flex-wrap">
                      <button
                        onClick={() => handleToggleActive(s)}
                        className={`text-xs px-2 py-0.5 rounded focus:outline-none focus:ring-2 focus:ring-offset-1 ${
                          s.is_active
                            ? "bg-gray-50 text-gray-700 hover:bg-gray-100 border border-gray-200 focus:ring-gray-400"
                            : "bg-green-50 text-green-700 hover:bg-green-100 focus:ring-green-500"
                        }`}
                        aria-label={`${s.is_active ? "Deaktiviraj" : "Aktiviraj"} anketu ${s.title}`}
                      >
                        {s.is_active ? "Deaktiviraj" : "Aktiviraj"}
                      </button>
                      <button
                        onClick={() => openResponses(s)}
                        className="text-xs bg-blue-50 text-blue-700 px-2 py-0.5 rounded hover:bg-blue-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        aria-label={`Pregledaj odgovore za anketu ${s.title}`}
                      >
                        Odgovori
                      </button>
                      <button
                        onClick={() => handleDelete(s)}
                        className="text-xs bg-red-50 text-red-700 px-2 py-0.5 rounded hover:bg-red-100 focus:outline-none focus:ring-2 focus:ring-red-400"
                        aria-label={`Obriši anketu ${s.title}`}
                      >
                        Obriši
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {surveys.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-gray-400">
                    Nema anketa
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Create survey modal */}
      {showForm && (
        <div
          className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="create-survey-title"
        >
          <div className="bg-white rounded-xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="p-5 border-b border-gray-100 flex items-center justify-between">
              <h2 id="create-survey-title" className="font-semibold text-gray-900">
                Nova anketa
              </h2>
              <button
                onClick={() => setShowForm(false)}
                className="text-gray-400 hover:text-gray-600 focus:outline-none focus:ring-2 focus:ring-gray-400 rounded"
                aria-label="Zatvori"
              >
                ✕
              </button>
            </div>
            <div className="p-5 space-y-4">
              <div>
                <label htmlFor="sv-title" className="block text-xs font-medium text-gray-700 mb-1">
                  Naslov
                </label>
                <input
                  id="sv-title"
                  type="text"
                  placeholder="npr. Zadovoljstvo uslugama"
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                  className={inputCls}
                />
              </div>

              <div>
                <label htmlFor="sv-desc" className="block text-xs font-medium text-gray-700 mb-1">
                  Opis (opcionalno)
                </label>
                <textarea
                  id="sv-desc"
                  rows={2}
                  placeholder="Kratki opis ankete..."
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  className={inputCls}
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-medium text-gray-700">Pitanja</span>
                  <button
                    type="button"
                    onClick={addQuestion}
                    className="text-xs text-blue-600 hover:text-blue-700 focus:outline-none focus:underline"
                    aria-label="Dodaj pitanje"
                  >
                    + Dodaj pitanje
                  </button>
                </div>
                <div className="space-y-2">
                  {questions.map((q, i) => (
                    <div key={i} className="flex gap-2 items-start">
                      <div className="flex-shrink-0 w-6 h-8 flex items-center justify-center text-xs text-gray-400 font-medium">
                        {i + 1}.
                      </div>
                      <input
                        type="text"
                        value={q.text}
                        onChange={(e) => updateQuestion(i, e.target.value)}
                        placeholder={`Pitanje ${i + 1}`}
                        className={inputCls}
                        aria-label={`Pitanje ${i + 1}`}
                      />
                      <button
                        type="button"
                        onClick={() => removeQuestion(i)}
                        disabled={questions.length === 1}
                        className="flex-shrink-0 w-8 h-8 flex items-center justify-center text-gray-400 hover:text-red-500 disabled:opacity-30 focus:outline-none focus:ring-2 focus:ring-red-400 rounded"
                        aria-label={`Ukloni pitanje ${i + 1}`}
                      >
                        ✕
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              {formError && (
                <p role="alert" className="text-red-600 text-sm">
                  {formError}
                </p>
              )}

              <div className="flex justify-end gap-2 pt-1">
                <button
                  onClick={() => setShowForm(false)}
                  className="px-4 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-400"
                >
                  Odustani
                </button>
                <button
                  onClick={handleCreate}
                  disabled={formSaving}
                  className="px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {formSaving ? "Spremanje..." : "Spremi"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Responses modal */}
      {responsesModal && (
        <div
          className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="responses-modal-title"
        >
          <div className="bg-white rounded-xl shadow-xl w-full max-w-3xl max-h-[90vh] flex flex-col">
            <div className="p-5 border-b border-gray-100 flex items-center justify-between flex-shrink-0">
              <h2 id="responses-modal-title" className="font-semibold text-gray-900">
                Odgovori — {responsesModal.title}
              </h2>
              <button
                onClick={() => setResponsesModal(null)}
                className="text-gray-400 hover:text-gray-600 focus:outline-none focus:ring-2 focus:ring-gray-400 rounded"
                aria-label="Zatvori"
              >
                ✕
              </button>
            </div>
            <div className="p-5 overflow-y-auto flex-1">
              {responsesLoading && (
                <p className="text-sm text-gray-400">Učitavanje odgovora...</p>
              )}

              {!responsesLoading && responses.length === 0 && (
                <p className="text-sm text-gray-400">Nema odgovora za ovu anketu.</p>
              )}

              {!responsesLoading && responses.length > 0 && (
                <div className="space-y-4">
                  {responses.map((r) => (
                    <div key={r.id} className="border border-gray-200 rounded-lg overflow-hidden">
                      <div className="bg-gray-50 px-4 py-2 flex items-center justify-between">
                        <span className="text-sm font-medium text-gray-900">{r.student_name}</span>
                        <span className="text-xs text-gray-500">
                          {new Date(r.submitted_at).toLocaleDateString("hr-HR")}{" "}
                          {new Date(r.submitted_at).toLocaleTimeString("hr-HR", { hour: "2-digit", minute: "2-digit" })}
                        </span>
                      </div>
                      {r.answers && r.answers.length > 0 ? (
                        <table className="w-full text-sm" aria-label={`Odgovori studenta ${r.student_name}`}>
                          <thead>
                            <tr className="border-t border-gray-100 text-left text-xs text-gray-500">
                              <th className="px-4 py-2 w-1/2">Pitanje</th>
                              <th className="px-4 py-2">Odgovor</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-gray-50">
                            {r.answers.map((a, ai) => (
                              <tr key={ai} className="hover:bg-gray-50">
                                <td className="px-4 py-2 text-gray-700">{a.question_text}</td>
                                <td className="px-4 py-2 text-gray-900">{a.answer_text || <span className="text-gray-400">—</span>}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      ) : (
                        <p className="px-4 py-3 text-sm text-gray-400">Nema odgovora.</p>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
            <div className="p-4 border-t border-gray-100 flex-shrink-0 flex justify-end">
              <button
                onClick={() => setResponsesModal(null)}
                className="px-4 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-400"
              >
                Zatvori
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
