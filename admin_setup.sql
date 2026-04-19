-- Run this entire script in your Supabase SQL Editor to grant Admin access to all tables so the Admin Panel can see everything!

CREATE POLICY "Admin View Profiles" ON profiles FOR SELECT TO authenticated USING ( auth.jwt() ->> 'email' = 'admin@learnchart.com' );
CREATE POLICY "Admin View Trades" ON trades FOR SELECT TO authenticated USING ( auth.jwt() ->> 'email' = 'admin@learnchart.com' );
CREATE POLICY "Admin View Watchlist" ON watchlist FOR SELECT TO authenticated USING ( auth.jwt() ->> 'email' = 'admin@learnchart.com' );
CREATE POLICY "Admin View Positions" ON positions FOR SELECT TO authenticated USING ( auth.jwt() ->> 'email' = 'admin@learnchart.com' );
CREATE POLICY "Admin View Lesson Progress" ON lesson_progress FOR SELECT TO authenticated USING ( auth.jwt() ->> 'email' = 'admin@learnchart.com' );
