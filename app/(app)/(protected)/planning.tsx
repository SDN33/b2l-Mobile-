import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, SafeAreaView, ScrollView, TouchableOpacity, ActivityIndicator, Modal } from 'react-native';
import { format, addDays } from 'date-fns';
import { fr } from 'date-fns/locale';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '@/config/supabase';
import { H1 } from '@/components/ui/typography';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

const CATEGORIES = {
  opening: { title: 'Ouverture', color: '#4CAF50' },
  closing: { title: 'Fermeture', color: '#F44336' },
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

interface CashReportForm {
  totalCash: number;
  cardPayments: number;
  tickets: number;
  notes: string;
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
  });

  const fetchUserAndTasks = useCallback(async () => {
    try {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
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
          .eq('shift.date', format(selectedDate, 'yyyy-MM-dd'));

        if (error) throw error;
        setTasks(data || []);
      }
    } catch (error) {
      console.error('Error:', error);
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

  const handleSubmitCashReport = async (taskId: string) => {
    try {
      const task = tasks.find(t => t.id === taskId);
      if (!task) return;

      // Créer le rapport de caisse
      const { error: cashError } = await supabase
        .from('cash_reports')
        .insert({
          shift_id: task.shift_id,
          amount_start: reportForm.totalCash,
          amount_end: reportForm.totalCash,
          notes: JSON.stringify({
            totalCash: reportForm.totalCash,
            cardPayments: reportForm.cardPayments,
            tickets: reportForm.tickets,
            notes: reportForm.notes
          }),
          created_at: new Date().toISOString()
        });

      if (cashError) throw cashError;

      // Marquer la tâche comme terminée
      const { error: taskError } = await supabase
        .from('assigned_tasks')
        .update({
          completed: true,
          completed_at: new Date().toISOString(),
        })
        .eq('id', taskId);

      if (taskError) throw taskError;

      // Fermer le modal et réinitialiser le formulaire
      setReportModalVisible(false);
      setReportForm({
        totalCash: 0,
        cardPayments: 0,
        tickets: 0,
        notes: ''
      });
      setCurrentTaskId(null);
      fetchUserAndTasks();
    } catch (error) {
      console.error('Error submitting cash report:', error);
    }
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
          <View key={task.id} style={[
            styles.taskCard,
            task.completed && styles.completedTask
          ]}>
            <View style={styles.taskContent}>
              <Text style={styles.taskTitle}>{task.template.name}</Text>
              <Text style={styles.taskAssignee}>
                Assigné à: {task.employee.full_name}
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

            {task.employee.email === userEmail && !task.completed && (
              <TouchableOpacity
                onPress={() => handleCompleteTask(task.id)}
                style={styles.completeButton}
              >
                <Ionicons name="checkmark-circle-outline" size={24} color={CATEGORIES[category].color} />
              </TouchableOpacity>
            )}
          </View>
        ))}
      </View>
    );
  };

  const renderCashReportModal = () => (
    <Modal
      visible={isReportModalVisible}
      onRequestClose={() => setReportModalVisible(false)}
    >
      <View style={styles.modalContent}>
        <H1>Rapport de caisse</H1>

        <View>
          <Text style={styles.inputLabel}>Total Espèces</Text>
          <Input
            keyboardType="numeric"
            value={reportForm.totalCash.toString()}
            onChangeText={(value: string) => setReportForm(prev => ({
              ...prev,
              totalCash: parseFloat(value) || 0
            }))}
          />
        </View>

        <Text style={styles.inputLabel}>Paiements CB</Text>
        <Input
          placeholder="Paiements CB"
          keyboardType="numeric"
          value={reportForm.cardPayments.toString()}
          onChangeText={(value: string) => setReportForm(prev => ({
            ...prev,
            cardPayments: parseFloat(value) || 0
          }))}
        />
        <Text style={styles.inputLabel}>Tickets Restaurant</Text>
        <Input
          keyboardType="numeric"
          value={reportForm.tickets.toString()}
          onChangeText={(value: string) => setReportForm(prev => ({
            ...prev,
            tickets: parseFloat(value) || 0
          }))}
        />

        <Text style={styles.inputLabel}>Notes</Text>
        <Input
          multiline
          numberOfLines={3}
          value={reportForm.notes}
          onChangeText={(value: string) => setReportForm(prev => ({
            ...prev,
            notes: value
          }))}
        />

        <View style={styles.modalButtons}>
          <Button
            onPress={() => setReportModalVisible(false)}
            variant="secondary"
          >
            Annuler
          </Button>
          <Button
            onPress={() => currentTaskId && handleSubmitCashReport(currentTaskId)}
            variant="default"
          >
            Valider
          </Button>
        </View>
      </View>
    </Modal>
  );

  return (
    <SafeAreaView style={styles.container}>
      <H1 style={styles.title}>Votre Planning</H1>
      {renderDateNavigation()}

      {loading ? (
        <ActivityIndicator size="large" color="#ffffff" style={styles.loader} />
      ) : (
        <ScrollView style={styles.scrollView}>
          {Object.keys(CATEGORIES).map((category) => renderTasksByCategory(category as keyof typeof CATEGORIES))}
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
  },
  loader: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    padding: 20,
    backgroundColor: 'white',
    borderRadius: 12,
    width: '90%',
    maxWidth: 500,
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 10,
    marginTop: 16,
  },
  taskDescription: {
    color: '#888',
    fontSize: 14,
    marginTop: 4,
  },
  inputLabel: {
    fontSize: 16,
    marginBottom: 8,
    color: '#333',
  },
});
