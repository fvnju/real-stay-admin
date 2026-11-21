-- Errors of the app in the range: the 5 issues with the most exceptions,
-- then one total row (all occurrences, issues, and issues first seen in
-- the range). Only names and counts: an error message can hold user data.
SELECT kind, issue, name, occurrences, is_new, issues
FROM (
    SELECT *
    FROM (
        SELECT
            'issue' AS kind,
            toString(issue_id) AS issue,
            any(issue_name) AS name,
            count() AS occurrences,
            toInt(any(issue_first_seen) >= now() - INTERVAL {{days}} DAY) AS is_new,
            0 AS issues
        FROM events
        WHERE event = '$exception'
          AND timestamp >= now() - INTERVAL {{days}} DAY
        GROUP BY issue
        ORDER BY occurrences DESC
        LIMIT 5
    )
    UNION ALL
    SELECT
        'total' AS kind,
        '' AS issue,
        '' AS name,
        sum(occurrences) AS occurrences,
        sum(is_new) AS is_new,
        count() AS issues
    FROM (
        SELECT
            toString(issue_id) AS issue,
            count() AS occurrences,
            toInt(any(issue_first_seen) >= now() - INTERVAL {{days}} DAY) AS is_new
        FROM events
        WHERE event = '$exception'
          AND timestamp >= now() - INTERVAL {{days}} DAY
        GROUP BY issue
    )
)
ORDER BY kind DESC, occurrences DESC
