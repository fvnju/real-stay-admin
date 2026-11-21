-- Payment events and their naira amounts.
SELECT
    event,
    count() AS events,
    sum(toFloat(properties.amount)) AS amount
FROM events
WHERE event IN ('payment_started', 'payment_succeeded', 'payment_failed', 'payment_cancelled')
  AND timestamp >= now() - INTERVAL {{days}} DAY
GROUP BY event
