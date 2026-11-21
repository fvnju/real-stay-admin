-- Sign-ups each day, by the role that the user picked.
SELECT
    toString(toDate(timestamp)) AS day,
    coalesce(nullIf(toString(properties.role), ''), 'unknown') AS role,
    count() AS signups
FROM events
WHERE event = 'signed_up'
  AND timestamp >= now() - INTERVAL {{days}} DAY
GROUP BY day, role
ORDER BY day
LIMIT 1000
