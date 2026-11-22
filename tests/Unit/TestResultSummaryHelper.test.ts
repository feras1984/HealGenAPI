import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
    classifyResultValue,
    summarizeTestResults,
} from '../../resources/js/Utils/TestResultSummaryHelper.js';

const makeRow = (id: number, substance: string, softwareResult: string, visualResult: string) => ({
    id,
    patientHeaderId: 1,
    substance,
    softwareResult,
    visualResult,
    createdAt: 'May 26, 2026',
});

describe('classifyResultValue', () => {
    it('classifies HealGen prefixed negative formats as negative', () => {
        const samples = [
            '(-)Negative',
            '(-) Negative',
            'Negative (-)',
            '[-]Negative',
            '(-)Neg',
            '(-)Neg.',
            'Negative',
            'NEG',
            '(-)',
            'Normal',
            'Non-Reactive',
            'Not Detected',
            'سلبي',
        ];

        for (const value of samples) {
            assert.equal(classifyResultValue(value), 'negative', `Expected "${value}" to be negative`);
        }
    });

    it('classifies HealGen positive formats as positive', () => {
        const samples = [
            '(+)Positive',
            '(+) Positive',
            'Positive (+)',
            '[+]Positive',
            '(+)Pos',
            'Positive',
            'POS',
            '+',
            '(+)',
            'Presumptive Positive',
            'Non-Negative',
            'Reactive',
            'Detected',
            'إيجابي',
        ];

        for (const value of samples) {
            assert.equal(classifyResultValue(value), 'positive', `Expected "${value}" to be positive`);
        }
    });

    it('classifies invalid, abnormal, contradictory, and unknown non-empty values as abnormal', () => {
        const samples = [
            'Invalid',
            '(?)Invalid',
            'Abnormal',
            'Inconclusive',
            'Error',
            '(+)Negative', // contradictory decorator + text must NOT be treated as negative
            'UnknownValue',
        ];

        for (const value of samples) {
            assert.equal(classifyResultValue(value), 'abnormal', `Expected "${value}" to be abnormal`);
        }
    });

    it('classifies empty placeholders as empty', () => {
        for (const value of ['', '   ', '-', '--', 'N/A', null, undefined]) {
            assert.equal(classifyResultValue(value), 'empty', `Expected "${String(value)}" to be empty`);
        }
    });
});

describe('summarizeTestResults', () => {
    it('summarizes a 13-panel HealGen (-)Negative cup as all_negative with zero findings', () => {
        const substances = ['COC', 'OPI', 'AMP', 'MTD', 'BZO', 'BAR', 'KET', 'BUP', 'THC', 'TRA', 'K3', 'FEN', 'PGB'];
        const rows = substances.map((sub, i) => makeRow(i + 1, sub, '(-)Negative', '(-)Negative'));

        const summary = summarizeTestResults(rows);

        assert.equal(summary.status, 'all_negative');
        assert.equal(summary.totalCount, 13);
        assert.equal(summary.negativeCount, 13);
        assert.equal(summary.positiveCount, 0);
        assert.equal(summary.abnormalCount, 0);
        assert.equal(summary.hasFindings, false);
        assert.deepEqual(summary.flaggedSubstances, []);
    });

    it('summarizes a 16-panel cup with 1 (+)Positive substance as positive and flags only that substance', () => {
        const rows = Array.from({ length: 16 }, (_, i) =>
            makeRow(
                i + 1,
                `SUB-${i + 1}`,
                i === 8 ? '(+)Positive' : '(-)Negative',
                i === 8 ? '(+)Positive' : '(-)Negative'
            )
        );

        const summary = summarizeTestResults(rows);

        assert.equal(summary.status, 'positive');
        assert.equal(summary.totalCount, 16);
        assert.equal(summary.negativeCount, 15);
        assert.equal(summary.positiveCount, 1);
        assert.equal(summary.abnormalCount, 0);
        assert.equal(summary.hasFindings, true);
        assert.equal(summary.flaggedSubstances.length, 1);
        assert.equal(summary.flaggedSubstances[0].substance, 'SUB-9');
        assert.equal(summary.flaggedSubstances[0].kind, 'positive');
    });

    it('flags a row when softwareResult is (-)Negative but visualResult is (+)Positive or Invalid', () => {
        const rows = [
            makeRow(1, 'COC', '(-)Negative', '(-)Negative'),
            makeRow(2, 'THC', '(-)Negative', '(+)Positive'),
            makeRow(3, 'AMP', '(-)Negative', '(?)Invalid'),
        ];

        const summary = summarizeTestResults(rows);

        assert.equal(summary.status, 'positive');
        assert.equal(summary.negativeCount, 1);
        assert.equal(summary.positiveCount, 1);
        assert.equal(summary.abnormalCount, 1);
        assert.equal(summary.hasFindings, true);
        assert.deepEqual(
            summary.flaggedSubstances.map(s => [s.substance, s.kind]),
            [
                ['THC', 'positive'],
                ['AMP', 'abnormal'],
            ]
        );
    });

    it('summarizes a cup with only invalid/abnormal findings as abnormal', () => {
        const rows = [
            makeRow(1, 'COC', '(-)Negative', '(-)Negative'),
            makeRow(2, 'OPI', '(?)Invalid', '(?)Invalid'),
        ];

        const summary = summarizeTestResults(rows);

        assert.equal(summary.status, 'abnormal');
        assert.equal(summary.negativeCount, 1);
        assert.equal(summary.positiveCount, 0);
        assert.equal(summary.abnormalCount, 1);
        assert.equal(summary.hasFindings, true);
    });

    it('returns no_results when tests array is empty or contains only empty placeholders', () => {
        assert.equal(summarizeTestResults([]).status, 'no_results');
        assert.equal(summarizeTestResults([makeRow(1, 'COC', '-', '')]).status, 'no_results');
    });
});
