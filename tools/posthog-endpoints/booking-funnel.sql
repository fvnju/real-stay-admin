-- The booking funnel: the number of users that reached each step, in order,
-- within 7 days of the first step. Step 0 means no step.
SELECT
    level AS step,
    count() AS users
FROM (
    SELECT
        person_id,
        windowFunnel(604800)(
            toDateTime(timestamp),
            event = 'search_performed',
            event = 'listing_viewed',
            event = 'booking_started',
            event = 'booking_requested',
            event = 'payment_succeeded'
        ) AS level
    FROM events
    WHERE timestamp >= now() - INTERVAL {{days}} DAY
      AND {{test_accounts}}
      AND event IN ('search_performed', 'listing_viewed', 'booking_started', 'booking_requested', 'payment_succeeded')
    GROUP BY person_id
)
GROUP BY step
ORDER BY step
