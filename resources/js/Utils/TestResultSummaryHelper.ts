import type PatientTest from "@/models/patient/PatientTest";

export interface FlaggedSubstance {
    substance: string;
    softwareResult: string;
    visualResult: string;
    kind: 'positive' | 'abnormal';
}

export type TestResultSummaryStatus = 'all_negative' | 'positive' | 'abnormal' | 'no_results';

export interface TestResultSummary {
    status: TestResultSummaryStatus;
    totalCount: number;
    negativeCount: number;
    positiveCount: number;
    abnormalCount: number;
    hasFindings: boolean;
    flaggedSubstances: FlaggedSubstance[];
}

const NEGATIVE_EXACT_VALUES = new Set([
    'negative',
    'neg',
    'neg.',
    'normal',
    'non-reactive',
    'nonreactive',
    'non-positive',
    'nonpositive',
    'not detected',
    'undetected',
    'absent',
    'clear',
    'pass',
    'none',
    'سلبي',
    'سالب',
    'طبيعي',
]);

const EMPTY_VALUES = new Set([
    '',
    '-',
    '--',
    'n/a',
    'na',
    'null',
    'undefined',
]);

function stripNegativeSymbolDecorators(value: string): string {
    return value
        .replace(/^(?:\(\s*-\s*\)|\[\s*-\s*\])\s*/, '')
        .replace(/\s*(?:\(\s*-\s*\)|\[\s*-\s*\])$/, '')
        .replace(/\s+/g, ' ')
        .trim();
}

function stripPositiveSymbolDecorators(value: string): string {
    return value
        .replace(/^(?:\(\s*\+\s*\)|\[\s*\+\s*\])\s*/, '')
        .replace(/\s*(?:\(\s*\+\s*\)|\[\s*\+\s*\])$/, '')
        .replace(/\s+/g, ' ')
        .trim();
}

export function classifyResultValue(raw?: string | null): 'empty' | 'negative' | 'positive' | 'abnormal' {
    const normalized = (raw ?? '').trim().toLowerCase().replace(/\s+/g, ' ');

    if (EMPTY_VALUES.has(normalized)) {
        return 'empty';
    }

    if (normalized === '(-)' || normalized === '[-]') {
        return 'negative';
    }

    if (normalized === '+' || normalized === '(+)' || normalized === '[+]') {
        return 'positive';
    }

    // Handle HealGen negative formats such as "(-)Negative", "(-) Negative", "Negative (-)", "(-)Neg"
    const negativeCandidate = stripNegativeSymbolDecorators(normalized);
    if (NEGATIVE_EXACT_VALUES.has(negativeCandidate)) {
        return 'negative';
    }

    // Handle HealGen positive formats such as "(+)Positive", "(+) Positive", "Positive (+)", "Non-Negative", etc.
    const positiveCandidate = stripPositiveSymbolDecorators(normalized);
    if (
        positiveCandidate === 'pos' ||
        positiveCandidate === 'pos.' ||
        positiveCandidate === 'positive' ||
        positiveCandidate === 'إيجابي' ||
        positiveCandidate === 'موجب' ||
        positiveCandidate.includes('non-negative') ||
        positiveCandidate.includes('nonnegative') ||
        (positiveCandidate.includes('positive') && !positiveCandidate.includes('non-positive') && !positiveCandidate.includes('nonpositive')) ||
        (positiveCandidate.includes('reactive') && !positiveCandidate.includes('non-reactive') && !positiveCandidate.includes('nonreactive')) ||
        (positiveCandidate.includes('detected') && !positiveCandidate.includes('not detected') && !positiveCandidate.includes('undetected'))
    ) {
        return 'positive';
    }

    // Any other non-empty, non-negative result (e.g. Invalid, (?)Invalid, Abnormal, Inconclusive, Error)
    return 'abnormal';
}

export function summarizeTestResults(tests?: PatientTest[] | null): TestResultSummary {
    const rows = Array.isArray(tests) ? tests : [];

    let negativeCount = 0;
    let positiveCount = 0;
    let abnormalCount = 0;
    const flaggedSubstances: FlaggedSubstance[] = [];

    for (const row of rows) {
        const swClass = classifyResultValue(row.softwareResult);
        const visClass = classifyResultValue(row.visualResult);

        if (swClass === 'positive' || visClass === 'positive') {
            positiveCount++;
            flaggedSubstances.push({
                substance: row.substance || '-',
                softwareResult: row.softwareResult || '-',
                visualResult: row.visualResult || '-',
                kind: 'positive',
            });
        } else if (swClass === 'abnormal' || visClass === 'abnormal') {
            abnormalCount++;
            flaggedSubstances.push({
                substance: row.substance || '-',
                softwareResult: row.softwareResult || '-',
                visualResult: row.visualResult || '-',
                kind: 'abnormal',
            });
        } else if (swClass === 'negative' || visClass === 'negative') {
            negativeCount++;
        }
    }

    let status: TestResultSummaryStatus = 'no_results';
    if (positiveCount > 0) {
        status = 'positive';
    } else if (abnormalCount > 0) {
        status = 'abnormal';
    } else if (negativeCount > 0) {
        status = 'all_negative';
    }

    return {
        status,
        totalCount: rows.length,
        negativeCount,
        positiveCount,
        abnormalCount,
        hasFindings: positiveCount > 0 || abnormalCount > 0,
        flaggedSubstances,
    };
}
