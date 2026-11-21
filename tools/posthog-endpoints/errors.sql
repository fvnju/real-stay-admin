-- Errors of the app: the issues with the most exceptions in the range.
-- Only the issue name and counts: an error message can hold user data.
SELECT
    toString(issue_id) AS issue,
    any(issue_name) AS name,
    count() AS occurrences,
    toString(any(issue_first_seen)) AS first_seen
FROM events
WHERE event = '$exception'
  AND timestamp >= now() - INTERVAL {{days}} DAY
GROUP BY issue
ORDER BY occurrences DESC
LIMIT 50
