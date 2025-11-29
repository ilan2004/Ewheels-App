import { financialService } from '@/services/financialService';
import { useAuthStore } from '@/stores/authStore';
import { useLocationStore } from '@/stores/locationStore';
import {
  DailyCash,
  Expense,
  ExpenseForm,
  ExpensesFilters,
  FinancialKPIs,
  RecentTransaction,
  Sale,
  SaleForm,
  SalesFilters
} from '@/types/financial.types';
import { useCallback, useEffect, useState } from 'react';

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

// Hook for managing cash management data
export const useCashManagement = () => {
  const [dailyCash, setDailyCash] = useState<DailyCash | null>(null);
  const [cashSales, setCashSales] = useState<Sale[]>([]);
  const [cashExpenses, setCashExpenses] = useState<Expense[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { user } = useAuthStore();
  const { activeLocation } = useLocationStore();

  const fetchData = useCallback(async (date: string) => {
    if (!user) return;

    try {
      setLoading(true);
      setError(null);

      const [dailyCashRes, cashSalesRes, cashExpensesRes] = await Promise.all([
        financialService.getDailyCash(date, user.role, activeLocation?.id),
        financialService.getCashSales(date, user.role, activeLocation?.id),
        financialService.getCashExpenses(date, user.role, activeLocation?.id)
      ]);

      if (dailyCashRes.success) setDailyCash(dailyCashRes.data || null);
      if (cashSalesRes.success) setCashSales(cashSalesRes.data || []);
      if (cashExpensesRes.success) setCashExpenses(cashExpensesRes.data || []);

      if (dailyCashRes.error) setError(dailyCashRes.error);
      if (cashSalesRes.error) setError(cashSalesRes.error);
      if (cashExpensesRes.error) setError(cashExpensesRes.error);

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch cash management data');
    } finally {
      setLoading(false);
    }
  }, [user, activeLocation]);

  const updateDailyCash = useCallback(async (date: string, data: Partial<DailyCash>) => {
    if (!user) return { success: false, error: 'User not authenticated' };

    try {
      const response = await financialService.updateDailyCash(date, data, user.role, activeLocation?.id);
      if (response.success && response.data) {
        setDailyCash(response.data);
      }
      return response;
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to update daily cash'
      };
    }
  }, [user, activeLocation]);

  return {
    dailyCash,
    cashSales,
    cashExpenses,
    loading,
    error,
    fetchData,
    updateDailyCash
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
