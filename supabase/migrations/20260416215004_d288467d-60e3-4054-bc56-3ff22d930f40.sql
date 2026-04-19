create table public.lessons (
  id uuid primary key default gen_random_uuid(),
  level text not null check (level in ('Beginner','Intermediate','Advanced')),
  title text not null,
  description text not null,
  youtube_id text not null,
  order_index int not null default 0,
  duration_min int not null default 10,
  created_at timestamptz not null default now()
);
alter table public.lessons enable row level security;
create policy "Anyone can read lessons" on public.lessons for select using (true);

create table public.lesson_progress (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  lesson_id uuid not null references public.lessons(id) on delete cascade,
  completed boolean not null default false,
  position_seconds int not null default 0,
  updated_at timestamptz not null default now(),
  unique(user_id, lesson_id)
);
alter table public.lesson_progress enable row level security;
create policy "Users view own progress" on public.lesson_progress for select using (auth.uid() = user_id);
create policy "Users insert own progress" on public.lesson_progress for insert with check (auth.uid() = user_id);
create policy "Users update own progress" on public.lesson_progress for update using (auth.uid() = user_id);

insert into public.lessons (level, title, description, youtube_id, order_index, duration_min) values
('Beginner', 'What Is Trading? Markets Explained', 'Understand how financial markets work and the basics of buying and selling assets.', 'Xn7KWR9EOGQ', 1, 12),
('Beginner', 'Reading a Candlestick Chart', 'Learn how OHLC candles encode price action and what the wicks really mean.', 'AqOyW0GFlhM', 2, 10),
('Beginner', 'Support, Resistance & Trend Lines', 'The single most important concept in technical analysis, made simple.', 'rtHWvHbLmZk', 3, 15),
('Intermediate', 'Mastering RSI for Entries', 'Use the Relative Strength Index to spot overbought and oversold conditions.', 'JqXULuWZXZc', 1, 14),
('Intermediate', 'EMA Crossovers — A Practical Guide', 'How fast and slow exponential moving averages signal trend changes.', 'WN8YM0DVybg', 2, 11),
('Intermediate', 'MACD: Momentum You Can See', 'Read MACD lines and the histogram for momentum confirmation.', 'uvoiHcfp9DE', 3, 13),
('Advanced', 'Risk Management & Position Sizing', 'Survive long enough to win — the math of stop losses and R:R ratios.', 'QSAJ0qYWAac', 1, 18),
('Advanced', 'Building a Trading Plan You''ll Follow', 'Turn your edge into a checklist so emotions stop running your account.', 'z3kBnB-Iw3o', 2, 16),
('Advanced', 'Backtesting & Paper Trading the Right Way', 'How to validate a strategy before risking a single dollar.', 'q9rVqOV3BSY', 3, 17);