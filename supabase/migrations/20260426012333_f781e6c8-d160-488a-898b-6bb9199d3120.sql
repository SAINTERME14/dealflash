-- Enums
CREATE TYPE public.admin_task_status AS ENUM ('todo', 'in_progress', 'done', 'archived');
CREATE TYPE public.admin_task_priority AS ENUM ('low', 'normal', 'high', 'urgent');

-- Table admin_tasks
CREATE TABLE public.admin_tasks (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL CHECK (length(btrim(title)) BETWEEN 1 AND 200),
  description TEXT CHECK (description IS NULL OR length(description) <= 5000),
  status public.admin_task_status NOT NULL DEFAULT 'todo',
  priority public.admin_task_priority NOT NULL DEFAULT 'normal',
  assignee_id UUID,
  created_by UUID NOT NULL,
  due_date DATE,
  completed_at TIMESTAMP WITH TIME ZONE,
  position INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE INDEX idx_admin_tasks_status ON public.admin_tasks(status);
CREATE INDEX idx_admin_tasks_assignee ON public.admin_tasks(assignee_id);
CREATE INDEX idx_admin_tasks_due_date ON public.admin_tasks(due_date) WHERE due_date IS NOT NULL;

-- RLS
ALTER TABLE public.admin_tasks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins view all tasks"
ON public.admin_tasks FOR SELECT
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins create tasks"
ON public.admin_tasks FOR INSERT
WITH CHECK (public.has_role(auth.uid(), 'admin') AND auth.uid() = created_by);

CREATE POLICY "Admins update tasks"
ON public.admin_tasks FOR UPDATE
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins delete tasks"
ON public.admin_tasks FOR DELETE
USING (public.has_role(auth.uid(), 'admin'));

-- Trigger updated_at
CREATE TRIGGER update_admin_tasks_updated_at
BEFORE UPDATE ON public.admin_tasks
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Trigger : auto completed_at quand status passe à 'done'
CREATE OR REPLACE FUNCTION public.handle_admin_task_completion()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  IF NEW.status = 'done' AND (OLD.status IS NULL OR OLD.status <> 'done') THEN
    NEW.completed_at := now();
  ELSIF NEW.status <> 'done' THEN
    NEW.completed_at := NULL;
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER admin_tasks_completion_trigger
BEFORE INSERT OR UPDATE ON public.admin_tasks
FOR EACH ROW
EXECUTE FUNCTION public.handle_admin_task_completion();