# Migration Issues Report

## 🚨 CRITICAL SECURITY ISSUES

### 1. **Question Answers Exposed to Clients** (FIXED)
- **Files**: Multiple migrations create policy allowing authenticated users to see answers
- **Issue**: `CREATE POLICY "Questions are viewable by authenticated users"` exposes the `answer` and `explanation` columns
- **Impact**: Users can cheat by querying the database directly
- **Status**: ✅ FIXED in `20251007000000_fix_question_security.sql`

### 2. **View Security Issue - Answers Still Exposed**
- **File**: `20250913025036_7266ec88-6e63-4d0f-b8f0-bad0ce7d9128.sql`
- **Issue**: `v_form_section` view exposes `q.answer` and `q.explanation` with public read policy
```sql
CREATE VIEW v_form_section AS
SELECT ... q.answer, q.explanation, ...
```
- **Impact**: Users can still see answers through the view even after fixing direct table access
- **Fix Needed**: ✅ Remove `answer` and `explanation` from view or restrict access

### 3. **Staging Items - Admin Policy Too Permissive**
- **File**: `20250913051412_fca05b72-8153-46f1-bc81-4c19a4e7e7e702.sql`
```sql
create policy "Admin can manage staging items" 
on public.staging_items 
for all 
using (true)  -- ❌ ANYONE can access!
with check (true);
```
- **Issue**: Policy allows ALL authenticated users to manage staging items, not just admins
- **Impact**: Any user can modify or view staging data
- **Fix Needed**: ✅ Add proper admin check using `is_admin()` function

### 4. **Rewards System - Overly Permissive Policies**
- **File**: `20250912005553_f213ec3a-eeec-4618-956c-9320c0a2797d.sql`
```sql
create policy "parents own" on public.parents for all using (true) with check (true);
create policy "rules parent" on public.rewards_rules for all using (true) with check (true);
```
- **Issue**: Any authenticated user can view/modify all parents and rules
- **Impact**: Privacy breach and potential fraud
- **Status**: Partially fixed in `20250912054148_dc42a6ba-0124-4b5f-99d7-a89991802a5c.sql` but incomplete

### 5. **Responses Table - Can Submit Wrong Answers**
- **File**: `20250914093417_b0019de9-bab3-48c1-be75-ad08db49c271.sql`
```sql
CREATE TABLE responses (
  ...
  selected CHAR(1) NOT NULL CHECK (selected IN ('A', 'B', 'C', 'D')),
  correct BOOLEAN NOT NULL,  -- ❌ User-submitted, not validated!
  ...
);
```
- **Issue**: Users can insert their own `correct` boolean value without server validation
- **Impact**: Users can fake perfect scores
- **Fix Needed**: ✅ Remove `correct` from INSERT policy and calculate server-side

## ⚠️ DATA INTEGRITY ISSUES

### 6. **Duplicate Profile Tables**
- **Tables**: `profiles` (from initial migration) AND `user_profiles` (later migration)
- **Files**: 
  - `20250911214734_73507965-f22f-4ed7-9289-5c262c078c03.sql` creates `profiles`
  - `20250912005247_2e6318cf-cef9-4413-be26-48835baa2dd5.sql` tries to create `profiles` again
  - `20250915052814_8b75becf-8e82-41f7-bbcd-4d3f8f6a3803.sql` creates `user_profiles`
- **Impact**: Confusing schema, potential data split across tables
- **Fix Needed**: ✅ Consolidate into single table

### 7. **Missing Foreign Key on parent_links.student_id**
- **File**: `20250912005553_f213ec3a-eeec-4618-956c-9320c0a2797d.sql`
```sql
create table public.parent_links(
  parent_id uuid references public.parents(id) on delete cascade,
  student_id uuid references auth.users(id) on delete cascade,  -- Added later
  primary key(parent_id, student_id)
);
```
- **Status**: Fixed in `20250912054148_dc42a6ba-0124-4b5f-99d7-a89991802a5c.sql` (has FK)
- **Issue**: Initial version missing FK reference

### 8. **Question Table Schema Conflicts**
- **Initial schema** (migration 1): Uses `answer CHAR(1)` with values 'A','B','C','D'
- **Staging schema** (migration): Uses `answer TEXT` with values 'choice_a','choice_b','choice_c','choice_d'
- **Impact**: Data import confusion and potential errors
- **Status**: Resolved through normalization in later migrations

### 9. **Missing subject Column on Questions**
- **Initial migrations**: `questions` table has `skill_id` but NO `subject` column
- **Later migration** (20250914081706): Tries to INSERT with `subject` column
```sql
insert into public.questions (skill_id, subject, stem, ...)
```
- **Impact**: Migration will FAIL because column doesn't exist
- **Fix Needed**: ✅ Add `subject` column to questions table

### 10. **Skills Table - skill_code as ID vs UUID**
- **Migration 20250914081706**: Tries to use skill_code as UUID id
```sql
insert into public.skills (id, subject, name)
select distinct n.skill_code, n.subject_norm, n.skill_code
```
- **Issue**: skill_code is TEXT but id is UUID type
- **Status**: Fixed in next migration (20250914081746) by creating skills properly
- **Impact**: First migration would fail

## 🔧 PERFORMANCE ISSUES

### 11. **Missing Indexes**
- `responses.question_id` - No index (frequently queried)
- `form_questions.question_id` - No index (joins)
- `sessions.user_id, section` - Composite index would help

### 12. **Inefficient RLS Policies with Subqueries**
- **Example**: `responses` policies use subqueries for every row check
```sql
CREATE POLICY "Users can view their own responses" 
ON responses FOR SELECT 
USING (auth.uid() IN (SELECT user_id FROM sessions WHERE id = session_id));
```
- **Impact**: Performance degradation on large datasets
- **Better approach**: Use JOIN or indexed foreign key

### 13. **View Performance - vw_user_skill_stats**
- Complex LEFT JOINs and aggregations
- No materialized view option
- Called frequently in UI
- **Fix**: Consider materialized view with refresh trigger

## 📋 SCHEMA CONFLICTS & REDUNDANCY

### 14. **Multiple Policy Drops and Recreates**
- Same policies dropped/recreated across multiple migrations
- Example: "Questions are viewable by authenticated users" appears 3+ times
- **Impact**: Confusing migration history, potential for missed updates

### 15. **Duplicate Function Definitions**
- `update_updated_at_column()` defined 3+ times across migrations
- **Impact**: Last one wins, could have subtle differences

### 16. **progress vs mastery Tables - Redundant?**
- Both track user skill progress
- `progress`: seen, correct, mastery_level, median_time_ms
- `mastery`: total, correct, avg_time_ms
- **Impact**: Data duplication, sync issues
- **Fix Needed**: ✅ Clarify purpose or consolidate

### 17. **Cron Job Hardcoded URL**
- **File**: `20250912011814_37fc6a9b-f24d-4009-a111-be60a284e6c6.sql`
```sql
url:='https://hhbkmxrzxcswwokmbtbz.supabase.co/functions/v1/cron-daily'
```
- **Issue**: Hardcoded production URL in migration
- **Impact**: Won't work in dev/staging environments
- **Fix**: Use environment variable or relative path

## 🎯 RECOMMENDATIONS

### Immediate Actions Required:
1. ✅ **Fix v_form_section view** - Remove answer/explanation
2. ✅ **Fix staging_items policy** - Add proper admin check
3. ✅ **Fix responses.correct field** - Calculate server-side only
4. ✅ **Add subject column to questions table**
5. ✅ **Consolidate profiles tables**

### Medium Priority:
6. Add missing indexes for performance
7. Optimize RLS policies to avoid subqueries
8. Review and consolidate progress/mastery tables
9. Fix hardcoded URLs to use environment variables

### Low Priority (Technical Debt):
10. Clean up migration history (consider squashing)
11. Document schema properly
12. Add database-level constraints for data validation
13. Create materialized views for complex queries

## 📊 Summary Statistics
- **Total Migrations**: 28
- **Critical Security Issues**: 5
- **Data Integrity Issues**: 6
- **Performance Issues**: 3
- **Schema Conflicts**: 4
- **Total Issues Found**: 17

---
*Generated: 2025-10-07*
