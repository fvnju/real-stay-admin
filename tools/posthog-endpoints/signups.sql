-- Sign-ups each day (Lagos days, as the page), by the role that the user picked.
SELECT
    toString(toDate(toTimeZone(timestamp, 'Africa/Lagos'))) AS day,
    coalesce(nullIf(toString(properties.role), ''), 'unknown') AS role,
    count() AS signups
FROM events
WHERE event = 'signed_up'
  AND {{test_accounts}}
  AND timestamp >= now() - INTERVAL {{days}} DAY - INTERVAL 1 DAY
  AND toDate(toTimeZone(timestamp, 'Africa/Lagos')) > toDate(toTimeZone(now(), 'Africa/Lagos')) - INTERVAL {{days}} DAY
GROUP BY day, role
ORDER BY day
LIMIT 1000
