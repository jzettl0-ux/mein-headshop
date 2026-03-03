'use client'

import { useState, useEffect } from 'react'
import { Lightbulb, Plus, Loader2, Pencil, Trash2, ChevronDown, ChevronRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useToast } from '@/hooks/use-toast'

type Quiz = { quiz_id: string; title: string; target_audience: string | null; is_active: boolean }
type Question = { question_id: string; question_text: string; ui_control_type: string; sort_order: number | null; answers: Array<{ answer_id: string; answer_label: string; associated_jsonb_filter: unknown; icon_url: string | null }> }
type QuizFull = Quiz & { questions: Question[] }

const UI_LABELS: Record<string, string> = { IMAGE_CARDS: 'Bildkarten', SLIDER: 'Slider', BUTTONS: 'Buttons' }

export default function AdminQuizzesPage() {
  const [list, setList] = useState<Quiz[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [showForm, setShowForm] = useState(false)
  const [newTitle, setNewTitle] = useState('')
  const [newAudience, setNewAudience] = useState('')
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [fullQuiz, setFullQuiz] = useState<QuizFull | null>(null)
  const [editingQuizId, setEditingQuizId] = useState<string | null>(null)
  const [editTitle, setEditTitle] = useState('')
  const [newQuestionQuizId, setNewQuestionQuizId] = useState<string | null>(null)
  const [newQuestionText, setNewQuestionText] = useState('')
  const [newQuestionType, setNewQuestionType] = useState('BUTTONS')
  const { toast } = useToast()

  const loadList = () => {
    fetch('/api/admin/quizzes')
      .then((r) => (r.ok ? r.json() : []))
      .then((d) => setList(Array.isArray(d) ? d : []))
      .catch(() => setList([]))
  }

  useEffect(() => {
    loadList()
    setLoading(false)
  }, [])

  useEffect(() => {
    if (!expandedId) {
      setFullQuiz(null)
      return
    }
    fetch(`/api/admin/quizzes/${expandedId}`)
      .then((r) => (r.ok ? r.json() : null))
      .then(setFullQuiz)
      .catch(() => setFullQuiz(null))
  }, [expandedId])

  const handleCreateQuiz = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newTitle.trim()) {
      toast({ title: 'Titel angeben', variant: 'destructive' })
      return
    }
    setSaving(true)
    try {
      const res = await fetch('/api/admin/quizzes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: newTitle.trim(), target_audience: newAudience.trim() || null, is_active: true }),
      })
      if (!res.ok) throw new Error((await res.json()).error || 'Fehler')
      toast({ title: 'Quiz angelegt' })
      setShowForm(false)
      setNewTitle('')
      setNewAudience('')
      loadList()
    } catch (err: any) {
      toast({ title: err.message || 'Fehler', variant: 'destructive' })
    } finally {
      setSaving(false)
    }
  }

  const handleUpdateQuiz = async (quizId: string) => {
    setSaving(true)
    try {
      const res = await fetch(`/api/admin/quizzes/${quizId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: editTitle.trim(), target_audience: newAudience.trim() || null }),
      })
      if (!res.ok) throw new Error((await res.json()).error || 'Fehler')
      toast({ title: 'Quiz gespeichert' })
      setEditingQuizId(null)
      if (expandedId === quizId) fetch(`/api/admin/quizzes/${quizId}`).then((r) => r.ok && r.json()).then(setFullQuiz)
      loadList()
    } catch (err: any) {
      toast({ title: err.message || 'Fehler', variant: 'destructive' })
    } finally {
      setSaving(false)
    }
  }

  const handleDeleteQuiz = async (quizId: string) => {
    if (!confirm('Quiz und alle Fragen/Antworten löschen?')) return
    setSaving(true)
    try {
      const res = await fetch(`/api/admin/quizzes/${quizId}`, { method: 'DELETE' })
      if (!res.ok) throw new Error((await res.json()).error || 'Fehler')
      toast({ title: 'Quiz gelöscht' })
      if (expandedId === quizId) setExpandedId(null)
      loadList()
    } catch (err: any) {
      toast({ title: err.message || 'Fehler', variant: 'destructive' })
    } finally {
      setSaving(false)
    }
  }

  const handleAddQuestion = async (e: React.FormEvent, quizId?: string) => {
    e.preventDefault()
    const qid = quizId ?? newQuestionQuizId
    if (!qid || !newQuestionText.trim()) {
      toast({ title: 'Quiz und Fragetext angeben', variant: 'destructive' })
      return
    }
    setSaving(true)
    try {
      const res = await fetch('/api/admin/quiz-questions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ quiz_id: qid, question_text: newQuestionText.trim(), ui_control_type: newQuestionType }),
      })
      if (!res.ok) throw new Error((await res.json()).error || 'Fehler')
      toast({ title: 'Frage hinzugefügt' })
      setNewQuestionQuizId(null)
      setNewQuestionText('')
      if (expandedId === qid) fetch(`/api/admin/quizzes/${qid}`).then((r) => r.ok && r.json()).then(setFullQuiz)
    } catch (err: any) {
      toast({ title: err.message || 'Fehler', variant: 'destructive' })
    } finally {
      setSaving(false)
    }
  }

  const handleDeleteQuestion = async (questionId: string) => {
    if (!confirm('Frage und alle Antworten löschen?')) return
    setSaving(true)
    try {
      const res = await fetch(`/api/admin/quiz-questions/${questionId}`, { method: 'DELETE' })
      if (!res.ok) throw new Error((await res.json()).error || 'Fehler')
      toast({ title: 'Frage gelöscht' })
      if (fullQuiz) fetch(`/api/admin/quizzes/${fullQuiz.quiz_id}`).then((r) => r.ok && r.json()).then(setFullQuiz)
    } catch (err: any) {
      toast({ title: err.message || 'Fehler', variant: 'destructive' })
    } finally {
      setSaving(false)
    }
  }

  const handleAddAnswer = async (questionId: string, label: string) => {
    if (!label.trim()) return
    setSaving(true)
    try {
      const res = await fetch('/api/admin/quiz-answers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ question_id: questionId, answer_label: label.trim(), associated_jsonb_filter: {} }),
      })
      if (!res.ok) throw new Error((await res.json()).error || 'Fehler')
      toast({ title: 'Antwort hinzugefügt' })
      if (fullQuiz) fetch(`/api/admin/quizzes/${fullQuiz.quiz_id}`).then((r) => r.ok && r.json()).then(setFullQuiz)
    } catch (err: any) {
      toast({ title: err.message || 'Fehler', variant: 'destructive' })
    } finally {
      setSaving(false)
    }
  }

  const handleDeleteAnswer = async (answerId: string) => {
    setSaving(true)
    try {
      const res = await fetch(`/api/admin/quiz-answers/${answerId}`, { method: 'DELETE' })
      if (!res.ok) throw new Error((await res.json()).error || 'Fehler')
      toast({ title: 'Antwort gelöscht' })
      if (fullQuiz) fetch(`/api/admin/quizzes/${fullQuiz.quiz_id}`).then((r) => r.ok && r.json()).then(setFullQuiz)
    } catch (err: any) {
      toast({ title: err.message || 'Fehler', variant: 'destructive' })
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[200px]">
        <Loader2 className="w-8 h-8 animate-spin text-luxe-primary" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <Lightbulb className="w-7 h-7 text-luxe-primary" />
            Guided Selling (Quizzes)
          </h1>
          <p className="text-luxe-silver text-sm mt-1">
            Digitaler Sommelier: Quiz mit Fragen und Antworten, Filter-JSON pro Antwort.
          </p>
        </div>
        <Button variant="luxe" onClick={() => setShowForm(!showForm)}>
          <Plus className="w-5 h-5 mr-2" />
          {showForm ? 'Abbrechen' : 'Neues Quiz'}
        </Button>
      </div>

      {showForm && (
        <Card className="bg-luxe-charcoal border-luxe-gray">
          <CardHeader><CardTitle>Neues Quiz</CardTitle></CardHeader>
          <CardContent>
            <form onSubmit={handleCreateQuiz} className="flex flex-wrap gap-4">
              <div>
                <Label>Titel</Label>
                <Input value={newTitle} onChange={(e) => setNewTitle(e.target.value)} placeholder="z. B. Welcher Vape passt zu dir?" className="bg-luxe-black border-luxe-gray w-64" />
              </div>
              <div>
                <Label>Zielgruppe (optional)</Label>
                <Input value={newAudience} onChange={(e) => setNewAudience(e.target.value)} placeholder="z. B. Einsteiger" className="bg-luxe-black border-luxe-gray w-48" />
              </div>
              <div className="flex items-end">
                <Button type="submit" disabled={saving}>{saving ? <Loader2 className="w-4 h-4 animate-spin" /> : null} Anlegen</Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      <Card className="bg-luxe-charcoal border-luxe-gray">
        <CardHeader><CardTitle>Quizzes</CardTitle></CardHeader>
        <CardContent>
          {list.length === 0 ? (
            <p className="text-luxe-silver">Noch keine Quizzes. Legen Sie eines an.</p>
          ) : (
            <div className="space-y-2">
              {list.map((q) => (
                <div key={q.quiz_id} className="rounded-lg border border-luxe-gray bg-luxe-black/50">
                  <div className="flex items-center gap-2 p-3">
                    <button type="button" onClick={() => setExpandedId(expandedId === q.quiz_id ? null : q.quiz_id)} className="p-1">
                      {expandedId === q.quiz_id ? <ChevronDown className="w-5 h-5" /> : <ChevronRight className="w-5 h-5" />}
                    </button>
                    {editingQuizId === q.quiz_id ? (
                      <>
                        <Input value={editTitle} onChange={(e) => setEditTitle(e.target.value)} className="h-9 w-64 bg-luxe-black border-luxe-gray" />
                        <Button size="sm" onClick={() => handleUpdateQuiz(q.quiz_id)} disabled={saving}>Speichern</Button>
                        <Button size="sm" variant="outline" onClick={() => setEditingQuizId(null)}>Abbrechen</Button>
                      </>
                    ) : (
                      <>
                        <span className="font-medium">{q.title}</span>
                        {q.target_audience && <span className="text-sm text-luxe-silver">({q.target_audience})</span>}
                        {!q.is_active && <span className="text-amber-500 text-sm">Inaktiv</span>}
                        <Button variant="ghost" size="sm" onClick={() => { setEditingQuizId(q.quiz_id); setEditTitle(q.title); }}><Pencil className="w-4 h-4" /></Button>
                        <Button variant="ghost" size="sm" className="text-red-400" onClick={() => handleDeleteQuiz(q.quiz_id)}><Trash2 className="w-4 h-4" /></Button>
                      </>
                    )}
                  </div>
                  {expandedId === q.quiz_id && fullQuiz?.quiz_id === q.quiz_id && (
                    <div className="border-t border-luxe-gray p-4 space-y-4">
                      {fullQuiz.questions.length === 0 ? (
                        <p className="text-sm text-luxe-silver">Keine Fragen. Fügen Sie eine Frage hinzu.</p>
                      ) : (
                        fullQuiz.questions.map((qu) => (
                          <div key={qu.question_id} className="pl-4 border-l-2 border-luxe-gray">
                            <div className="flex items-center justify-between gap-2">
                              <span className="font-medium">{qu.question_text}</span>
                              <span className="text-xs text-luxe-silver">{UI_LABELS[qu.ui_control_type] ?? qu.ui_control_type}</span>
                              <Button variant="ghost" size="sm" className="text-red-400" onClick={() => handleDeleteQuestion(qu.question_id)}>Frage löschen</Button>
                            </div>
                            <ul className="mt-2 space-y-1 text-sm text-luxe-silver">
                              {qu.answers.map((a) => (
                                <li key={a.answer_id} className="flex items-center gap-2">
                                  {a.answer_label}
                                  <Button variant="ghost" size="sm" className="text-red-400 h-6 px-1" onClick={() => handleDeleteAnswer(a.answer_id)}>×</Button>
                                </li>
                              ))}
                            </ul>
                            <form className="mt-2 flex gap-2" onSubmit={(e) => { e.preventDefault(); const input = e.currentTarget.querySelector<HTMLInputElement>('input[name="newAnswer"]'); if (input) { handleAddAnswer(qu.question_id, input.value); input.value = ''; } }}>
                              <Input name="newAnswer" placeholder="Neue Antwort" className="h-8 w-48 bg-luxe-black border-luxe-gray text-sm" />
                              <Button type="submit" size="sm" disabled={saving}>Antwort hinzufügen</Button>
                            </form>
                          </div>
                        ))
                      )}
                      <form onSubmit={(e) => handleAddQuestion(e, q.quiz_id)} className="flex flex-wrap gap-3 items-end pt-2 border-t border-luxe-gray">
                        <div>
                          <Label className="text-xs">Neue Frage</Label>
                          <Input value={newQuestionText} onChange={(e) => setNewQuestionText(e.target.value)} placeholder="Frage?" className="h-9 w-64 bg-luxe-black border-luxe-gray" />
                        </div>
                        <div>
                          <Label className="text-xs">Darstellung</Label>
                          <select value={newQuestionType} onChange={(e) => setNewQuestionType(e.target.value)} className="h-9 px-2 rounded bg-luxe-black border border-luxe-gray text-foreground text-sm">
                            {Object.entries(UI_LABELS).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
                          </select>
                        </div>
                        <Button type="submit" disabled={saving}>Frage hinzufügen</Button>
                      </form>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
