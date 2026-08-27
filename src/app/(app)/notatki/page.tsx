'use client';

import React, { useState, useMemo } from 'react';
import { PageHeader } from '@/components/page-header';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
  CardFooter,
} from '@/components/ui/card';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { useAppContext } from '@/context/app-context';
import { cn } from '@/lib/utils';
import { format, isPast, differenceInHours, isToday, isTomorrow } from 'date-fns';
import { pl } from 'date-fns/locale';
import {
  NotebookPen,
  Plus,
  Trash2,
  CheckCircle2,
  Clock,
  AlertCircle,
  CalendarDays,
  StickyNote,
  Bell,
  BellOff,
} from 'lucide-react';
import type { Note } from '@/lib/types';

function parseDueDateTime(note: Note): Date {
  return new Date(note.dueDate + 'T' + note.dueTime + ':00');
}

function getUrgency(note: Note): 'overdue' | 'soon' | 'future' {
  const due = parseDueDateTime(note);
  if (isPast(due)) return 'overdue';
  const hoursLeft = differenceInHours(due, new Date());
  if (hoursLeft <= 24) return 'soon';
  return 'future';
}

function formatDueLabel(note: Note): string {
  const due = parseDueDateTime(note);
  if (isToday(due)) return 'Dzis o ' + note.dueTime;
  if (isTomorrow(due)) return 'Jutro o ' + note.dueTime;
  return format(due, 'd MMM yyyy', { locale: pl }) + ' o ' + note.dueTime;
}

function UrgencyBadge({ note }: { note: Note }) {
  if (note.read) {
    return (
      <Badge variant="secondary" className="gap-1">
        <BellOff className="h-3 w-3" />
        Przeczytane
      </Badge>
    );
  }
  const urgency = getUrgency(note);
  if (urgency === 'overdue') {
    return (
      <Badge variant="destructive" className="gap-1">
        <AlertCircle className="h-3 w-3" />
        Przeterminowane
      </Badge>
    );
  }
  if (urgency === 'soon') {
    return (
      <Badge className="gap-1 bg-amber-500 text-white hover:bg-amber-500/90">
        <Clock className="h-3 w-3" />
        Wkrotce
      </Badge>
    );
  }
  return (
    <Badge variant="outline" className="gap-1">
      <Bell className="h-3 w-3" />
      Zaplanowane
    </Badge>
  );
}

function NoteCard({ note, onMarkRead, onDelete }: {
  note: Note;
  onMarkRead: (id: string) => void;
  onDelete: (id: string) => void;
}) {
  const urgency = note.read ? 'read' : getUrgency(note);

  const cardClass = cn(
    'relative transition-all duration-200 border',
    !note.read && urgency === 'overdue' && 'border-destructive/50 bg-destructive/5 dark:bg-destructive/10',
    !note.read && urgency === 'soon' && 'border-amber-400/50 bg-amber-50/50 dark:bg-amber-900/10',
    note.read && 'opacity-70',
  );

  const timelineClass = cn(
    'absolute left-0 top-0 bottom-0 w-1 rounded-l-xl',
    !note.read && urgency === 'overdue' && 'bg-destructive',
    !note.read && urgency === 'soon' && 'bg-amber-500',
    !note.read && urgency === 'future' && 'bg-primary',
    note.read && 'bg-muted-foreground/30',
  );

  return (
    <Card className={cardClass}>
      <div className={timelineClass} />
      <CardHeader className="pl-5 pb-2">
        <div className="flex items-start justify-between gap-2">
          <CardTitle className="text-base leading-tight">{note.title}</CardTitle>
          <UrgencyBadge note={note} />
        </div>
        <CardDescription className="flex items-center gap-1.5 text-xs mt-1">
          <CalendarDays className="h-3.5 w-3.5" />
          {formatDueLabel(note)}
        </CardDescription>
      </CardHeader>

      {note.content && (
        <CardContent className="pl-5 pb-2">
          <p className="text-sm text-muted-foreground whitespace-pre-wrap">{note.content}</p>
        </CardContent>
      )}

      <CardFooter className="pl-5 gap-2 pb-3">
        {!note.read && (
          <Button
            size="sm"
            variant="outline"
            className="gap-1.5 text-xs h-7"
            onClick={() => onMarkRead(note.id)}
          >
            <CheckCircle2 className="h-3.5 w-3.5 text-green-500" />
            Oznacz jako przeczytane
          </Button>
        )}

        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button
              size="sm"
              variant="ghost"
              className="gap-1.5 text-xs h-7 text-muted-foreground hover:text-destructive ml-auto"
            >
              <Trash2 className="h-3.5 w-3.5" />
              Usun
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Usunac notatke?</AlertDialogTitle>
              <AlertDialogDescription>
                Tej operacji nie mozna cofnac. Notatka zostanie trwale usunieta.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Anuluj</AlertDialogCancel>
              <AlertDialogAction
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                onClick={() => onDelete(note.id)}
              >
                Usun
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </CardFooter>
    </Card>
  );
}

function EmptyState({ message }: { message: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <StickyNote className="h-12 w-12 text-muted-foreground/40 mb-4" />
      <p className="text-muted-foreground text-sm">{message}</p>
    </div>
  );
}

export default function NotatkiPage() {
  const { notes, saveNote, markNoteAsRead, deleteNote } = useAppContext();

  const today = format(new Date(), 'yyyy-MM-dd');
  const nowTime = format(new Date(), 'HH:mm');

  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [dueDate, setDueDate] = useState(today);
  const [dueTime, setDueTime] = useState(nowTime);
  const [isSaving, setIsSaving] = useState(false);
  const [activeTab, setActiveTab] = useState('all');

  const unreadCount = useMemo(() => notes.filter((n: Note) => !n.read).length, [notes]);
  const readCount = useMemo(() => notes.filter((n: Note) => n.read).length, [notes]);
  const overdueCount = useMemo(() =>
    notes.filter((n: Note) => !n.read && isPast(parseDueDateTime(n))).length,
    [notes]
  );

  const filteredNotes = useMemo(() => {
    switch (activeTab) {
      case 'unread': return notes.filter((n: Note) => !n.read);
      case 'read': return notes.filter((n: Note) => n.read);
      default: return notes;
    }
  }, [notes, activeTab]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !dueDate || !dueTime) return;
    setIsSaving(true);
    try {
      await saveNote({ title: title.trim(), content: content.trim(), dueDate, dueTime });
      setTitle('');
      setContent('');
      setDueDate(today);
      setDueTime(nowTime);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="flex flex-col gap-6 p-4 md:p-6 max-w-5xl mx-auto w-full">
      <PageHeader
        title="Notatki"
        description="Twoje zadania i przypomnienia z powiadomieniami email"
        icon={<NotebookPen className="h-5 w-5" />}
      />

      {(unreadCount > 0 || overdueCount > 0) && (
        <div className="flex flex-wrap gap-2">
          {overdueCount > 0 && (
            <Badge variant="destructive" className="gap-1.5">
              <AlertCircle className="h-3.5 w-3.5" />
              {overdueCount} przeterminowane
            </Badge>
          )}
          {unreadCount > 0 && (
            <Badge variant="secondary" className="gap-1.5">
              <Bell className="h-3.5 w-3.5" />
              {unreadCount} nieprzeczytane
            </Badge>
          )}
        </div>
      )}

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <Plus className="h-4 w-4" />
            Nowa notatka
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form id="note-form" onSubmit={handleSubmit} className="flex flex-col gap-3">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="note-title">Tytul *</Label>
              <Input
                id="note-title"
                placeholder="Np. Sprawdzic umowe pracownika..."
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
                maxLength={120}
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <Label htmlFor="note-content">Opis (opcjonalnie)</Label>
              <Textarea
                id="note-content"
                placeholder="Dodatkowe szczegoly..."
                value={content}
                onChange={(e) => setContent(e.target.value)}
                rows={3}
                maxLength={1000}
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="note-date">Data wykonania *</Label>
                <Input
                  id="note-date"
                  type="date"
                  value={dueDate}
                  onChange={(e) => setDueDate(e.target.value)}
                  required
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="note-time">Godzina *</Label>
                <Input
                  id="note-time"
                  type="time"
                  value={dueTime}
                  onChange={(e) => setDueTime(e.target.value)}
                  required
                />
              </div>
            </div>

            <div className="flex justify-end pt-1">
              <Button
                id="note-submit"
                type="submit"
                disabled={isSaving || !title.trim()}
                className="gap-2"
              >
                <Plus className="h-4 w-4" />
                {isSaving ? 'Zapisywanie...' : 'Dodaj notatke'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="all" id="tab-all">
            Wszystkie ({notes.length})
          </TabsTrigger>
          <TabsTrigger value="unread" id="tab-unread">
            Nieprzeczytane ({unreadCount})
          </TabsTrigger>
          <TabsTrigger value="read" id="tab-read">
            Przeczytane ({readCount})
          </TabsTrigger>
        </TabsList>

        <TabsContent value={activeTab} className="mt-4">
          {filteredNotes.length === 0 ? (
            <EmptyState
              message={
                activeTab === 'all'
                  ? 'Brak notatek. Dodaj pierwsza powyzej.'
                  : activeTab === 'unread'
                  ? 'Brak nieprzeczytanych notatek. Wszystko pod kontrola!'
                  : 'Brak przeczytanych notatek.'
              }
            />
          ) : (
            <div className="flex flex-col gap-3">
              {filteredNotes.map((note: Note) => (
                <NoteCard
                  key={note.id}
                  note={note}
                  onMarkRead={markNoteAsRead}
                  onDelete={deleteNote}
                />
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
