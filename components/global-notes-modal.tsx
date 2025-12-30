import React, { useState, useEffect, useMemo } from 'react';

interface GlobalNotesModalProps {
  notes: string;
  onSave: (notes: string) => void;
  onClose: () => void;
  completedTodos?: Set<number>;
  onTodoToggle?: (index: number) => void;
}

interface TodoItem {
  text: string;
  completed: boolean;
}

export function GlobalNotesModal({ notes, onSave, onClose, completedTodos, onTodoToggle }: GlobalNotesModalProps) {
  const [todos, setTodos] = useState<TodoItem[]>(() => {
    const lines = notes ? notes.split('\n').filter(n => n.trim() !== '') : [];
    return lines.map(line => {
      const isCompleted = line.startsWith('[x]');
      return {
        text: isCompleted ? line.substring(3).trim() : line,
        completed: isCompleted
      };
    });
  });
  const [newTodo, setNewTodo] = useState('');

  const handleAddTodo = () => {
    if (newTodo.trim() !== '') {
      setTodos([...todos, { text: newTodo, completed: false }]);
      setNewTodo('');
    }
  };

  const handleDeleteTodo = (index: number) => {
    const updatedTodos = todos.filter((_, i) => i !== index);
    setTodos(updatedTodos);
  };

  const handleToggleTodo = (index: number) => {
    if (onTodoToggle) {
      onTodoToggle(index);
    }
    const updatedTodos = todos.map((todo, i) =>
      i === index ? { ...todo, completed: !todo.completed } : todo
    );
    setTodos(updatedTodos);
  };

  const handleSave = () => {
    const formattedTodos = todos.map(todo =>
      todo.completed ? `[x] ${todo.text}` : todo.text
    ).join('\n');
    onSave(formattedTodos);
    onClose();
  };

  useEffect(() => {
    if (completedTodos && completedTodos.size > 0) {
      const updatedTodos = todos.map((todo, index) => ({
        ...todo,
        completed: completedTodos.has(index)
      }));
      setTodos(updatedTodos);
    }
  }, [completedTodos]);

  const memoizedTodos = useMemo(() => todos, [todos]);

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <div className="bg-card rounded-lg p-6 w-full max-w-md border border-border">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold text-foreground">Список дел</h2>
          <button
            onClick={onClose}
            className="text-muted-foreground hover:text-foreground"
          >
            ×
          </button>
        </div>

        <div className="space-y-4">
          <div className="flex gap-2">
            <input
              type="text"
              value={newTodo}
              onChange={(e) => setNewTodo(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleAddTodo()}
              placeholder="Добавить новую задачу"
              className="flex-1 p-2 border border-border rounded-lg bg-background text-foreground"
            />
            <button
              onClick={handleAddTodo}
              className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
            >
              Добавить
            </button>
          </div>

          <div className="space-y-2 max-h-64 overflow-y-auto">
            {memoizedTodos.map((todo, index) => (
              <div key={index} className="flex items-center gap-2 p-2 border border-border rounded-lg bg-background">
                <input
                  type="checkbox"
                  checked={completedTodos ? completedTodos.has(index) : todo.completed}
                  onChange={() => handleToggleTodo(index)}
                  className="h-4 w-4"
                />
                <span
                  className={`flex-1 text-foreground ${completedTodos ? completedTodos.has(index) : todo.completed ? 'line-through text-muted-foreground' : ''}`}
                >
                  {todo.text}
                </span>
                <button
                  onClick={() => handleDeleteTodo(index)}
                  className="text-muted-foreground hover:text-foreground"
                >
                  ×
                </button>
              </div>
            ))}
          </div>
        </div>

        <div className="flex justify-end gap-2 mt-6">
          <button
            onClick={onClose}
            className="px-4 py-2 border border-border rounded-lg hover:bg-muted/50 transition-colors"
          >
            Отмена
          </button>
          <button
            onClick={handleSave}
            className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
          >
            Сохранить
          </button>
        </div>
      </div>
    </div>
  );
}