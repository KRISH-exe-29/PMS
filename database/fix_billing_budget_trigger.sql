-- 1. Create a function to update actual_cost and remaining_budget based on billings
CREATE OR REPLACE FUNCTION update_project_actual_cost_from_billing()
RETURNS TRIGGER AS $$
BEGIN
    -- If an invoice was added, updated, or deleted
    IF TG_OP = 'DELETE' THEN
        -- Re-calculate for the OLD project
        IF OLD.project_id IS NOT NULL THEN
            UPDATE public.projects
            SET 
                actual_cost = COALESCE((SELECT SUM(invoice_amount) FROM public.billings WHERE project_id = OLD.project_id), 0),
                remaining_budget = budget - COALESCE((SELECT SUM(invoice_amount) FROM public.billings WHERE project_id = OLD.project_id), 0)
            WHERE id = OLD.project_id;
        END IF;
        RETURN OLD;
    ELSE
        -- Re-calculate for the NEW project
        IF NEW.project_id IS NOT NULL THEN
            UPDATE public.projects
            SET 
                actual_cost = COALESCE((SELECT SUM(invoice_amount) FROM public.billings WHERE project_id = NEW.project_id), 0),
                remaining_budget = budget - COALESCE((SELECT SUM(invoice_amount) FROM public.billings WHERE project_id = NEW.project_id), 0)
            WHERE id = NEW.project_id;
        END IF;
        
        -- If project_id changed during an update, recalculate for the old project too
        IF TG_OP = 'UPDATE' AND OLD.project_id IS NOT NULL AND OLD.project_id != NEW.project_id THEN
            UPDATE public.projects
            SET 
                actual_cost = COALESCE((SELECT SUM(invoice_amount) FROM public.billings WHERE project_id = OLD.project_id), 0),
                remaining_budget = budget - COALESCE((SELECT SUM(invoice_amount) FROM public.billings WHERE project_id = OLD.project_id), 0)
            WHERE id = OLD.project_id;
        END IF;
        
        RETURN NEW;
    END IF;
END;
$$ LANGUAGE plpgsql;

-- 2. Create the trigger on the billings table
DROP TRIGGER IF EXISTS billing_actual_cost_trigger ON public.billings;
CREATE TRIGGER billing_actual_cost_trigger
AFTER INSERT OR UPDATE OR DELETE
ON public.billings
FOR EACH ROW
EXECUTE FUNCTION update_project_actual_cost_from_billing();

-- 3. Modify the existing milestone trigger so it STOPS overwriting the project budget and actual_cost
CREATE OR REPLACE FUNCTION update_project_budget()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.project_id IS NOT NULL THEN
        UPDATE public.projects
        SET 
            -- WE REMOVED: budget = ... so the user's manual budget is never overwritten
            -- WE REMOVED: actual_cost = ... so it doesn't conflict with the billing actual cost
            progress = COALESCE((SELECT AVG(progress)::INT FROM public.milestones WHERE project_id = NEW.project_id), 0)
        WHERE id = NEW.project_id;
    END IF;
    
    IF TG_OP = 'UPDATE' AND OLD.project_id IS NOT NULL AND OLD.project_id != NEW.project_id THEN
        UPDATE public.projects
        SET 
            progress = COALESCE((SELECT AVG(progress)::INT FROM public.milestones WHERE project_id = OLD.project_id), 0)
        WHERE id = OLD.project_id;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 4. Do a one-time recalculation of actual_cost based on existing billings
UPDATE public.projects p
SET 
    actual_cost = COALESCE((SELECT SUM(invoice_amount) FROM public.billings b WHERE b.project_id = p.id), 0),
    remaining_budget = p.budget - COALESCE((SELECT SUM(invoice_amount) FROM public.billings b WHERE b.project_id = p.id), 0);
