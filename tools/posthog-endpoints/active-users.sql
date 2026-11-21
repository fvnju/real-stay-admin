-- Active users of the app: one row per Lagos day and role, then DAU, WAU and MAU
-- (the last 24 hours, 7 days and 30 days).
-- A user is active when the app sent any event for them (not $identify or $exception).
SELECT kind, day, role, users
FROM (
    SELECT
        'daily' AS kind,
        toString(toDate(toTimeZone(timestamp, 'Africa/Lagos'))) AS day,
        coalesce(nullIf(toString(person.properties.role), ''), 'unknown') AS role,
        uniq(person_id) AS users
    FROM events
    WHERE timestamp >= now() - INTERVAL {{days}} DAY - INTERVAL 1 DAY
      AND {{test_accounts}}
      AND toDate(toTimeZone(timestamp, 'Africa/Lagos')) > toDate(toTimeZone(now(), 'Africa/Lagos')) - INTERVAL {{days}} DAY
      AND event NOT IN ('$identify', '$exception')
    GROUP BY day, role
    UNION ALL
    SELECT
        'total' AS kind,
        'dau' AS day,
        '' AS role,
        uniqIf(person_id, timestamp >= now() - INTERVAL 1 DAY) AS users
    FROM events
    WHERE timestamp >= now() - INTERVAL 30 DAY
      AND {{test_accounts}}
      AND event NOT IN ('$identify', '$exception')
    UNION ALL
    SELECT 'total' AS kind, 'wau' AS day, '' AS role, uniqIf(person_id, timestamp >= now() - INTERVAL 7 DAY) AS users
    FROM events
    WHERE timestamp >= now() - INTERVAL 30 DAY
      AND {{test_accounts}}
      AND event NOT IN ('$identify', '$exception')
    UNION ALL
    SELECT 'total' AS kind, 'mau' AS day, '' AS role, uniq(person_id) AS users
    FROM events
    WHERE timestamp >= now() - INTERVAL 30 DAY
      AND {{test_accounts}}
      AND event NOT IN ('$identify', '$exception')
)
-- The 3 total rows first ('total' > 'daily'), so no limit cuts them off.
ORDER BY kind DESC, day
LIMIT 1000
