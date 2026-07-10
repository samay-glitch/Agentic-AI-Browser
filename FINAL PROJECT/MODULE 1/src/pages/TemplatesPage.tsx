import { useState } from 'react';
import { Plus, Pencil, Trash2, X, Check, FileText, Clock, Hash } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Textarea } from '@/components/ui/Textarea';
import { useTemplateStore, SavedTemplate } from '@/stores/template-store';

export function TemplatesPage() {
  const { templates, addTemplate, updateTemplate, deleteTemplate } = useTemplateStore();

  const [isAdding, setIsAdding] = useState(false);
  const [newQuestion, setNewQuestion] = useState('');
  const [newAnswer, setNewAnswer] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editQuestion, setEditQuestion] = useState('');
  const [editAnswer, setEditAnswer] = useState('');

  const handleAdd = () => {
    if (!newQuestion.trim() || !newAnswer.trim()) return;
    addTemplate(newQuestion.trim(), newAnswer.trim());
    setNewQuestion('');
    setNewAnswer('');
    setIsAdding(false);
  };

  const handleCancelAdd = () => {
    setNewQuestion('');
    setNewAnswer('');
    setIsAdding(false);
  };

  const startEditing = (template: SavedTemplate) => {
    setEditingId(template.id);
    setEditQuestion(template.question);
    setEditAnswer(template.answer);
  };

  const handleSaveEdit = () => {
    if (!editingId || !editQuestion.trim() || !editAnswer.trim()) return;
    updateTemplate(editingId, {
      question: editQuestion.trim(),
      answer: editAnswer.trim(),
    });
    setEditingId(null);
    setEditQuestion('');
    setEditAnswer('');
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setEditQuestion('');
    setEditAnswer('');
  };

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  return (
    <Card className="w-full">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="flex items-center gap-2">
          <FileText className="w-5 h-5 text-primary" />
          Saved Answers
        </CardTitle>
        {!isAdding && (
          <Button size="sm" onClick={() => setIsAdding(true)} className="flex items-center gap-1">
            <Plus className="w-4 h-4" />
            Add Template
          </Button>
        )}
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Add Template Form */}
        {isAdding && (
          <div className="rounded-lg border border-zinc-800 bg-zinc-900 p-4 space-y-3">
            <Input
              placeholder="Question (e.g. Tell us about your experience...)"
              value={newQuestion}
              onChange={(e) => setNewQuestion(e.target.value)}
            />
            <Textarea
              placeholder="Answer / Template content"
              value={newAnswer}
              onChange={(e) => setNewAnswer(e.target.value)}
              rows={4}
            />
            <div className="flex justify-end gap-2">
              <Button variant="ghost" size="sm" onClick={handleCancelAdd}>
                <X className="w-4 h-4 mr-1" />
                Cancel
              </Button>
              <Button
                size="sm"
                onClick={handleAdd}
                disabled={!newQuestion.trim() || !newAnswer.trim()}
              >
                <Check className="w-4 h-4 mr-1" />
                Save
              </Button>
            </div>
          </div>
        )}

        {/* Empty State */}
        {templates.length === 0 && !isAdding && (
          <div className="text-center py-12">
            <FileText className="w-12 h-12 text-zinc-600 mx-auto mb-4" />
            <p className="text-text-muted">
              No templates saved yet. AI-generated answers will appear here automatically.
            </p>
          </div>
        )}

        {/* Template Cards */}
        {templates.map((template) => (
          <div
            key={template.id}
            className="rounded-lg border border-zinc-800 bg-zinc-900 p-4 space-y-3"
          >
            {editingId === template.id ? (
              /* Inline Edit Mode */
              <>
                <Input
                  value={editQuestion}
                  onChange={(e) => setEditQuestion(e.target.value)}
                />
                <Textarea
                  value={editAnswer}
                  onChange={(e) => setEditAnswer(e.target.value)}
                  rows={6}
                />
                <div className="flex justify-end gap-2">
                  <Button variant="ghost" size="sm" onClick={handleCancelEdit}>
                    <X className="w-4 h-4 mr-1" />
                    Cancel
                  </Button>
                  <Button
                    size="sm"
                    onClick={handleSaveEdit}
                    disabled={!editQuestion.trim() || !editAnswer.trim()}
                  >
                    <Check className="w-4 h-4 mr-1" />
                    Save
                  </Button>
                </div>
              </>
            ) : (
              /* Display Mode */
              <>
                <div className="flex items-start justify-between gap-4">
                  <h3 className="text-sm font-medium text-text-base leading-snug">
                    {template.question}
                  </h3>
                  <div className="flex items-center gap-1 shrink-0">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => startEditing(template)}
                      className="h-8 w-8"
                    >
                      <Pencil className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => deleteTemplate(template.id)}
                      className="h-8 w-8 text-danger hover:text-danger"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
                <p className="text-sm text-text-muted leading-relaxed">
                  {template.answer.length > 100
                    ? template.answer.slice(0, 100) + '...'
                    : template.answer}
                </p>
                <div className="flex items-center gap-4 text-xs text-text-muted pt-1">
                  <span className="flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    {formatDate(template.createdAt)}
                  </span>
                  <span className="flex items-center gap-1">
                    <Hash className="w-3 h-3" />
                    Used {template.usageCount} {template.usageCount === 1 ? 'time' : 'times'}
                  </span>
                </div>
              </>
            )}
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
