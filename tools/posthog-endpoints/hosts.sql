-- Host actions: listings published, and booking decisions.
SELECT
    event,
    coalesce(toString(properties.decision), '') AS decision,
    count() AS events
FROM events
WHERE event IN ('listing_published', 'host_booking_decided')
  AND timestamp >= now() - INTERVAL {{days}} DAY
GROUP BY event, decision
