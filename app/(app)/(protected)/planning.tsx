import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, SafeAreaView, ScrollView, TouchableOpacity, ActivityIndicator, Modal } from 'react-native';
import { format, addDays } from 'date-fns';
import { fr } from 'date-fns/locale';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '@/config/supabase';
import { H1 } from '@/components/ui/typography';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import DateTimePicker from '@react-native-community/datetimepicker';

const CATEGORIES = {
  opening: { title: 'Ouverture', color: '#4CAF50' },
  maintenance: { title: 'Maintenance', color: '#2196F3' },
};

interface Task {
  id: string;
  completed: boolean;
  completed_at?: string;
  notes?: string;
  shift_id: string;
  template: {
    id: string;
    name: string;
    category: keyof typeof CATEGORIES;
    description: string;
  };
  employee: {
    id: string;
    email: string;
    full_name: string;
  };
  shift: {
    date: string;
    shift_type: string;
  };
}

interface CashDetail {
  denomination: number;
  quantity: number;
  total: number;
}

interface CashReportForm {
  totalCash: number;
  cardPayments: number;
  tickets: number;
  notes: string;
  cashDetails: {
    bills: CashDetail[];
    coins: CashDetail[];
  };
  signature: string | null;
  hasConfirmedHonesty: boolean;
}

export default function Planning() {
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [userEmail, setUserEmail] = useState<string | null | undefined>(null);
  const [isReportModalVisible, setReportModalVisible] = useState(false);
  const [currentTaskId, setCurrentTaskId] = useState<string | null>(null);
  const [reportForm, setReportForm] = useState<CashReportForm>({
    totalCash: 0,
    cardPayments: 0,
    tickets: 0,
    notes: '',
    cashDetails: {
      bills: [
        { denomination: 500, quantity: 0, total: 0 },
        { denomination: 200, quantity: 0, total: 0 },
        { denomination: 100, quantity: 0, total: 0 },
        { denomination: 50, quantity: 0, total: 0 },
        { denomination: 20, quantity: 0, total: 0 },
        { denomination: 10, quantity: 0, total: 0 },
        { denomination: 5, quantity: 0, total: 0 }
      ],
      coins: [
        { denomination: 2, quantity: 0, total: 0 },
        { denomination: 1, quantity: 0, total: 0 },
        { denomination: 0.5, quantity: 0, total: 0 },
        { denomination: 0.2, quantity: 0, total: 0 },
        { denomination: 0.1, quantity: 0, total: 0 },
        { denomination: 0.05, quantity: 0, total: 0 },
        { denomination: 0.02, quantity: 0, total: 0 },
        { denomination: 0.01, quantity: 0, total: 0 }
      ]
    },
    signature: null,
    hasConfirmedHonesty: false
  });

  // Add this state for error handling
  const [error, setError] = useState<string | null>(null);

  const fetchUserAndTasks = useCallback(async () => {
    try {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();

      if (!user?.email) {
        console.error('No user email found');
        return;
      }

      setUserEmail(user.email);

      const { data, error } = await supabase
        .from('assigned_tasks')
        .select(`
          *,
          template:task_templates(
            id,
            name,
            category,
            description
          ),
          employee:employees(
            id,
            email,
            full_name
          ),
          shift:shifts!inner(
            date,
            shift_type
          )
        `)
        .eq('shift.date', format(selectedDate, 'yyyy-MM-dd'))
        .eq('employee.email', user.email); // Filter by current user's email

      if (error) {
        throw new Error(`Erreur lors de la récupération des tâches: ${error.message}`);
      }

      if (!data || data.length === 0) {
        setTasks([]);
        return;
      }

      // Additional verification to ensure we only get tasks assigned to the current user
      const userTasks = data.filter(task => task.employee?.email === user.email);
      setTasks(userTasks);

    } catch (error) {
      console.error('Error:', error);
      setError(error instanceof Error ? error.message : 'Une erreur est survenue');
    } finally {
      setLoading(false);
    }
  }, [selectedDate]);

  useEffect(() => {
    fetchUserAndTasks();
  }, [fetchUserAndTasks]);

  const handleCompleteTask = async (taskId: string) => {
    const task = tasks.find(t => t.id === taskId);
    if (!task) return;

    // Si c'est une tâche de comptage de caisse, ouvrir le modal
    if (task.template.name.toLowerCase().includes('comptage caisse')) {
      setCurrentTaskId(taskId);
      setReportModalVisible(true);
      return;
    }

    // Sinon, procéder normalement
    try {
      const { error } = await supabase
        .from('assigned_tasks')
        .update({
          completed: true,
          completed_at: new Date().toISOString(),
        })
        .eq('id', taskId);

      if (error) throw error;
      fetchUserAndTasks();
    } catch (error) {
      console.error('Error completing task:', error);
    }
  };

  // Modify the handleSubmitCashReport function
  const handleSubmitCashReport = async (taskId: string) => {
    try {
      setError(null); // Reset any previous errors
      const task = tasks.find(t => t.id === taskId);
      if (!task) {
        throw new Error('Tâche non trouvée');
      }

      // Check internet connection
      const networkState = await fetch('https://www.google.com', {
        mode: 'no-cors',
        cache: 'no-cache'
      }).catch(() => null);

      if (!networkState) {
        throw new Error('Pas de connexion internet. Veuillez réessayer.');
      }

      // Rest of your existing code...
      const reportType = task.template.category === 'opening' ? 'opening' : 'closing';
      const billsTotal = reportForm.cashDetails.bills.reduce((sum, bill) => sum + bill.total, 0);
      const coinsTotal = reportForm.cashDetails.coins.reduce((sum, coin) => sum + coin.total, 0);

      // Add loading state feedback
      setLoading(true);

      // Créer le rapport de caisse
      const { error: cashError } = await supabase
        .from('cash_reports')
        .insert({
          shift_id: task.shift_id,
          type: reportType, // Add the report type
          amount_start: reportForm.totalCash,
          amount_end: reportForm.totalCash,
          notes: JSON.stringify({
            totalCash: reportForm.totalCash,
            cardPayments: reportForm.cardPayments,
            tickets: reportForm.tickets,
            notes: reportForm.notes,
            details: {
              bills: reportForm.cashDetails.bills.map(bill => ({
                denomination: bill.denomination,
                quantity: bill.quantity,
                total: bill.total
              })),
              coins: reportForm.cashDetails.coins.map(coin => ({
                denomination: coin.denomination,
                quantity: coin.quantity,
                total: coin.total
              })),
              summary: {
                billsTotal,
                coinsTotal,
                total: billsTotal + coinsTotal
              }
            },
            hasConfirmedHonesty: reportForm.hasConfirmedHonesty,
            submittedAt: new Date().toISOString(),
            reportType // Include type in notes for reference
          }),
          created_at: new Date().toISOString()
        });

      if (cashError) {
        throw new Error(`Erreur lors de la création du rapport: ${cashError.message}`);
      }

      // Update the task completion
      const { error: taskError } = await supabase
        .from('assigned_tasks')
        .update({
          completed: true,
          completed_at: new Date().toISOString(),
          notes: JSON.stringify({
            type: 'cash_report',
            reportType, // Include type in task notes
            totalAmount: reportForm.totalCash,
            submittedAt: new Date().toISOString()
          })
        })
        .eq('id', taskId);

      if (taskError) throw taskError;

      // Réinitialiser le formulaire et fermer le modal
      setReportModalVisible(false);
      setReportForm({
        totalCash: 0,
        cardPayments: 0,
        tickets: 0,
        notes: '',
        cashDetails: {
          bills: [
            { denomination: 500, quantity: 0, total: 0 },
            { denomination: 200, quantity: 0, total: 0 },
            { denomination: 100, quantity: 0, total: 0 },
            { denomination: 50, quantity: 0, total: 0 },
            { denomination: 20, quantity: 0, total: 0 },
            { denomination: 10, quantity: 0, total: 0 },
            { denomination: 5, quantity: 0, total: 0 }
          ],
          coins: [
            { denomination: 2, quantity: 0, total: 0 },
            { denomination: 1, quantity: 0, total: 0 },
            { denomination: 0.5, quantity: 0, total: 0 },
            { denomination: 0.2, quantity: 0, total: 0 },
            { denomination: 0.1, quantity: 0, total: 0 },
            { denomination: 0.05, quantity: 0, total: 0 },
            { denomination: 0.02, quantity: 0, total: 0 },
            { denomination: 0.01, quantity: 0, total: 0 }
          ]
        },
        signature: null,
        hasConfirmedHonesty: false
      });
      setCurrentTaskId(null);
      fetchUserAndTasks();

    } catch (error) {
      console.error('Error submitting cash report:', error);
      setError(error instanceof Error ? error.message : 'Une erreur est survenue');
    } finally {
      setLoading(false);
    }
  };

  const updateCashDetails = (type: 'bills' | 'coins', index: number, quantity: number) => {
    setReportForm(prev => {
      const newDetails = { ...prev.cashDetails };
      newDetails[type][index].quantity = quantity;
      newDetails[type][index].total = quantity * newDetails[type][index].denomination;

      // Recalculer le total
      const newTotal = [
        ...newDetails.bills,
        ...newDetails.coins
      ].reduce((sum, item) => sum + item.total, 0);

      return {
        ...prev,
        cashDetails: newDetails,
        totalCash: newTotal
      };
    });
  };

  const renderDateNavigation = () => (
    <View style={styles.dateNavigation}>
      <TouchableOpacity
        onPress={() => setSelectedDate(addDays(selectedDate, -1))}
        style={styles.navButton}
      >
        <Ionicons name="chevron-back" size={24} color="white" />
      </TouchableOpacity>

      <Text style={styles.dateText}>
        {format(selectedDate, 'EEEE d MMMM', { locale: fr })}
      </Text>

      <TouchableOpacity
        onPress={() => setSelectedDate(addDays(selectedDate, 1))}
        style={styles.navButton}
      >
        <Ionicons name="chevron-forward" size={24} color="white" />
      </TouchableOpacity>
    </View>
  );

  const renderTasksByCategory = (category: keyof typeof CATEGORIES) => {
    const categoryTasks = tasks.filter(task => task.template.category === category);

    if (categoryTasks.length === 0) return null;

    return (
      <View style={[styles.categorySection, { borderLeftColor: CATEGORIES[category].color }]}>
        <Text style={styles.categoryTitle}>{CATEGORIES[category].title}</Text>
        {categoryTasks.map((task) => (
          <View key={`task-${task.id}`} style={[
            styles.taskCard,
            task.completed && styles.completedTask
          ]}>
            <View style={styles.taskContent}>
              <Text style={styles.taskTitle}>{task.template.name}</Text>
              <Text style={styles.taskAssignee}>
                Assigné à: {task.employee?.full_name || 'Non assigné'}
              </Text>
              {task.template.description && (
                <Text style={styles.taskDescription}>{task.template.description}</Text>
              )}
              {task.completed && task.completed_at && (
                <Text style={styles.completedAt}>
                  Terminé le {format(new Date(task.completed_at), 'HH:mm')}
                </Text>
              )}
            </View>

            {!task.completed && (
              <TouchableOpacity
                onPress={() => handleCompleteTask(task.id)}
                style={styles.completeButton}
              >
                <View style={styles.completeButtonContent}>
                  <Ionicons
                    name="checkmark-circle-outline"
                    size={24}
                    color={CATEGORIES[category].color}
                  />
                  <Text style={[
                    styles.completeButtonText,
                    {
                      color: task.template.name.toLowerCase().includes('comptage caisse')
                        ? '#F44336' // Red color for cash count tasks
                        : CATEGORIES[category].color
                    }
                  ]}>
                    {task.template.name.toLowerCase().includes('comptage caisse')
                      ? '⚠️ Saisir rapport'
                      : 'Valider'
                    }
                  </Text>
                </View>
              </TouchableOpacity>
            )}
          </View>
        ))}
      </View>
    );
  };

  // Modify the modal to show errors
  const renderCashReportModal = () => (
    <Modal
      visible={isReportModalVisible}
      onRequestClose={() => setReportModalVisible(false)}
    >
      <ScrollView style={styles.modalScrollView}>
        <View style={styles.modalContent}>
          <H1 style={styles.modalTitle}>
            {currentTaskId && tasks.find(t => t.id === currentTaskId)?.template.category === 'opening'
              ? "Rapport d'ouverture"
              : "Rapport de fermeture"
            }
          </H1>

          {/* Add error message display */}
          {error && (
            <View style={styles.errorContainer}>
              <Text style={styles.errorText}>{error}</Text>
            </View>
          )}

          {/* Section Billets */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Billets</Text>
            {reportForm.cashDetails.bills.map((bill, index) => (
              <View key={`bill-${bill.denomination}-${index}`} style={styles.cashRow}>
                <Text style={styles.denominationText}>{bill.denomination}€</Text>
                <Input
                  style={styles.quantityInput}
                  keyboardType="numeric"
                  value={bill.quantity.toString()}
                  onChangeText={(value) => updateCashDetails('bills', index, parseInt(value) || 0)}
                />
                <Text style={styles.totalText}>{bill.total.toFixed(2)}€</Text>
              </View>
            ))}
          </View>

          {/* Section Pièces */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Pièces</Text>
            {reportForm.cashDetails.coins.map((coin, index) => (
              <View key={`coin-${coin.denomination}-${index}`} style={styles.cashRow}>
                <Text style={styles.denominationText}>
                  {coin.denomination < 1 ? `${(coin.denomination * 100).toFixed(0)}c` : `${coin.denomination}€`}
                </Text>
                <Input
                  style={styles.quantityInput}
                  keyboardType="numeric"
                  value={coin.quantity.toString()}
                  onChangeText={(value) => updateCashDetails('coins', index, parseInt(value) || 0)}
                />
                <Text style={styles.totalText}>{coin.total.toFixed(2)}€</Text>
              </View>
            ))}
          </View>

          {/* Total et autres moyens de paiement */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Récapitulatif</Text>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Total Espèces:</Text>
              <Text style={styles.summaryValue}>{reportForm.totalCash.toFixed(2)}€</Text>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Paiements CB</Text>
              <Input
                keyboardType="numeric"
                value={reportForm.cardPayments.toString()}
                onChangeText={(value) => setReportForm(prev => ({
                  ...prev,
                  cardPayments: parseFloat(value) || 0
                }))}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Tickets Restaurant</Text>
              <Input
                keyboardType="numeric"
                value={reportForm.tickets.toString()}
                onChangeText={(value) => setReportForm(prev => ({
                  ...prev,
                  tickets: parseFloat(value) || 0
                }))}
              />
            </View>
          </View>

          {/* Notes et Signature */}
          <View style={styles.section}>
            <Text style={styles.inputLabel}>Notes / Observations</Text>
            <Input
              multiline
              numberOfLines={3}
              value={reportForm.notes}
              onChangeText={(value) => setReportForm(prev => ({
                ...prev,
                notes: value
              }))}
            />
          </View>

          {/* Déclaration sur l'honneur */}
          <View style={styles.honorSection}>
            <TouchableOpacity
              style={styles.checkboxContainer}
              onPress={() => setReportForm(prev => ({
                ...prev,
                hasConfirmedHonesty: !prev.hasConfirmedHonesty
              }))}
            >
              <View style={[
                styles.checkbox,
                reportForm.hasConfirmedHonesty && styles.checkboxChecked
              ]}>
                {reportForm.hasConfirmedHonesty && (
                  <Ionicons name="checkmark" size={16} color="white" />
                )}
              </View>
              <Text style={styles.honorText}>
                Je déclare sur l'honneur que les informations communiquées sont exactes
              </Text>
            </TouchableOpacity>
          </View>

          <View style={styles.modalButtons}>
            <Button
              onPress={() => {
                setError(null);
                setReportModalVisible(false);
              }}
              variant="secondary"
            >
              <Text style={styles.buttonText}>Annuler</Text>
            </Button>
            <Button
              onPress={() => currentTaskId && handleSubmitCashReport(currentTaskId)}
              variant="destructive"
              disabled={!reportForm.hasConfirmedHonesty || loading}
            >
              {loading ? (
                <ActivityIndicator size="small" color="white" />
              ) : (
                <Text style={styles.buttonText}>Valider</Text>
              )}
            </Button>
          </View>
        </View>
      </ScrollView>
    </Modal>
  );

  return (
    <SafeAreaView style={styles.container}>
      <H1 style={styles.title}>Votre Planning</H1>
      {renderDateNavigation()}

      {loading ? (
        <ActivityIndicator size="large" color="#ffffff" style={styles.loader} />
      ) : tasks.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Ionicons name="calendar-outline" size={64} color="white" />
          <Text style={styles.emptyText}>Aucune tâche pour aujourd'hui</Text>
        </View>
      ) : (
        <ScrollView style={styles.scrollView}>
          {(Object.keys(CATEGORIES) as Array<keyof typeof CATEGORIES>).map((category) => (
            <React.Fragment key={`category-${category}`}>
              {renderTasksByCategory(category)}
            </React.Fragment>
          ))}
        </ScrollView>
      )}
      {renderCashReportModal()}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff', // Changed from empty string to white
    padding: 16,
  },
  title: {
    color: 'white',
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 16,
    textAlign: 'center',
  },
  dateNavigation: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
    backgroundColor: '#2d2d2d',
    borderRadius: 12,
    padding: 12,
  },
  navButton: {
    padding: 8,
  },
  dateText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
    textTransform: 'capitalize',
  },
  scrollView: {
    flex: 1,
  },
  categorySection: {
    marginBottom: 24,
    backgroundColor: '#2d2d2d',
    borderRadius: 12,
    padding: 16,
    borderLeftWidth: 4,
  },
  categoryTitle: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 12,
  },
  taskCard: {
    backgroundColor: '#3d3d3d',
    marginBottom: 8,
    padding: 16,
    borderRadius: 8,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  completedTask: {
    opacity: 0.7,
    backgroundColor: '#2d2d2d',
  },
  taskContent: {
    flex: 1,
  },
  taskTitle: {
    color: 'white',
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 4,
  },
  taskAssignee: {
    color: '#999',
    fontSize: 14,
  },
  completedAt: {
    color: '#666',
    fontSize: 12,
    marginTop: 4,
  },
  completeButton: {
    padding: 8,
    minWidth: 100,
  },
  completeButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  completeButtonText: {
    fontSize: 14,
    fontWeight: '500',
  },
  loader: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalScrollView: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  modalContent: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 40,
    margin: 20,
    maxWidth: 600,
    alignSelf: 'center',
    width: '100%',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 12,
    color: '#333',
  },
  cashRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    gap: 12,
  },
  denominationText: {
    width: 60,
    fontSize: 16,
    fontWeight: '500',
  },
  quantityInput: {
    flex: 1,
    maxWidth: 100,
  },
  totalText: {
    width: 80,
    textAlign: 'right',
    fontSize: 16,
    fontWeight: '500',
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  summaryLabel: {
    fontSize: 16,
    fontWeight: '600',
  },
  summaryValue: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  inputGroup: {
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 16,
    marginBottom: 8,
    color: '#333',
  },
  honorSection: {
    marginBottom: 24,
    padding: 16,
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
  },
  checkboxContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderWidth: 2,
    borderColor: '#666',
    borderRadius: 4,
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkboxChecked: {
    backgroundColor: '#4CAF50',
    borderColor: '#4CAF50',
  },
  honorText: {
    flex: 1,
    fontSize: 14,
    color: '#666',
  },
  taskDescription: {
    color: '#888',
    fontSize: 14,
    marginTop: 4,
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 12,
    marginTop: 24,

  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '500',
  },
  // Add these new styles
  errorContainer: {
    backgroundColor: '#ffebee',
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#ef5350',
  },
  errorText: {
    color: '#c62828',
    fontSize: 14,
    textAlign: 'center',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#2d2d2d',
    margin: 16,
    borderRadius: 12,
    padding: 24,
  },
  emptyText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
    marginTop: 16,
  },
});
