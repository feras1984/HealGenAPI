import { useState, useEffect, useMemo, useCallback } from 'react';

export interface UseBulkSelectionReturn<T extends { id: number }> {
    selectedIds: number[];
    selectedItems: T[];
    selectedCount: number;
    isSelected: (id: number) => boolean;
    toggleOne: (id: number) => void;
    toggleAll: (visibleIds: number[]) => void;
    isAllSelected: (visibleIds: number[]) => boolean;
    isIndeterminate: (visibleIds: number[]) => boolean;
    removeIds: (idsToRemove: number[]) => void;
    clearSelection: () => void;
}

/**
 * Reusable controlled bulk-selection hook for queue tables.
 * Preserves selection across polling refreshes while automatically pruning
 * IDs that are no longer present in the current queue.
 */
export function useBulkSelection<T extends { id: number }>(items: T[]): UseBulkSelectionReturn<T> {
    const [selectedIds, setSelectedIds] = useState<number[]>([]);

    const availableIdSet = useMemo(() => new Set(items.map(item => item.id)), [items]);

    // Prune IDs that disappeared from the queue (e.g. processed by another user or filtered out)
    useEffect(() => {
        setSelectedIds(prev => {
            if (prev.length === 0) return prev;
            const pruned = prev.filter(id => availableIdSet.has(id));
            return pruned.length === prev.length ? prev : pruned;
        });
    }, [availableIdSet]);

    const selectedIdSet = useMemo(() => new Set(selectedIds), [selectedIds]);

    const selectedItems = useMemo(
        () => items.filter(item => selectedIdSet.has(item.id)),
        [items, selectedIdSet]
    );

    const isSelected = useCallback((id: number) => selectedIdSet.has(id), [selectedIdSet]);

    const toggleOne = useCallback((id: number) => {
        setSelectedIds(prev => (
            prev.includes(id)
                ? prev.filter(item => item !== id)
                : [...prev, id]
        ));
    }, []);

    const toggleAll = useCallback((visibleIds: number[]) => {
        if (visibleIds.length === 0) return;

        setSelectedIds(prev => {
            const prevSet = new Set(prev);
            const allSelected = visibleIds.every(id => prevSet.has(id));
            if (allSelected) {
                const visibleSet = new Set(visibleIds);
                return prev.filter(id => !visibleSet.has(id));
            }
            const next = new Set(prev);
            visibleIds.forEach(id => next.add(id));
            return Array.from(next);
        });
    }, []);

    const isAllSelected = useCallback((visibleIds: number[]) => {
        if (visibleIds.length === 0) return false;
        return visibleIds.every(id => selectedIdSet.has(id));
    }, [selectedIdSet]);

    const isIndeterminate = useCallback((visibleIds: number[]) => {
        if (visibleIds.length === 0) return false;
        const count = visibleIds.filter(id => selectedIdSet.has(id)).length;
        return count > 0 && count < visibleIds.length;
    }, [selectedIdSet]);

    const removeIds = useCallback((idsToRemove: number[]) => {
        if (idsToRemove.length === 0) return;
        const removeSet = new Set(idsToRemove);
        setSelectedIds(prev => prev.filter(id => !removeSet.has(id)));
    }, []);

    const clearSelection = useCallback(() => {
        setSelectedIds([]);
    }, []);

    return {
        selectedIds,
        selectedItems,
        selectedCount: selectedIds.length,
        isSelected,
        toggleOne,
        toggleAll,
        isAllSelected,
        isIndeterminate,
        removeIds,
        clearSelection,
    };
}

export default useBulkSelection;
