// ─────────────────────────────────────────────────────────────
// snippets.js — SQL Snippet Library data
//
// HOW TO ADD A SNIPPET
// --------------------
// 1. Copy one of the objects below as a template
// 2. Fill in every field:
//      id       — unique string, no spaces (use hyphens)
//      title    — short display name
//      category — must match one of the CATEGORIES list, or add a new one there too
//      tags     — array of lowercase strings, used for search
//      desc     — one sentence. What does this do and when do you use it?
//      sql      — your T-SQL. Use a template literal (backticks) for multiline.
//                 Indent however you like — it renders as-is in a <pre> block.
// 3. Save. Reload the page. Done.
//
// CATEGORIES
// ----------
// Add new categories here if needed. They appear in the filter bar automatically.
// ─────────────────────────────────────────────────────────────

window.SNIPPETS_CATEGORIES = [
  'CTEs',
  'Window Functions',
  'Date & FY',
  'Aggregation',
  'BBCRM',
  'Joins',
  'Utility',
];

window.SNIPPETS = [

  // ── CTEs ──────────────────────────────────────────────────

  {
    id:       'cte-basic',
    title:    'Basic CTE',
    category: 'CTEs',
    tags:     ['cte', 'with', 'common table expression'],
    desc:     'Single CTE with a select from it. Starting point for any CTE-based query.',
    sql:
`with CTE as (
  select
    CONSTITUENTID,
    LOOKUPID,
    FULLNAME
  from dbo.CONSTITUENT
  where ISORGANIZATION = 0
    and ISINACTIVE = 0
)
select *
from CTE`,
  },

  {
    id:       'cte-chained',
    title:    'Chained CTEs',
    category: 'CTEs',
    tags:     ['cte', 'with', 'multiple', 'chained'],
    desc:     'Two CTEs that build on each other — first result feeds into the second.',
    sql:
`with CONSTITUENTS as (
  select
    ID,
    FULLNAME,
    PRIMARYADDRESSID
  from dbo.CONSTITUENT
  where ISINACTIVE = 0
),
ADDRESSES as (
  select
    C.ID,
    C.FULLNAME,
    A.CITY,
    A.STATEID
  from CONSTITUENTS C
  inner join dbo.ADDRESS A on A.ID = C.PRIMARYADDRESSID
)
select *
from ADDRESSES`,
  },

  // ── Window Functions ───────────────────────────────────────

  {
    id:       'window-row-number',
    title:    'ROW_NUMBER — deduplicate',
    category: 'Window Functions',
    tags:     ['row_number', 'dedup', 'deduplicate', 'partition', 'window'],
    desc:     'Classic dedup pattern — rank rows per group, keep only the first.',
    sql:
`with RANKED as (
  select
    CONSTITUENTID,
    AMOUNT,
    DATE,
    row_number() over (
      partition by CONSTITUENTID
      order by DATE desc
    ) as RN
  from dbo.REVENUE
)
select
  CONSTITUENTID,
  AMOUNT,
  DATE
from RANKED
where RN = 1`,
  },

  {
    id:       'window-running-total',
    title:    'Running total',
    category: 'Window Functions',
    tags:     ['running total', 'cumulative', 'sum', 'window', 'over'],
    desc:     'Cumulative sum ordered by date within a partition.',
    sql:
`select
  CONSTITUENTID,
  DATE,
  AMOUNT,
  sum(AMOUNT) over (
    partition by CONSTITUENTID
    order by DATE
    rows between unbounded preceding and current row
  ) as RUNNING_TOTAL
from dbo.REVENUE
order by CONSTITUENTID, DATE`,
  },

  {
    id:       'window-lag-lead',
    title:    'LAG / LEAD — prior and next value',
    category: 'Window Functions',
    tags:     ['lag', 'lead', 'prior', 'next', 'window'],
    desc:     'Pull the previous and next row values without a self-join.',
    sql:
`select
  CONSTITUENTID,
  DATE,
  AMOUNT,
  lag(AMOUNT, 1, 0)  over (partition by CONSTITUENTID order by DATE) as PRIOR_AMOUNT,
  lead(AMOUNT, 1, 0) over (partition by CONSTITUENTID order by DATE) as NEXT_AMOUNT
from dbo.REVENUE
order by CONSTITUENTID, DATE`,
  },

  // ── Date & FY ─────────────────────────────────────────────

  {
    id:       'fy-current',
    title:    'Current fiscal year (July 1)',
    category: 'Date & FY',
    tags:     ['fiscal year', 'fy', 'date', 'july'],
    desc:     'Derives the current UofL fiscal year from today — FY starts July 1.',
    sql:
`select
  case
    when month(getdate()) >= 7
      then year(getdate()) + 1
    else year(getdate())
  end as CURRENT_FY`,
  },

  {
    id:       'fy-column',
    title:    'FY column from a date field',
    category: 'Date & FY',
    tags:     ['fiscal year', 'fy', 'date', 'calculated column'],
    desc:     'Add a FY column to any result set that has a date column.',
    sql:
`select
  DATE,
  AMOUNT,
  case
    when month(DATE) >= 7
      then year(DATE) + 1
    else year(DATE)
  end as FISCAL_YEAR
from dbo.REVENUE`,
  },

  {
    id:       'fy-range-filter',
    title:    'Filter to a fiscal year range',
    category: 'Date & FY',
    tags:     ['fiscal year', 'fy', 'date', 'filter', 'between'],
    desc:     'WHERE clause that correctly bounds a full fiscal year (July 1 – June 30).',
    sql:
`-- Replace @FY with the target fiscal year (e.g. 2025 = FY25 = Jul 2024 – Jun 2025)
declare @FY int = 2025

select *
from dbo.REVENUE
where DATE >= datefromparts(@FY - 1, 7, 1)
  and DATE <  datefromparts(@FY,     7, 1)`,
  },

  // ── Aggregation ───────────────────────────────────────────

  {
    id:       'agg-giving-summary',
    title:    'Giving summary by constituent',
    category: 'Aggregation',
    tags:     ['giving', 'sum', 'count', 'group by', 'aggregate'],
    desc:     'Total giving, gift count, and most recent gift date rolled up per constituent.',
    sql:
`select
  CONSTITUENTID,
  sum(AMOUNT)       as TOTAL_GIVING,
  count(*)          as GIFT_COUNT,
  max(DATE)         as LAST_GIFT_DATE,
  min(DATE)         as FIRST_GIFT_DATE
from dbo.REVENUE
where TYPECODE = 0        -- gifts only
  and RECEIPTTYPECODE = 0 -- exclude reversals
group by CONSTITUENTID`,
  },

  // ── BBCRM ─────────────────────────────────────────────────

  {
    id:       'bbcrm-constituent-base',
    title:    'Constituent base query',
    category: 'BBCRM',
    tags:     ['constituent', 'bbcrm', 'base', 'individual'],
    desc:     'Clean starting point for any query touching the CONSTITUENT table — active individuals only.',
    sql:
`select
  C.ID,
  C.LOOKUPID,
  C.FULLNAME,
  C.FIRSTNAME,
  C.KEYNAME,
  C.ISDECEASED,
  C.ISINACTIVE
from dbo.CONSTITUENT C
where C.ISORGANIZATION = 0
  and C.ISINACTIVE     = 0
  and C.ISDECEASED     = 0`,
  },

  {
    id:       'bbcrm-smartfield-value',
    title:    'Pull a smartfield value',
    category: 'BBCRM',
    tags:     ['smartfield', 'bbcrm', 'constituentsmartfield'],
    desc:     'Join to CONSTITUENTSMARTFIELD to retrieve a specific calculated smartfield value.',
    sql:
`-- Replace @SMARTFIELDID with the GUID from the smartfield catalog
declare @SMARTFIELDID uniqueidentifier = 'xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx'

select
  C.ID,
  C.FULLNAME,
  SF.VALUE
from dbo.CONSTITUENT C
inner join dbo.CONSTITUENTSMARTFIELD SF
  on  SF.CONSTITUENTID = C.ID
  and SF.SMARTFIELDID  = @SMARTFIELDID
where C.ISINACTIVE = 0`,
  },

  {
    id:       'bbcrm-appeal-response',
    title:    'Appeal response summary',
    category: 'BBCRM',
    tags:     ['appeal', 'bbcrm', 'response', 'mkt'],
    desc:     'Count responses and total amount raised per appeal.',
    sql:
`select
  A.NAME          as APPEAL_NAME,
  count(R.ID)     as RESPONSE_COUNT,
  sum(R.AMOUNT)   as TOTAL_AMOUNT
from dbo.MKTSEGMENTATIONACTIVATE ACT
inner join dbo.APPEAL A
  on A.ID = ACT.APPEALID
inner join dbo.REVENUE R
  on R.APPEALID = A.ID
group by A.NAME
order by TOTAL_AMOUNT desc`,
  },

  // ── Joins ─────────────────────────────────────────────────

  {
    id:       'join-left-null-check',
    title:    'LEFT JOIN — find unmatched rows',
    category: 'Joins',
    tags:     ['left join', 'anti join', 'null', 'unmatched', 'missing'],
    desc:     'Anti-join pattern: find rows in table A with no match in table B.',
    sql:
`select C.ID, C.FULLNAME
from dbo.CONSTITUENT C
left join dbo.REVENUE R on R.CONSTITUENTID = C.ID
where R.ID is null  -- no giving record at all
  and C.ISINACTIVE = 0`,
  },

  // ── Utility ───────────────────────────────────────────────

  {
    id:       'util-row-count-all-tables',
    title:    'Row count — all tables',
    category: 'Utility',
    tags:     ['row count', 'utility', 'metadata', 'sys'],
    desc:     'Quick row count across every table in the database — useful for orientation in an unfamiliar schema.',
    sql:
`select
  t.NAME                                       as TABLE_NAME,
  p.rows                                       as ROW_COUNT
from sys.tables t
inner join sys.partitions p
  on  p.object_id = t.object_id
  and p.index_id in (0, 1)
order by p.rows desc`,
  },

  {
    id:       'util-find-column',
    title:    'Find a column by name',
    category: 'Utility',
    tags:     ['utility', 'metadata', 'sys', 'column', 'find', 'search schema'],
    desc:     'Search sys.columns to locate every table containing a column whose name matches a pattern.',
    sql:
`select
  t.NAME  as TABLE_NAME,
  c.NAME  as COLUMN_NAME,
  ty.NAME as DATA_TYPE,
  c.max_length,
  c.is_nullable
from sys.columns c
inner join sys.tables t  on t.object_id  = c.object_id
inner join sys.types  ty on ty.user_type_id = c.user_type_id
where c.NAME like '%CONSTITUENTID%'  -- change this pattern
order by t.NAME, c.column_id`,
  },

];
