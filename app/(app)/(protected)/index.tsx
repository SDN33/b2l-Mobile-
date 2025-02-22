import { useEffect, useState, useCallback, useRef } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, SafeAreaView, ScrollView, Animated, TouchableWithoutFeedback } from 'react-native';
import { MaterialIcons, AntDesign } from '@expo/vector-icons';
import { supabase } from '@/config/supabase';
import { Button } from '@/components/ui/button';
import { H1, Muted } from '@/components/ui/typography';
import { Database } from '@/lib/database';

type Note = Database['public']['Tables']['notes']['Row'] & { displayname: string };
type Employee = Database['public']['Tables']['employee']['Row'];

const NotesComponent = () => {
  const [currentNote, setCurrentNote] = useState('');
  const [notes, setNotes] = useState<Note[]>([]);
  const [archivedNotes, setArchivedNotes] = useState<Note[]>([]);
  const [showEmployees, setShowEmployees] = useState(false);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [cursorPosition, setCursorPosition] = useState({ top: 0, left: 0 });
  const [displayName, setDisplayName] = useState('');
  const textareaRef = useRef<TextInput>(null);
  const employeeListRef = useRef(null);

  useEffect(() => {
    const fetchUserProfile = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const displayNameValue = user.user_metadata?.full_name || user.email?.split('@')[0] || 'Anonymous';
        setDisplayName(displayNameValue);
      }
    };

    fetchUserProfile();
  }, []);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('fr-FR');
  };

  const fetchNotes = useCallback(async () => {
    try {
      const { data: activeData, error: activeError } = await supabase
        .from('notes')
        .select('*')
        .eq('archived', false)
        .order('is_starred', { ascending: false })
        .order('created_at', { ascending: false });

      if (activeError) throw activeError;
      if (activeData) setNotes(activeData);

      const { data: archivedData, error: archivedError } = await supabase
        .from('notes')
        .select('*')
        .eq('archived', true)
        .order('created_at', { ascending: false });

      if (archivedError) throw archivedError;
      if (archivedData) setArchivedNotes(archivedData);
    } catch (error) {
      console.error('Error fetching notes:', error);
    }
  }, [supabase]);

  const addSignatureToNote = (note: string, displayName: string) => {
    return `${note}\n\n— ${displayName}`;
  };

  const handleSaveNote = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const userDisplayName = user.user_metadata?.display_name ||
                              user.email?.split('@')[0] ||
                              'Anonymous';

        const noteWithSignature = addSignatureToNote(currentNote, userDisplayName);

        const { error } = await supabase
          .from('notes')
          .insert([{
            content: noteWithSignature,
            archived: false
          }]);

        if (error) throw error;
        setCurrentNote('');
        fetchNotes();
      }
    } catch (error) {
      console.error('Error saving note:', error);
    }
  };

  const handleArchiveNote = async (noteId: string) => {
    try {
      const { error } = await supabase
        .from('notes')
        .update({ archived: true })
        .eq('id', noteId);

      if (error) throw error;
      fetchNotes();
    } catch (error) {
      console.error('Error archiving note:', error);
    }
  };

  const fetchEmployees = useCallback(async (searchTerm: string = '') => {
    try {
      let query = supabase.from('employees').select('*').order('created_at', { ascending: false });

      if (searchTerm) {
        query = query.ilike('full_name', `%${searchTerm}%`);
      }

      const { data, error } = await query;

      if (error) throw error;
      setEmployees(data || []);
    } catch (error) {
      console.error('Error fetching employees:', error);
    }
  }, [supabase]);

  const handleTextareaChange = (text: string) => {
    setCurrentNote(text);
    const lastAtIndex = text.lastIndexOf('@');

    if (text.includes('@')) {
      const searchTerm = text.substring(lastAtIndex + 1);
      setShowEmployees(true);
      fetchEmployees(searchTerm);
    } else {
      setShowEmployees(false);
    }

    calculateCursorPosition();
  };

  const calculateCursorPosition = () => {
    setCursorPosition({ top: 50, left: 10 });
  };

  useEffect(() => {
    // In React Native, we'll handle closing the employees list
    // through other user interactions like blur events or selecting an employee
  }, [showEmployees]);

  const handleSelectEmployee = (employeeFullName: string) => {
    const lastAtIndex = currentNote.lastIndexOf('@');
    const newNote = currentNote.substring(0, lastAtIndex) + `**${employeeFullName}** `;

    setCurrentNote(newNote);
    setShowEmployees(false);

    if (textareaRef.current) {
      textareaRef.current.focus();
    }
  };

  const handleOutsideClick = () => {
    if (showEmployees) {
      setShowEmployees(false);
    }
  };

  useEffect(() => {
    fetchNotes();
  }, [fetchNotes]);

  return (
    <SafeAreaView style={styles.container}>
      <TouchableWithoutFeedback onPress={handleOutsideClick}>
        <View style={styles.container}>
          <View style={styles.header}>
            <H1 style={styles.title}>Notes</H1>
            <Muted style={styles.subtitle}>
              Retrouvez ici toutes les informations importantes
            </Muted>
          </View>

          <ScrollView
            contentContainerStyle={styles.scrollView}
            showsVerticalScrollIndicator={false}
          >
            <View style={styles.notesContainer}>
              {notes.map((note) => (
                <Animated.View key={note.id} style={styles.noteCard}>
                  <View style={styles.noteHeader}>
                    <Text style={styles.noteDate}>
                      {formatDate(note.created_at)} {new Date(note.created_at).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                    </Text>

                    {note.is_starred && (
                      <MaterialIcons
                        name="star"
                        size={16}
                        color="#FFB800"
                        style={styles.starIcon}
                      />
                    )}
                  </View>
                  <Text style={styles.noteContent}>{note.content}</Text>
                  {note.displayname === 'use client' && (
                    <TouchableOpacity
                      style={styles.archiveButton}
                      onPress={() => handleArchiveNote(note.id)}
                    >
                      <MaterialIcons name="archive" size={20} color="#6B7280" />
                    </TouchableOpacity>
                  )}
                </Animated.View>
              ))}
            </View>
          </ScrollView>

          <View style={styles.inputWrapper}>
            <Text style={styles.tagHint}>Pour taguer un employé, commencez par @</Text>
            <View style={styles.inputContainer}>
              <TextInput
                ref={textareaRef}
                style={styles.textarea}
                placeholder="Qu'avez-vous en tête ?"
                placeholderTextColor="#9CA3AF"
                multiline
                value={currentNote}
                onChangeText={handleTextareaChange}
              />
              {showEmployees && (
                <TouchableWithoutFeedback>
                  <View
                    ref={employeeListRef}
                    style={[styles.employeeList, { bottom: 100, left: 10 }]}
                  >
                    {employees.length > 0 ? (
                      employees.map((employee) => (
                        <TouchableOpacity key={employee.id} onPress={() => handleSelectEmployee(employee.full_name)}>
                          <Text style={styles.employeeItem}>{employee.full_name}</Text>
                        </TouchableOpacity>
                      ))
                    ) : (
                      <Text style={styles.noEmployees}>Aucun employé trouvé</Text>
                    )}
                  </View>
                </TouchableWithoutFeedback>
              )}
                <Button onPress={handleSaveNote} style={[styles.saveButton, { backgroundColor: '#B91C1C' }]}>
                <AntDesign name="plus" size={20} color="white" />
                <Text style={styles.buttonText}>Publier</Text>
              </Button>
            </View>
          </View>
        </View>
      </TouchableWithoutFeedback>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  tagHint: {
    color: '#6B7280',
    fontSize: 14,
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    color: '#6B7280',
    marginBottom: 16,
  },
  title: {
    marginBottom: 4,
  },
  header: {
    padding: 16,
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  scrollView: {
    flexGrow: 1,
    padding: 16,
    paddingBottom: 24,
  },
  notesContainer: {
    gap: 12,
  },
  noteCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    marginBottom: 12,
  },
  noteHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  noteDate: {
    fontSize: 12,
    color: '#6B7280',
    fontWeight: '500',
  },
  starIcon: {
    marginLeft: 8,
  },
  noteContent: {
    fontSize: 15,
    color: '#1F2937',
    lineHeight: 22,
  },
  archiveButton: {
    position: 'absolute',
    bottom: 12,
    right: 12,
    padding: 8,
    borderRadius: 8,
    backgroundColor: '#F3F4F6',
  },
  inputWrapper: {
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
    backgroundColor: '#FFFFFF',
  },
  inputContainer: {
    padding: 16,
    backgroundColor: '#F9FAFB',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 3,
  },
  textarea: {
    fontSize: 16,
    color: '#111827',
    minHeight: 80,
    maxHeight: 120,
    paddingTop: 8,
    paddingBottom: 8,
  },
  saveButton: {
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 12,
    backgroundColor: '#B91C1C',
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  employeeList: {
    position: 'absolute',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 8,
    maxHeight: 200,
    width: '90%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  employeeItem: {
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  noEmployees: {
    padding: 12,
    color: '#6B7280',
    textAlign: 'center',
  },
});

export default NotesComponent;
