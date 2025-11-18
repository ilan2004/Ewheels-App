import { useState, useEffect, useCallback } from 'react';
import { 
  Sale, 
  Expense, 
  SaleForm, 
  ExpenseForm, 
  SalesFilters, 
  ExpensesFilters, 
  FinancialKPIs,
  PaginatedFinancialResponse,
  RecentTransaction
} from '@/types/financial.types';
import { financialService } from '@/services/financialService';
import { useAuthStore } from '@/stores/authStore';
import { useLocationStore } from '@/stores/locationStore';

// Hook for managing sales data
export const useSales = () => {
  const [sales, setSales] = useState<Sale[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 0
  });

  const { user } = useAuthStore();
  const { activeLocation } = useLocationStore();

  const fetchSales = useCallback(async (filters: SalesFilters = {}, page = 1, limit = 10) => {
    if (!user) return;
    
    try {
      setLoading(true);
      setError(null);
      const response = await financialService.getSales(
        filters, 
        user.role, 
        activeLocation?.id,
        page,
        limit
      );
      
      setSales(response.data);
      setPagination(response.pagination);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch sales');
    } finally {
      setLoading(false);
    }
  }, [user, activeLocation]);

  const createSale = useCallback(async (saleData: SaleForm) => {
    if (!user) return { success: false, error: 'User not authenticated' };
    
    try {
      const response = await financialService.createSale(saleData, user.role, activeLocation?.id);
      if (response.success && response.data) {
        setSales(prev => [response.data!, ...prev]);
        setPagination(prev => ({ ...prev, total: prev.total + 1 }));
      }
      return response;
    } catch (error) {
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Failed to create sale' 
      };
    }
  }, [user, activeLocation]);

  const updateSale = useCallback(async (id: string, updates: Partial<SaleForm>) => {
    if (!user) return { success: false, error: 'User not authenticated' };
    
    try {
      const response = await financialService.updateSale(id, updates, user.role, activeLocation?.id);
      if (response.success && response.data) {
        setSales(prev => prev.map(sale => sale.id === id ? response.data! : sale));
      }
      return response;
    } catch (error) {
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Failed to update sale' 
      };
    }
  }, [user, activeLocation]);

  const deleteSale = useCallback(async (id: string) => {
    if (!user) return { success: false, error: 'User not authenticated' };
    
    try {
      const response = await financialService.deleteSale(id, user.role, activeLocation?.id);
      if (response.success) {
        setSales(prev => prev.filter(sale => sale.id !== id));
        setPagination(prev => ({ ...prev, total: prev.total - 1 }));
      }
      return response;
    } catch (error) {
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Failed to delete sale' 
      };
    }
  }, [user, activeLocation]);

  return {
    sales,
    loading,
    error,
    pagination,
    fetchSales,
    createSale,
    updateSale,
    deleteSale,
    refetch: () => fetchSales()
  };
};

// Hook for managing expenses data
export const useExpenses = () => {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 0
  });

  const { user } = useAuthStore();
  const { activeLocation } = useLocationStore();

  const fetchExpenses = useCallback(async (filters: ExpensesFilters = {}, page = 1, limit = 10) => {
    if (!user) return;
    
    try {
      setLoading(true);
      setError(null);
      const response = await financialService.getExpenses(
        filters, 
        user.role, 
        activeLocation?.id,
        page,
        limit
      );
      
      setExpenses(response.data);
      setPagination(response.pagination);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch expenses');
    } finally {
      setLoading(false);
    }
  }, [user, activeLocation]);

  const createExpense = useCallback(async (expenseData: ExpenseForm) => {
    if (!user) return { success: false, error: 'User not authenticated' };
    
    try {
      const response = await financialService.createExpense(expenseData, user.role, activeLocation?.id);
      if (response.success && response.data) {
        setExpenses(prev => [response.data!, ...prev]);
        setPagination(prev => ({ ...prev, total: prev.total + 1 }));
      }
      return response;
    } catch (error) {
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Failed to create expense' 
      };
    }
  }, [user, activeLocation]);

  const updateExpense = useCallback(async (id: string, updates: Partial<ExpenseForm>) => {
    if (!user) return { success: false, error: 'User not authenticated' };
    
    try {
      const response = await financialService.updateExpense(id, updates, user.role, activeLocation?.id);
      if (response.success && response.data) {
        setExpenses(prev => prev.map(expense => expense.id === id ? response.data! : expense));
      }
      return response;
    } catch (error) {
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Failed to update expense' 
      };
    }
  }, [user, activeLocation]);

  const deleteExpense = useCallback(async (id: string) => {
    if (!user) return { success: false, error: 'User not authenticated' };
    
    try {
      const response = await financialService.deleteExpense(id, user.role, activeLocation?.id);
      if (response.success) {
        setExpenses(prev => prev.filter(expense => expense.id !== id));
        setPagination(prev => ({ ...prev, total: prev.total - 1 }));
      }
      return response;
    } catch (error) {
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Failed to delete expense' 
      };
    }
  }, [user, activeLocation]);

  return {
    expenses,
    loading,
    error,
    pagination,
    fetchExpenses,
    createExpense,
    updateExpense,
    deleteExpense,
    refetch: () => fetchExpenses()
  };
};

// Hook for financial KPIs and analytics
export const useFinancialKPIs = () => {
  const [kpis, setKpis] = useState<FinancialKPIs | null>(null);
  const [recentTransactions, setRecentTransactions] = useState<RecentTransaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const { user } = useAuthStore();
  const { activeLocation } = useLocationStore();

  const fetchKPIs = useCallback(async () => {
    if (!user) return;
    
    try {
      setLoading(true);
      setError(null);
      
      const [kpisResponse, transactionsResponse] = await Promise.all([
        financialService.getFinancialKPIs(user.role, activeLocation?.id),
        financialService.getRecentTransactions(user.role, activeLocation?.id, 10)
      ]);
      
      setKpis(kpisResponse);
      setRecentTransactions(transactionsResponse);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch financial data');
    } finally {
      setLoading(false);
    }
  }, [user, activeLocation]);

  const refreshKPIs = useCallback(() => {
    fetchKPIs();
  }, [fetchKPIs]);

  useEffect(() => {
    fetchKPIs();
  }, [fetchKPIs]);

  return {
    kpis,
    recentTransactions,
    loading,
    error,
    refreshKPIs
  };
};

// Combined hook for all financial data
export const useFinancialData = () => {
  const sales = useSales();
  const expenses = useExpenses();
  const kpis = useFinancialKPIs();

  const refreshAll = useCallback(() => {
    sales.refetch();
    expenses.refetch();
    kpis.refreshKPIs();
  }, [sales, expenses, kpis]);

  return {
    sales,
    expenses,
    kpis,
    refreshAll
  };
};
