CREATE UNIQUE INDEX IF NOT EXISTS leads_familias_email_lower_uniq
  ON public.leads_familias (lower(email));

CREATE UNIQUE INDEX IF NOT EXISTS leads_estabelecimentos_email_lower_uniq
  ON public.leads_estabelecimentos (lower(email));