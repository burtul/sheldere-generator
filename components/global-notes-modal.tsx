import React, { useEffect, useMemo, useState, useCallback } from 'react';

interface GlobalNotesModalProps {
  notes: string;
  onSave: (notes: string) => void;
  onClose: () => void;
  /** Если внешний компонент передаёт состояние завершённых задач, то это Set индексов задач */
  completedTodos?: Set<number>;
  /** Сигнатура: индекс задачи */
  onTodoToggle?: (index: number) => void;
  /** Callback для обновления состояния задач */
  onTodosUpdate?: (todos: TodoItem[]) => void;
}

interface TodoItem {
  id: string;
  text: string;
  completed: boolean;
}

const makeId = () => Date.now().toString(36) + Math.random().toString(36).slice(2);

export function GlobalNotesModal({
  notes,
  onSave,
  onClose,
  completedTodos,
  onTodoToggle,
  onTodosUpdate
}: GlobalNotesModalProps) {
  // Инициализация todos из notes
  const [todos, setTodos] = useState<TodoItem[]>(() => {
    const lines = notes ? notes.split('\n').filter(n => n.trim() !== '') : [];
    return lines.map((line, index) => {
      const hasXPrefix = line.trim().startsWith('[x]');
      const text = hasXPrefix ? line.trim().substring(3).trim() : line.trim();
      const isCompletedFromParent = completedTodos?.has(index) || false;
      
      return {
        id: makeId(),
        text,
        completed: isCompletedFromParent || hasXPrefix
      };
    });
  });

  const [newTodo, setNewTodo] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingText, setEditingText] = useState('');

  // Добавление задачи
  const handleAddTodo = useCallback(() => {
    const text = newTodo.trim();
    if (text === '') return;
    const item: TodoItem = { 
      id: makeId(), 
      text, 
      completed: false 
    };
    setTodos(prev => [...prev, item]);
    setNewTodo('');
  }, [newTodo]);

  // Редактирование
  const handleEditTodoById = useCallback((id: string, newText: string) => {
    const text = newText.trim();
    if (text === '') return;
    setTodos(prev => prev.map(t => (t.id === id ? { ...t, text } : t)));
  }, []);

  // Удаление
  const handleDeleteTodoById = useCallback((id: string) => {
    setTodos(prev => prev.filter(t => t.id !== id));
  }, []);

   // Переключение чекбокса
  const handleToggleTodoById = useCallback((id: string) => {
    setTodos(prev => {
      const updated = prev.map(t => 
        t.id === id ? { ...t, completed: !t.completed } : t
      );
       
      return updated;
    });
  }, []);

   // Перемещение вверх
  const handleMoveTodoUp = useCallback((id: string) => {
    setTodos(prev => {
      const currentIndex = prev.findIndex(t => t.id === id);
      if (currentIndex <= 0) return prev;
       
      const newTodos = [...prev];
      [newTodos[currentIndex], newTodos[currentIndex - 1]] = 
      [newTodos[currentIndex - 1], newTodos[currentIndex]];
       
      return newTodos;
    });
  }, []);

   // Перемещение вниз
  const handleMoveTodoDown = useCallback((id: string) => {
    setTodos(prev => {
      const currentIndex = prev.findIndex(t => t.id === id);
      if (currentIndex < 0 || currentIndex >= prev.length - 1) return prev;
       
      const newTodos = [...prev];
      [newTodos[currentIndex], newTodos[currentIndex + 1]] = 
      [newTodos[currentIndex + 1], newTodos[currentIndex]];
       
      return newTodos;
    });
  }, []);

   // Сохранение
  const handleSave = useCallback(() => {
    // Сохраняем только тексты
    const formatted = todos.map(t => t.text).join('\n');
    onSave(formatted);
      
    // Уведомляем родителя о текущем состоянии задач
    const completedIndices = new Set<number>();
    todos.forEach((todo, index) => {
      if (todo.completed) {
        completedIndices.add(index);
      }
    });
    onTodosUpdate?.(todos);
    onClose();
  }, [todos, onSave, onClose, onTodosUpdate]);

  // Коммит редактирования
  const commitEdit = useCallback(() => {
    if (!editingId) return;
    if (editingText.trim() !== '') handleEditTodoById(editingId, editingText);
    setEditingId(null);
  }, [editingId, editingText, handleEditTodoById]);

  const remainingCount = useMemo(() => 
    todos.filter(t => !t.completed).length, 
    [todos]
  );


  return (
    <div className="fixed inset-0 flex items-center justify-center p-4 z-50" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
      <div className="rounded-lg p-6 w-full max-w-md border border-border" style={{ backgroundColor: 'var(--md-sys-color-surface, #FFFBFE)' }}>
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold text-foreground">Список дел</h2>
          <button onClick={onClose} aria-label="Закрыть" className="text-muted-foreground hover:text-foreground">×</button>
        </div>

        <div className="space-y-4">
          <div className="flex gap-2">
            <input
              type="text"
              value={newTodo}
              onChange={(e) => setNewTodo(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleAddTodo()}
              placeholder="Добавить новую задачу"
              className="flex-1 p-2 border border-border rounded-lg bg-background text-foreground"
              aria-label="Новая задача"
            />
            <button
              onClick={handleAddTodo}
              className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
            >
              Добавить
            </button>
          </div>

          <div className="text-sm text-muted-foreground">
            Осталось: <strong className="text-foreground">{remainingCount}</strong>
          </div>

          <div className="space-y-2 max-h-64 overflow-y-auto">
            {todos.map((todo, index) => (
              <div key={todo.id} className="flex items-center gap-2 p-2 border border-border rounded-lg bg-background">
                <input
                  type="checkbox"
                  checked={todo.completed}
                  onChange={() => handleToggleTodoById(todo.id)}
                  className="h-4 w-4"
                  aria-label={`Отметить задачу ${todo.text}`}
                />

                 {editingId === todo.id ? (
                   <input
                     type="text"
                     value={editingText}
                     onChange={(e) => setEditingText(e.target.value)}
                     onBlur={commitEdit}
                     onKeyDown={(e) => {
                       if (e.key === 'Enter') commitEdit();
                       if (e.key === 'Escape') setEditingId(null);
                     }}
                     className="flex-1 p-1 border border-border rounded-lg bg-background text-foreground"
                     aria-label="Редактирование задачи"
                     autoFocus
                   />
                 ) : (
                   <span
                     className={`flex-1 text-foreground ${todo.completed ? 'line-through text-muted-foreground' : ''}`}
                     onDoubleClick={() => {
                       setEditingId(todo.id);
                       setEditingText(todo.text);
                     }}
                     title="Двойной клик для редактирования"
                   >
                     {todo.text}
                   </span>
                 )}

                <button
                  onClick={() => handleMoveTodoUp(todo.id)}
                  className="text-muted-foreground hover:text-foreground"
                  disabled={index === 0}
                  aria-label="Переместить вверх"
                  title="Вверх"
                >
                  ↑
                </button>
                <button
                  onClick={() => handleMoveTodoDown(todo.id)}
                  className="text-muted-foreground hover:text-foreground"
                  disabled={index === todos.length - 1}
                  aria-label="Переместить вниз"
                  title="Вниз"
                >
                  ↓
                </button>
                {editingId === todo.id && (
                  <button
                    onClick={commitEdit}
                    className="text-muted-foreground hover:text-foreground"
                    aria-label="Сохранить изменения"
                    title="Сохранить"
                  >
                    💾
                  </button>
                )}
                 <button
                   onClick={() => {
                     setEditingId(todo.id);
                     setEditingText(todo.text);
                   }}
                   className="text-muted-foreground hover:text-foreground"
                   aria-label="Редактировать"
                   title="Редактировать"
                 >
                   ✏️
                 </button>
                <button
                  onClick={() => handleDeleteTodoById(todo.id)}
                  className="text-muted-foreground hover:text-foreground"
                  aria-label="Удалить"
                  title="Удалить"
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