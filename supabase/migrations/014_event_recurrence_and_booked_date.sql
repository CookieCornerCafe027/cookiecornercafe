-- Recurring events + the calendar day a guest books
alter table public.events
  add column if not exists is_recurring boolean not null default false,
  add column if not exists recurrence_weekdays smallint[] not null default '{}',
  add column if not exists recurrence_until date;

comment on column public.events.is_recurring is
  'When true, guests pick a matching weekday on or after starts_at (until recurrence_until).';
comment on column public.events.recurrence_weekdays is
  'JS weekday numbers: 0=Sunday … 6=Saturday. Empty means the weekday of starts_at.';
comment on column public.events.recurrence_until is
  'Optional last bookable calendar day for a recurring event.';

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'events_recurrence_weekdays_valid'
  ) then
    alter table public.events
      add constraint events_recurrence_weekdays_valid
      check (recurrence_weekdays <@ array[0,1,2,3,4,5,6]::smallint[]);
  end if;
end
$$;

alter table public.event_registrations
  add column if not exists booked_date date;

comment on column public.event_registrations.booked_date is
  'Calendar day the guest reserved (America/Toronto civil date).';

update public.event_registrations r
set booked_date = (e.starts_at at time zone 'America/Toronto')::date
from public.events e
where r.event_id = e.id
  and r.booked_date is null
  and e.starts_at is not null;

update public.event_registrations
set booked_date = (created_at at time zone 'America/Toronto')::date
where booked_date is null;

alter table public.event_registrations
  alter column booked_date set not null;

create index if not exists event_registrations_event_id_booked_date_idx
  on public.event_registrations (event_id, booked_date);
