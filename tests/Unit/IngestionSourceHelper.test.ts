import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
    canEmployeeManageTestAttachment,
    isPdfIngestedTest,
    normalizeIngestionSource,
    resolveDocumentViewerMode,
} from '../../resources/js/Utils/IngestionSourceHelper.js';

describe('normalizeIngestionSource', () => {
    it('recognizes pdf case-insensitively with whitespace trimming', () => {
        assert.equal(normalizeIngestionSource('pdf'), 'pdf');
        assert.equal(normalizeIngestionSource('PDF'), 'pdf');
        assert.equal(normalizeIngestionSource('  Pdf  '), 'pdf');
    });

    it('defaults excel, empty, null, undefined, and legacy values to excel', () => {
        assert.equal(normalizeIngestionSource('excel'), 'excel');
        assert.equal(normalizeIngestionSource('EXCEL'), 'excel');
        assert.equal(normalizeIngestionSource(''), 'excel');
        assert.equal(normalizeIngestionSource(null), 'excel');
        assert.equal(normalizeIngestionSource(undefined), 'excel');
    });
});

describe('isPdfIngestedTest', () => {
    it('identifies direct PDF tests strictly from authoritative ingestionSource', () => {
        assert.equal(isPdfIngestedTest({ ingestionSource: 'pdf' }), true);
        assert.equal(isPdfIngestedTest({ ingestionSource: 'PDF' }), true);
        assert.equal(isPdfIngestedTest({ ingestionSource: 'excel' }), false);
        assert.equal(isPdfIngestedTest({}), false);
        assert.equal(isPdfIngestedTest(null), false);
    });
});

describe('canEmployeeManageTestAttachment', () => {
    it('allows Employee role to upload/replace/delete for Excel-ingested tests', () => {
        assert.equal(canEmployeeManageTestAttachment('employee', { ingestionSource: 'excel', canManageAttachment: true }), true);
        assert.equal(canEmployeeManageTestAttachment('Employee', { ingestionSource: 'excel' }), true);
        assert.equal(canEmployeeManageTestAttachment('employee', {}), true);
    });

    it('denies Employee role from uploading/replacing/deleting for PDF-ingested tests', () => {
        assert.equal(canEmployeeManageTestAttachment('employee', { ingestionSource: 'pdf', canManageAttachment: false }), false);
        assert.equal(canEmployeeManageTestAttachment('employee', { ingestionSource: 'pdf', canManageAttachment: true }), false);
        assert.equal(canEmployeeManageTestAttachment('Employee', { ingestionSource: 'PDF' }), false);
    });

    it('respects explicit backend canManageAttachment=false flag even if source is omitted', () => {
        assert.equal(canEmployeeManageTestAttachment('employee', { canManageAttachment: false }), false);
    });

    it('denies non-Employee roles regardless of ingestion source', () => {
        for (const role of ['administrator', 'Administrator', 'expert', 'Expert', 'inspector', 'Inspector', '', null, undefined]) {
            assert.equal(canEmployeeManageTestAttachment(role, { ingestionSource: 'excel', canManageAttachment: true }), false);
            assert.equal(canEmployeeManageTestAttachment(role, { ingestionSource: 'pdf', canManageAttachment: false }), false);
        }
    });
});

describe('resolveDocumentViewerMode', () => {
    it('returns employee mode only for Employee viewing Excel-ingested tests', () => {
        assert.equal(resolveDocumentViewerMode('employee', { ingestionSource: 'excel', canManageAttachment: true }), 'employee');
    });

    it('returns readOnly mode for Employee viewing PDF-ingested tests and for all other roles', () => {
        assert.equal(resolveDocumentViewerMode('employee', { ingestionSource: 'pdf', canManageAttachment: false }), 'readOnly');
        assert.equal(resolveDocumentViewerMode('inspector', { ingestionSource: 'excel', canManageAttachment: true }), 'readOnly');
        assert.equal(resolveDocumentViewerMode('expert', { ingestionSource: 'excel', canManageAttachment: true }), 'readOnly');
        assert.equal(resolveDocumentViewerMode('administrator', { ingestionSource: 'excel', canManageAttachment: true }), 'readOnly');
    });
});
