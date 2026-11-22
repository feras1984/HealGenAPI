<?php

return [
    /*
    |--------------------------------------------------------------------------
    | Workflow Stage Delay Threshold (Hours)
    |--------------------------------------------------------------------------
    |
    | Maximum allowed elapsed hours between any two consecutive workflow
    | milestones (Captured -> Received, Received -> Inspection,
    | Inspection -> Supervision) before a test is flagged as delayed.
    |
    */
    'delay_threshold_hours' => max(1, (int) env('TEST_DELAY_THRESHOLD_HOURS', 48)),
];
