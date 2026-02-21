import { useState, useEffect } from 'react';
import { storageService } from '../services/storageService';
import { CompanyCost, CompanyCostItem } from '../types';

const defaultCost: CompanyCost = {
  rent: [],
  phone: [],
  insurance: [],
  laborHealth: [],
  carRent: [],
  loan: [],
  other: [],
};

// Category keys
export type CostCategoryKey = keyof CompanyCost;

// Calculate total for a single category
export const getCategoryTotal = (items: CompanyCostItem[]): number =>
  items.reduce((sum, item) => sum + (item.amount || 0), 0);

// Calculate grand total across all categories
export const getGrandTotal = (cost: CompanyCost): number =>
  Object.values(cost).reduce(
    (sum, items) => sum + getCategoryTotal(items as CompanyCostItem[]),
    0
  );

export const useCompanyCost = () => {
  const [cost, setCost] = useState<CompanyCost>(defaultCost);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      try {
        const savedCost = await storageService.getItem<CompanyCost>('bt_company_cost', defaultCost);
        if (savedCost) {
          // Migration: convert old number-based format to array-based
          const migrated: CompanyCost = { ...defaultCost };
          for (const key of Object.keys(defaultCost) as CostCategoryKey[]) {
            const val = (savedCost as any)[key];
            if (Array.isArray(val)) {
              migrated[key] = val;
            } else if (typeof val === 'number' && val > 0) {
              // Old format: single number → convert to single-item array
              migrated[key] = [{ id: Date.now().toString(), name: '', amount: val }];
            }
          }
          setCost(migrated);
        }
      } catch (error) {
        console.error('Failed to load company cost:', error);
      } finally {
        setIsLoading(false);
      }
    };
    loadData();

    const handleSync = () => loadData();
    window.addEventListener('CLOUD_SYNC_COMPLETED', handleSync);
    return () => window.removeEventListener('CLOUD_SYNC_COMPLETED', handleSync);
  }, []);

  const saveCost = async (newCost: CompanyCost) => {
    setCost(newCost);
    try {
      await storageService.setItem('bt_company_cost', newCost);
    } catch (error) {
      console.error('Failed to save company cost:', error);
    }
  };

  const totalCost = getGrandTotal(cost);

  return { cost, saveCost, totalCost, isLoading };
};
