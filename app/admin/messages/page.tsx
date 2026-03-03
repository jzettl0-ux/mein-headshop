'use client'

import { useState, useEffect, useRef, useMemo } from 'react'
import Link from 'next/link'
import { useSearchParams, useRouter } from 'next/navigation'
import { MessageSquare, Send, User, ArrowLeft, Search, Users, MessageCirclePlus } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { useToast } from '@/hooks/use-toast'

type DmConversation = { type: 'dm'; staff_id: string; label: string; role_hint: string; last_message: string; last_at: string; unread: number }
type GroupConversation = { type: 'group'; conversation_id: string; label: string; last_message: string; last_at: string; unread: number }
type Conversation = DmConversation | GroupConversation
type Colleague = { id: string; label: string; email: string; role_hint: string; team_role?: 'supervisor' | 'reports_to_me' | 'same_team' | null }
type Message = { id: string; from_staff_id: string; to_staff_id?: string; body: string; read_at?: string | null; created_at: string; from_label?: string }

export default function AdminMessagesPage() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const withId = searchParams.get('with')
  const conversationId = searchParams.get('conversation')
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [colleagues, setColleagues] = useState<Colleague[]>([])
  const [mySupervisorId, setMySupervisorId] = useState<string | null>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [other, setOther] = useState<{ id: string; label: string; role_hint: string } | null>(null)
  const [groupConversation, setGroupConversation] = useState<{ id: string; name: string; participants: { staff_id: string; label: string }[] } | null>(null)
  const [myStaffId, setMyStaffId] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [sending, setSending] = useState(false)
  const [reply, setReply] = useState('')
  const [search, setSearch] = useState('')
  const [showNewGroup, setShowNewGroup] = useState(false)
  const [newGroupName, setNewGroupName] = useState('')
  const [newGroupStaffIds, setNewGroupStaffIds] = useState<string[]>([])
  const [creatingGroup, setCreatingGroup] = useState(false)
  const listRef = useRef<HTMLDivElement>(null)
  const { toast } = useToast()

  useEffect(() => {
    fetch('/api/admin/staff/messages')
      .then((r) => (r.ok ? r.json() : { conversations: [], colleagues: [], my_supervisor_id: null }))
      .then((data) => {
        setConversations(data.conversations ?? [])
        setColleagues(data.colleagues ?? [])
        setMySupervisorId(data.my_supervisor_id ?? null)
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  useEffect(() => {
    if (withId) {
      setMessages([])
      setOther(null)
      setGroupConversation(null)
      fetch(`/api/admin/staff/messages?with=${withId}`)
        .then((r) => (r.ok ? r.json() : null))
        .then((data) => {
          if (data) {
            setMessages(data.messages ?? [])
            setOther(data.other ?? null)
          }
        })
        .catch(() => toast({ title: 'Nachrichten konnten nicht geladen werden', variant: 'destructive' }))
      return
    }
    if (conversationId) {
      setMessages([])
      setOther(null)
      setGroupConversation(null)
      fetch(`/api/admin/staff/messages?conversation=${conversationId}`)
        .then((r) => (r.ok ? r.json() : null))
        .then((data) => {
          if (data) {
            setMessages(data.messages ?? [])
            setGroupConversation(data.conversation ?? null)
            setMyStaffId(data.my_staff_id ?? null)
          }
        })
        .catch(() => toast({ title: 'Gruppenchat konnte nicht geladen werden', variant: 'destructive' }))
      return
    }
    setMessages([])
    setOther(null)
    setGroupConversation(null)
  }, [withId, conversationId, toast])

  useEffect(() => {
    if (listRef.current && messages.length) listRef.current.scrollTop = listRef.current.scrollHeight
  }, [messages])

  const searchLower = search.trim().toLowerCase()
  const teamColleagues = useMemo(() => colleagues.filter((c) => c.team_role != null), [colleagues])
  const teamSupervisor = useMemo(() => colleagues.filter((c) => c.team_role === 'supervisor'), [colleagues])
  const teamReportsToMe = useMemo(() => colleagues.filter((c) => c.team_role === 'reports_to_me'), [colleagues])
  const teamSameTeam = useMemo(() => colleagues.filter((c) => c.team_role === 'same_team'), [colleagues])
  const otherColleagues = useMemo(() => colleagues.filter((c) => c.team_role == null), [colleagues])
  const filteredConversations = useMemo(() => {
    if (!searchLower) return conversations
    return conversations.filter((c) => c.label.toLowerCase().includes(searchLower) || (c.type === 'dm' && c.staff_id === withId) || (c.type === 'group' && c.conversation_id === conversationId))
  }, [conversations, searchLower, withId, conversationId])

  const sendMessage = async () => {
    const body = reply.trim()
    if (!body) return
    if (conversationId) {
      setSending(true)
      try {
        const res = await fetch('/api/admin/staff/messages', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ conversation_id: conversationId, body }),
        })
        if (!res.ok) {
          const e = await res.json().catch(() => ({}))
          throw new Error(e.error || 'Senden fehlgeschlagen')
        }
        const msg = await res.json()
        setMessages((prev) => [...prev, { ...msg, from_label: myStaffId && msg.from_staff_id === myStaffId ? 'Du' : (groupConversation?.participants?.find((p) => p.staff_id === msg.from_staff_id)?.label ?? 'Du') }])
        setReply('')
        setConversations((prev) => {
          const rest = prev.filter((c) => !(c.type === 'group' && c.conversation_id === conversationId))
          const existing = prev.find((c) => c.type === 'group' && c.conversation_id === conversationId)
          const label = groupConversation?.name ?? existing?.label ?? 'Gruppenchat'
          return [{ type: 'group' as const, conversation_id: conversationId, label, last_message: body.slice(0, 80), last_at: msg.created_at, unread: 0 }, ...rest]
        })
      } catch (e) {
        toast({ title: e instanceof Error ? e.message : 'Fehler beim Senden', variant: 'destructive' })
      } finally {
        setSending(false)
      }
      return
    }
    if (!withId) return
    setSending(true)
    try {
      const res = await fetch('/api/admin/staff/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ to_staff_id: withId, body }),
      })
      if (!res.ok) {
        const e = await res.json().catch(() => ({}))
        throw new Error(e.error || 'Senden fehlgeschlagen')
      }
      const msg = await res.json()
      setMessages((prev) => [...prev, msg])
      setReply('')
      setConversations((prev) => {
        const rest = prev.filter((c) => !(c.type === 'dm' && c.staff_id === withId))
        const existing = prev.find((c) => c.type === 'dm' && c.staff_id === withId)
        const label = other?.label ?? withId.slice(0, 8)
        const role_hint = other?.role_hint ?? existing && 'role_hint' in existing ? existing.role_hint : 'Mitarbeiter'
        return [{ type: 'dm' as const, staff_id: withId, label, role_hint, last_message: body.slice(0, 80), last_at: msg.created_at, unread: 0 }, ...rest]
      })
    } catch (e) {
      toast({ title: e instanceof Error ? e.message : 'Fehler beim Senden', variant: 'destructive' })
    } finally {
      setSending(false)
    }
  }

  const createGroup = async () => {
    const name = newGroupName.trim()
    if (!name) {
      toast({ title: 'Bitte einen Namen für den Gruppenchat angeben', variant: 'destructive' })
      return
    }
    setCreatingGroup(true)
    try {
      const res = await fetch('/api/admin/staff/conversations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, staff_ids: newGroupStaffIds }),
      })
      if (!res.ok) {
        const e = await res.json().catch(() => ({}))
        throw new Error(e.error || 'Gruppe konnte nicht erstellt werden')
      }
      const data = await res.json()
      setShowNewGroup(false)
      setNewGroupName('')
      setNewGroupStaffIds([])
      router.push(`/admin/messages?conversation=${data.id}`)
      setConversations((prev) => [{ type: 'group', conversation_id: data.id, label: data.name, last_message: '', last_at: data.created_at, unread: 0 }, ...prev])
    } catch (e) {
      toast({ title: e instanceof Error ? e.message : 'Fehler', variant: 'destructive' })
    } finally {
      setCreatingGroup(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/admin/me" className="rounded p-1.5 text-luxe-silver hover:bg-luxe-gold/20 hover:text-luxe-gold">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-white">Interner Chat</h1>
          <p className="text-luxe-silver text-sm">Mit Teamleitern und Kollegen chatten. Person suchen oder in „Mein Team“ (Vorgesetzte/r, Unterstellte) finden und anschreiben.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="md:col-span-1 bg-luxe-charcoal border-luxe-gray">
          <CardHeader className="pb-2">
            <CardTitle className="text-white text-base flex items-center gap-2">
              <MessageSquare className="w-4 h-4" />
              Chat & Mitarbeiter
            </CardTitle>
            <div className="relative mt-2">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-luxe-silver" />
              <input
                type="search"
                placeholder="Person suchen (Name, E-Mail) …"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full rounded-md bg-luxe-black border border-luxe-gray py-2 pl-8 pr-3 text-sm text-white placeholder:text-luxe-silver/70 focus:outline-none focus:ring-1 focus:ring-luxe-gold/50"
              />
            </div>
          </CardHeader>
          <CardContent className="p-0">
            {loading ? (
              <p className="p-4 text-luxe-silver text-sm">Lade …</p>
            ) : (
              <ul className="divide-y divide-luxe-gray/50 max-h-[480px] overflow-y-auto">
                {!showNewGroup && (
                  <li>
                    <button
                      type="button"
                      onClick={() => setShowNewGroup(true)}
                      className="w-full flex items-center gap-2 px-4 py-2.5 text-left text-luxe-gold hover:bg-luxe-gold/10 rounded"
                    >
                      <MessageCirclePlus className="w-4 h-4" />
                      <span className="text-sm font-medium">Neuer Gruppenchat</span>
                    </button>
                  </li>
                )}
                {showNewGroup && (
                  <li className="p-4 bg-luxe-black/50 border-b border-luxe-gray/50">
                    <p className="text-xs font-semibold text-luxe-gold mb-2">Neuer Gruppenchat</p>
                    <input
                      type="text"
                      placeholder="Name des Chats"
                      value={newGroupName}
                      onChange={(e) => setNewGroupName(e.target.value)}
                      className="w-full rounded-md bg-luxe-charcoal border border-luxe-gray px-3 py-2 text-sm text-white placeholder:text-luxe-silver mb-2"
                    />
                    <p className="text-xs text-luxe-silver mb-1">Teilnehmer wählen:</p>
                    <div className="max-h-32 overflow-y-auto space-y-1 mb-2">
                      {colleagues.map((col) => (
                        <label key={col.id} className="flex items-center gap-2 text-sm text-white cursor-pointer">
                          <input
                            type="checkbox"
                            checked={newGroupStaffIds.includes(col.id)}
                            onChange={(e) => setNewGroupStaffIds((ids) => (e.target.checked ? [...ids, col.id] : ids.filter((id) => id !== col.id)))}
                            className="rounded border-luxe-gray"
                          />
                          {col.label}
                        </label>
                      ))}
                    </div>
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm" onClick={() => { setShowNewGroup(false); setNewGroupName(''); setNewGroupStaffIds([]); }} className="border-luxe-gray text-luxe-silver">
                        Abbrechen
                      </Button>
                      <Button variant="luxe" size="sm" onClick={createGroup} disabled={creatingGroup || !newGroupName.trim()}>
                        {creatingGroup ? 'Erstelle …' : 'Erstellen'}
                      </Button>
                    </div>
                  </li>
                )}
                {filteredConversations.map((c) => {
                  const isDm = c.type === 'dm'
                  const isActive = isDm ? withId === c.staff_id : conversationId === c.conversation_id
                  const href = isDm ? `/admin/messages?with=${c.staff_id}` : `/admin/messages?conversation=${c.conversation_id}`
                  return (
                    <li key={isDm ? c.staff_id : c.conversation_id}>
                      <Link
                        href={href}
                        className={`block px-4 py-3 hover:bg-luxe-gold/10 ${isActive ? 'bg-luxe-gold/20 border-l-2 border-luxe-gold' : ''}`}
                      >
                        <p className="font-medium text-white flex items-center gap-1.5">
                          {!isDm && <Users className="w-3.5 h-3.5 text-luxe-gold" />}
                          {c.label}
                        </p>
                        <p className="text-xs text-luxe-silver truncate">{c.last_message || 'Keine Nachrichten'}</p>
                        {c.unread > 0 && <span className="text-xs bg-luxe-gold text-luxe-black px-1.5 rounded">{c.unread}</span>}
                      </Link>
                    </li>
                  )
                })}
                {teamColleagues.length > 0 && (
                  <li className="px-4 py-2 pt-3">
                    <p className="text-xs font-semibold text-luxe-gold uppercase tracking-wide flex items-center gap-1">
                      <Users className="w-3.5 h-3.5" /> Mein Team
                    </p>
                  </li>
                )}
                {teamSupervisor.map((col) => {
                  if (conversations.some((c) => c.type === 'dm' && c.staff_id === col.id)) return null
                  if (searchLower && !col.label.toLowerCase().includes(searchLower) && !col.email.toLowerCase().includes(searchLower)) return null
                  return (
                    <li key={col.id}>
                      <Link href={`/admin/messages?with=${col.id}`} className="block px-4 py-2.5 hover:bg-luxe-gold/10 pl-6">
                        <p className="font-medium text-white">{col.label}</p>
                        <p className="text-xs text-luxe-silver">Vorgesetzte/r · {col.role_hint}</p>
                      </Link>
                    </li>
                  )
                })}
                {teamReportsToMe.map((col) => {
                  if (conversations.some((c) => c.type === 'dm' && c.staff_id === col.id)) return null
                  if (searchLower && !col.label.toLowerCase().includes(searchLower) && !col.email.toLowerCase().includes(searchLower)) return null
                  return (
                    <li key={col.id}>
                      <Link href={`/admin/messages?with=${col.id}`} className="block px-4 py-2.5 hover:bg-luxe-gold/10 pl-6">
                        <p className="font-medium text-white">{col.label}</p>
                        <p className="text-xs text-luxe-silver">Direkt unterstellt · {col.role_hint}</p>
                      </Link>
                    </li>
                  )
                })}
                {teamSameTeam.map((col) => {
                  if (conversations.some((c) => c.type === 'dm' && c.staff_id === col.id)) return null
                  if (searchLower && !col.label.toLowerCase().includes(searchLower) && !col.email.toLowerCase().includes(searchLower)) return null
                  return (
                    <li key={col.id}>
                      <Link href={`/admin/messages?with=${col.id}`} className="block px-4 py-2.5 hover:bg-luxe-gold/10 pl-6">
                        <p className="font-medium text-white">{col.label}</p>
                        <p className="text-xs text-luxe-silver">Gleicher Vorgesetzter · {col.role_hint}</p>
                      </Link>
                    </li>
                  )
                })}
                {otherColleagues.filter((col) => !conversations.some((c) => c.type === 'dm' && c.staff_id === col.id)).filter((col) => !searchLower || col.label.toLowerCase().includes(searchLower) || col.email.toLowerCase().includes(searchLower)).slice(0, 30).map((col) => (
                  <li key={col.id}>
                    <Link href={`/admin/messages?with=${col.id}`} className="block px-4 py-3 hover:bg-luxe-gold/10 text-luxe-silver">
                      <p className="font-medium text-white">{col.label}</p>
                      <p className="text-xs text-luxe-silver">{col.role_hint} · Neuer Chat</p>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>

        <Card className="md:col-span-2 bg-luxe-charcoal border-luxe-gray flex flex-col min-h-[420px]">
          {withId ? (
            <>
              <CardHeader className="pb-2 border-b border-luxe-gray">
                <CardTitle className="text-white text-base flex items-center gap-2">
                  <User className="w-4 h-4" />
                  {other?.label ?? 'Lade …'}
                  {other?.role_hint && <span className="text-sm font-normal text-luxe-silver">({other.role_hint})</span>}
                </CardTitle>
              </CardHeader>
              <div ref={listRef} className="flex-1 overflow-y-auto p-4 space-y-3 min-h-[200px]">
                {messages.map((m) => {
                  const isMe = !m.to_staff_id || m.from_staff_id !== withId
                  const fromLabel = (m as Message & { from_label?: string }).from_label
                  return (
                    <div key={m.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                      <div className={`max-w-[85%] rounded-lg px-3 py-2 ${isMe ? 'bg-luxe-gold/30 text-white' : 'bg-luxe-black/50 text-white border border-luxe-gray'}`}>
                        <p className="text-sm whitespace-pre-wrap">{m.body}</p>
                        <p className="text-xs opacity-70 mt-1">{new Date(m.created_at).toLocaleString('de-DE')}</p>
                      </div>
                    </div>
                  )
                })}
              </div>
              <div className="p-4 border-t border-luxe-gray flex gap-2">
                <textarea
                  value={reply}
                  onChange={(e) => setReply(e.target.value)}
                  onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(); } }}
                  placeholder="Nachricht schreiben …"
                  className="flex-1 min-h-[80px] rounded-md bg-luxe-black border border-luxe-gray px-3 py-2 text-white placeholder:text-luxe-silver resize-none"
                  rows={2}
                />
                <Button variant="luxe" onClick={sendMessage} disabled={sending || !reply.trim()} className="self-end">
                  <Send className="w-4 h-4" />
                </Button>
              </div>
            </>
          ) : conversationId && groupConversation ? (
            <>
              <CardHeader className="pb-2 border-b border-luxe-gray">
                <CardTitle className="text-white text-base flex items-center gap-2">
                  <Users className="w-4 h-4 text-luxe-gold" />
                  {groupConversation.name}
                </CardTitle>
                <p className="text-xs text-luxe-silver mt-1">
                  {groupConversation.participants.map((p) => p.label).join(', ')}
                </p>
              </CardHeader>
              <div ref={listRef} className="flex-1 overflow-y-auto p-4 space-y-3 min-h-[200px]">
                {messages.map((m) => {
                  const isMe = m.from_staff_id === myStaffId
                  const fromLabel = (m as Message & { from_label?: string }).from_label
                  return (
                    <div key={m.id} className="flex flex-col">
                      <p className={`text-xs text-luxe-silver mb-0.5 ${fromLabel === 'Du' || isMe ? 'text-right' : ''}`}>{fromLabel ?? 'Unbekannt'}</p>
                      <div className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                        <div className={`max-w-[85%] rounded-lg px-3 py-2 ${isMe ? 'bg-luxe-gold/30 text-white' : 'bg-luxe-black/50 text-white border border-luxe-gray'}`}>
                          <p className="text-sm whitespace-pre-wrap">{m.body}</p>
                          <p className="text-xs opacity-70 mt-1">{new Date(m.created_at).toLocaleString('de-DE')}</p>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
              <div className="p-4 border-t border-luxe-gray flex gap-2">
                <textarea
                  value={reply}
                  onChange={(e) => setReply(e.target.value)}
                  onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(); } }}
                  placeholder="Nachricht an die Gruppe …"
                  className="flex-1 min-h-[80px] rounded-md bg-luxe-black border border-luxe-gray px-3 py-2 text-white placeholder:text-luxe-silver resize-none"
                  rows={2}
                />
                <Button variant="luxe" onClick={sendMessage} disabled={sending || !reply.trim()} className="self-end">
                  <Send className="w-4 h-4" />
                </Button>
              </div>
            </>
          ) : (withId || conversationId) ? (
            <CardContent className="flex-1 flex items-center justify-center text-luxe-silver">
              <p>Lade Konversation …</p>
            </CardContent>
          ) : (
            <CardContent className="flex-1 flex items-center justify-center text-luxe-silver">
              <p>Wähle links eine Konversation, einen Mitarbeiter oder erstelle einen neuen Gruppenchat.</p>
            </CardContent>
          )}
        </Card>
      </div>
    </div>
  )
}
