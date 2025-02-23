import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, SafeAreaView, ScrollView, TouchableOpacity, ActivityIndicator } from 'react-native';
import { format, addDays } from 'date-fns';
import { fr } from 'date-fns/locale';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '@/config/supabase';
import { H1 } from '@/components/ui/typography';

const CATEGORIES = {
  opening: { title: 'Ouverture', color: '#4CAF50' },
  closing: { title: 'Fermeture', color: '#F44336' },
  maintenance: { title: 'Maintenance', color: '#2196F3' }
};

interface Task {
  id: string;
  completed: boolean;
  completed_at?: string;
  notes?: string;
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

export default function Planning() {
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [userEmail, setUserEmail] = useState<string | null | undefined>(null);

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
    borderRadius: 8,
    padding: 16,
    marginBottom: 8,
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
  taskDescription: {
    color: '#888',
    fontSize: 14,
    marginTop: 4,
  },
});
