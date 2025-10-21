import React, { useState, useEffect } from 'react';
import { supabase, signInAnon } from './utils/supabase';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  Image,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Calendar } from 'react-native-calendars';
import AsyncStorage from '@react-native-async-storage/async-storage';

import { useTranslation } from 'react-i18next';
import './i18n';

export default function App() {
  const [tasks, setTasks] = useState([]);
  const [showAddTask, setShowAddTask] = useState(false);
  const [newTaskText, setNewTaskText] = useState('');
  const [newTaskDate, setNewTaskDate] = useState('');
  const [newTaskPriority, setNewTaskPriority] = useState('medium');
  const [showCalendar, setShowCalendar] = useState(false);
  const [showEditTask, setShowEditTask] = useState(false);
  const [editingTask, setEditingTask] = useState(null);
  const [editTaskText, setEditTaskText] = useState('');
  const [editTaskDate, setEditTaskDate] = useState('');
  const [editTaskPriority, setEditTaskPriority] = useState('medium');
  const [showEditCalendar, setShowEditCalendar] = useState(false);
  const [activeTab, setActiveTab] = useState('current');

  const { t, i18n } = useTranslation();


  useEffect(() => {
  const initUser = async () => {
      const session = await supabase.auth.getSession()
      
      if (!session.data.session) {
        const user = await signInAnon()
        await AsyncStorage.setItem('user_id', user.id)
        console.log('Usuário anonimo criado e ID salvo:', user.id);
      }
    }
    initUser()
    
  }, []);


  const getTasks = async () => {
    try {
      const {data: tasks, error} = await supabase.from('tasks').select();

      if (error) {
        console.error('Error fetching tasks:', error);
        return;
      }

      if (tasks && tasks.length > 0) {
        setTasks(tasks);
      }
    } catch (error) {
      console.error('Error fetching tasks:', error);
    }
  };

  // Load tasks from storage on app start
  useEffect(() => {
    getTasks();
  }, []);

  const saveTask = async (task) => {

    const { error } =  await supabase.from('tasks').update(task);
    await getTasks();
  };

  const validateDate = (dateString) => {
    if (!dateString.trim()) return true; // Empty date is valid (will use today's date)
    
    // Check if date matches DD/MM/YYYY format
    const dateRegex = /^(\d{1,2})\/(\d{1,2})\/(\d{4})$/;
    const match = dateString.match(dateRegex);
    
    if (!match) return false;
    
    const day = parseInt(match[1], 10);
    const month = parseInt(match[2], 10);
    const year = parseInt(match[3], 10);
    
    // Check if date is valid
    const date = new Date(year, month - 1, day);

    return date.getDate() === day && 
           date.getMonth() === month - 1 && 
           date.getFullYear() === year 
  };

  const formatDate = (dateString) => {
    if (!dateString.trim()) return new Date().toLocaleDateString('pt-BR');
    
    const dateRegex = /^(\d{1,2})\/(\d{1,2})\/(\d{4})$/;
    const match = dateString.match(dateRegex);
    
    if (!match) return new Date().toLocaleDateString('pt-BR');
    
    const day = match[1].padStart(2, '0');
    const month = match[2].padStart(2, '0');
    const year = match[3];
    
    return `${month}/${day}/${year}`;
  };

  const handleDateSelect = (day) => {
    const selectedDate = new Date(day.dateString);
    const formattedDate = formatDateDisplay(selectedDate)
    setNewTaskDate(formattedDate);
    setShowCalendar(false);
  };

  const handleEditDateSelect = (day) => {
    const selectedDate = new Date(day.dateString);
    const formattedDate = formatDateDisplay(selectedDate)

    setEditTaskDate(formattedDate);
    
    const task = {
      ...editingTask,
      date: selectedDate.toISOString().split('T')[0]
    }

    setEditingTask(task)
    setShowEditCalendar(false);
  };

  // utils/formatDateDisplay.js
  const formatDateDisplay = (input) => {
    let day, month, year;

    if (input instanceof Date) {
      // input é Date
      [year, month, day] = input.toISOString().split('T')[0].split('-');
    } else if (typeof input === 'string') {
      // input é string "YYYY-MM-DD"
      [year, month, day] = input.split('-');
    } else {
      throw new Error('Input must be a Date or string in YYYY-MM-DD format');
    }

    return `${day}/${month}/${year}`;
  };


  const addTask = async () => {
    if (newTaskText.trim() === '') {
      Alert.alert(t('erroTitulo'), t('digiteDescricao'));
      return;
    }

    if (!validateDate(newTaskDate)) {
      Alert.alert(t('erroTitulo'), t('digiteDataValida'));
      return;
    }

    const user_id = await AsyncStorage.getItem('user_id');

    const newTask = {
      id: Date.now().toString(),
      text: newTaskText.trim(),
      date: normalizeSupabaseDate(newTaskDate) || new Date().toISOString().split('T')[0],
      priority: newTaskPriority,
      completed: false,
      completedDate: null,
      user_id: user_id
    };

    const { error } =  await supabase.from('tasks').insert(newTask);

    if (error) Alert.alert(t('erroTitulo'), error.message)
    else {
      setShowAddTask(false);
      setNewTaskText('');
      setNewTaskDate('');
      setNewTaskPriority('medium');

      await getTasks();

    }
  };

  const toggleTask = async (taskId) => {
    const task = tasks.find(t => t.id === taskId);
    if (!task) return;

    // Se a tarefa já está concluída, pedir confirmação para desmarcar
    if (task.completedDate) {
      Alert.alert(
        t('confirmacaoTitulo'),
        t('confirmarDesmarcarConclusao'),
        [
          { text: t('botaoCancelar'), style: 'cancel' },
          {
            text: t('botaoConfirmar'),
            onPress: async () => {
              let newCompletedDate = null;

              // Atualiza a UI imediatamente
              setTasks(prevTasks =>
                prevTasks.map(t =>
                  t.id === taskId ? { ...t, completedDate: newCompletedDate } : t
                )
              );

              try {
                const { error } = await supabase
                  .from('tasks')
                  .update({ completedDate: newCompletedDate })
                  .eq('id', taskId);

                if (error) throw error;
              } catch (err) {
                Alert.alert(t('erroTitulo'), err.message);
                getTasks(); // reverter UI se houver erro
              }
            },
          },
        ]
      );
    } else {
      // Se não está concluída, apenas completa sem alerta
      const newCompletedDate = new Date().toISOString().split('T')[0];

      setTasks(prevTasks =>
        prevTasks.map(t =>
          t.id === taskId ? { ...t, completedDate: newCompletedDate } : t
        )
      );
      
      try {
        const { error } = await supabase.from('tasks')
          .update({ completedDate: newCompletedDate })
          .eq('id', taskId);

          if (error) throw error;
        } catch (err) {
          Alert.alert(t('erroTitulo'), err.message);
          getTasks(); // reverter UI se houver erro
        }
    }
  };


  
  const deleteTask = (taskId) => {
    Alert.alert(
      t('confirmacaoTitulo'),
      t('confirmarExcluirTarefa'),
      [
        { text: t('botaoCancelar'), style: 'cancel' },
        {
          text: t('botaoConfirmar'),
          style: 'destructive',
          onPress: async () => {
            const { error } = await supabase.from('tasks').delete().eq('id', taskId);

            if (error) Alert.alert(t('erroTitulo'), error.message)
            else {
              getTasks();
            
            }
          },
        },
      ]
    );
  };

  const editTask = (taskId) => {
    const task = tasks.find(t => t.id === taskId);
    if (task) {
      setEditingTask(task);
      setEditTaskText(task.text);
      setEditTaskDate(formatDateDisplay(task.date));
      setEditTaskPriority(task.priority || 'medium');
      setShowEditTask(true);
    }
  };

  const saveEditTask = async () => {
    if (editTaskText.trim() === '') {

      Alert.alert(t('erroTitulo'), t('digiteDescricao'));
      return;
    }

    if (!validateDate(editTaskDate)) {
      Alert.alert(t('erroTitulo'), t('digiteDataValida'));
      return;
    }

    const updatedTask = {
      ...editingTask,
      text: editTaskText.trim(),
      // date: normalizeSupabaseDate(editTaskDate),
      priority: editTaskPriority
    };

    const { error } = await supabase.from('tasks').update(updatedTask).eq('id', updatedTask.id);

    if (error) Alert.alert(t('erroTitulo'), error.message)
    else {
      getTasks();
      setShowEditTask(false);
      setEditingTask(null);
      setEditTaskText('');
      setEditTaskDate('');
      setEditTaskPriority('medium');

    }
  };

  const cancelEditTask = () => {
    setShowEditTask(false);
    setEditingTask(null);
    setEditTaskText('');
    setEditTaskDate('');
    setEditTaskPriority('medium');
  };

  const getTodayTasks = () => {
    const today = new Date().toISOString().split('T')[0];
    return tasks.filter(task => !task.completedDate || (task.completedDate && normalizeSupabaseDate(task.completedDate) == today));
  };

  const getCompletedToday = () => {
    const today = new Date().toISOString().split('T')[0];
    return tasks.filter(task => task.completedDate === today);
  };

  const getCurrentTasks = () => {
    const today = new Date().toISOString().split('T')[0]

    return tasks.filter(task => !task.completedDate || (task.completedDate && normalizeSupabaseDate(task.completedDate) == today))
  };

  const getCompletedTasks = () => {
    const today = new Date().toISOString().split('T')[0];

    return tasks.filter(task => task.completedDate && normalizeSupabaseDate(task.completedDate) !== today);
  };

  function normalizeSupabaseDate(dateStr) {
    // Supabase: "YYYY-DD-MM", ex: "2025-07-10"
    let year, month, day;
    if (dateStr.includes('-')){
      [year, month, day] = dateStr.split('-')
    } else if (dateStr.includes('/')){
      [day, month, year]  = dateStr.split('/')
    } else return null;

    return `${year}-${month}-${day}`; // "YYYY-MM-DD"
  }

  const getTasksByTab = () => {
    if (activeTab === 'current') {
      return getCurrentTasks();
    } else {
      return getCompletedTasks();
    }
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'high':
        return '#EF4444'; // Red
      case 'medium':
        return '#F59E0B'; // Orange
      case 'low':
        return '#10B981'; // Green
      default:
        return '#6B7280'; // Gray
    }
  };

  const getPriorityLabel = (priority) => {
    switch (priority) {
      case 'high':
        return t('prioridadeAlta');
      case 'medium':
        return t('prioridadeMedia');
      case 'low':
        return t('prioridadeBaixa');
      default:
        return t('prioridadeMedia');
    }
  };

  const handleTabChange = async (tab) => {
    setActiveTab(tab);
  };

  const todayTasks = getTodayTasks();
  const completedToday = getCompletedToday();

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#fff" />
      
      {/* Header */}
      <View style={styles.header}>
        <Image 
          source={require('./assets/logo.png')} 
          style={styles.logoImage} 
          resizeMode="contain"
        />

        <Text style={styles.title}>Agile Tasks!</Text>
      </View>

      {/* Today's Summary */}
      <View style={styles.summaryContainer}>
        <Text style={styles.summaryText}>
          {t('finalizadasHoje')}: <Text style={styles.summaryNumbers}>{completedToday.length} / {todayTasks.length}</Text>
        </Text>
      </View>

      {/* Tab Navigation */}
      <View style={styles.tabContainer}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'current' && styles.activeTab]}
          onPress={() => handleTabChange('current')}
        >
          <Text style={[styles.tabText, activeTab === 'current' && styles.activeTabText]}>
            {t('tarefasAtuais')}
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'completed' && styles.activeTab]}
          onPress={() => handleTabChange('completed')}
        >
          <Text style={[styles.tabText, activeTab === 'completed' && styles.activeTabText]}>
            {t('concluidas')}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Task List */}
        <ScrollView style={styles.taskList} showsVerticalScrollIndicator={false}>
          {getTasksByTab().map((task) => (
            <View key={task.id} style={[styles.taskItem, task.completedDate && styles.completedTaskItem]}>
              <View style={styles.taskContent}>
                <View style={styles.taskHeader}>
                  <Text style={[styles.taskText, task.completedDate && styles.completedTask]}>
                    {task.text}
                  </Text>
                  <View style={styles.taskBadges}>
                    <View style={[styles.priorityBadge, { backgroundColor: getPriorityColor(task.priority || 'medium') }]}>
                      <Text style={styles.priorityBadgeText}>
                        {getPriorityLabel(task.priority || 'medium')}
                      </Text>
                    </View>
                  </View>
                </View>
                <Text style={[styles.taskDate, task.completedDate && styles.completedTaskDate]}>
                  {t('prazo')}: {formatDateDisplay(task.date)} {activeTab === 'completed' && task.completedDate ? `(${t('conclusao')}: ${formatDateDisplay(task.completedDate)})` : ''}
                </Text>
              </View>
              {activeTab === 'current' ?(<View style={styles.taskActions}>
                <TouchableOpacity
                  style={[styles.actionButton, task.completed && styles.disabledActionButton]}
                  onPress={() => editTask(task.id)}
                  disabled={!!task.completedDate}
                >
                  <Ionicons 
                    name="pencil" 
                    size={20} 
                    color={task.completedDate ? "#ccc" : "#8B5CF6"} 
                  />
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.actionButton}
                  onPress={() => deleteTask(task.id)}
                  disabled={!!task.completedDate}
                >
                  <Ionicons 
                    name="trash" 
                    size={20} 
                    color={task.completedDate ? "#ccc" : "#8B5CF6"}  />
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.actionButton}
                  onPress={() => toggleTask(task.id)}
                  activeOpacity={0.6}
                >
                  <Ionicons
                    name={task.completedDate ? "checkmark-circle" : "ellipse-outline"}
                    size={20}
                    color={task.completedDate ? "#10B981" : "#8B5CF6"}
                  />
                </TouchableOpacity>
              </View>) : null}
            </View>
          ))}
        </ScrollView>

      {/* Add Task Modal */}
      {showAddTask && (
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>{t('novaTarefa')}</Text>
            <TextInput
              style={styles.input}
              placeholder={t('descricaoTarefa')}
              value={newTaskText}
              onChangeText={setNewTaskText}
              multiline
            />
            <View style={styles.dateInputContainer}>
              <View style={styles.dateInputRow}>
                <TextInput
                  style={[styles.input, styles.dateInput]}
                  placeholder={t('dataOpcional')}
                  value={newTaskDate}
                  onChangeText={setNewTaskDate}
                  keyboardType="numeric"
                  maxLength={10}
                />
                <TouchableOpacity
                  style={styles.calendarButton}
                  onPress={() => setShowCalendar(true)}
                >
                  <Ionicons name="calendar" size={20} color="#8B5CF6" />
                </TouchableOpacity>
              </View>
              <Text style={styles.dateHint}>
                {t('dataHoje')}
              </Text>
            </View>
            
            {/* Priority Selection */}
            <View style={styles.priorityContainer}>
              <Text style={styles.priorityLabel}>{t('prioridade')}:</Text>
              <View style={styles.priorityOptions}>
                {['low', 'medium', 'high'].map((priority) => (
                  <TouchableOpacity
                    key={priority}
                    style={[
                      styles.priorityOption,
                      newTaskPriority === priority && styles.selectedPriorityOption,
                      { 
                        borderColor: newTaskPriority === priority 
                          ? getPriorityColor(priority) 
                          : '#E5E7EB' 
                      }
                    ]}
                    onPress={() => setNewTaskPriority(priority)}
                  >
                    <View style={[styles.priorityDot, { backgroundColor: getPriorityColor(priority) }]} />
                    <Text style={[
                      styles.priorityOptionText,
                      newTaskPriority === priority && styles.selectedPriorityOptionText
                    ]}>
                      {getPriorityLabel(priority)}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
            <View style={styles.modalActions}>
              <TouchableOpacity
                style={[styles.button, styles.cancelButton]}
                onPress={() => setShowAddTask(false)}
              >
                <Text style={styles.cancelButtonText}>{t('botaoCancelar')}</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.button, styles.addButton]}
                onPress={addTask}
              >
                <Text style={styles.addButtonText}>{t('botaoAdicionar')}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      )}

      {/* Edit Task Modal */}
      {showEditTask && (
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>{t('editarTarefa')}</Text>
            <TextInput
              style={styles.input}
              placeholder={t('descricaoTarefa')}
              value={editTaskText}
              onChangeText={setEditTaskText}
              multiline
            />
            <View style={styles.dateInputContainer}>
              <View style={styles.dateInputRow}>
                <TextInput
                  style={[styles.input, styles.dateInput]}
                  placeholder={t('dataOpcional')}
                  value={editTaskDate}
                  onChangeText={setEditTaskDate}
                  keyboardType="numeric"
                  maxLength={10}
                />
                <TouchableOpacity
                  style={styles.calendarButton}
                  onPress={() => setShowEditCalendar(true)}
                >
                  <Ionicons name="calendar" size={20} color="#8B5CF6" />
                </TouchableOpacity>
              </View>
              <Text style={styles.dateHint}>
                {t('dataHoje')}
              </Text>
            </View>
            
            {/* Priority Selection */}
            <View style={styles.priorityContainer}>
              <Text style={styles.priorityLabel}>{t('prioridade')}:</Text>
              <View style={styles.priorityOptions}>
                {['low', 'medium', 'high'].map((priority) => (
                  <TouchableOpacity
                    key={priority}
                    style={[
                      styles.priorityOption,
                      editTaskPriority === priority && styles.selectedPriorityOption,
                      { 
                        borderColor: editTaskPriority === priority 
                          ? getPriorityColor(priority) 
                          : '#E5E7EB' 
                      }
                    ]}
                    onPress={() => setEditTaskPriority(priority)}
                  >
                    <View style={[styles.priorityDot, { backgroundColor: getPriorityColor(priority) }]} />
                    <Text style={[
                      styles.priorityOptionText,
                      editTaskPriority === priority && styles.selectedPriorityOptionText
                    ]}>
                      {getPriorityLabel(priority)}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
            <View style={styles.modalActions}>
              <TouchableOpacity
                style={[styles.button, styles.cancelButton]}
                onPress={cancelEditTask}
              >
                <Text style={styles.cancelButtonText}>{t('botaoCancelar')}</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.button, styles.addButton]}
                onPress={saveEditTask}
              >
                <Text style={styles.addButtonText}>{t('botaoSalvar')}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      )}

      {/* Calendar Modal */}
      {showCalendar && (
        <View style={styles.calendarOverlay}>
          <View style={styles.calendarContainer}>
            <View style={styles.calendarHeader}>
              <Text style={styles.calendarTitle}>{t('selecionarData')}</Text>
              <TouchableOpacity
                style={styles.calendarCloseButton}
                onPress={() => setShowCalendar(false)}
              >
                <Ionicons name="close" size={24} color="#8B5CF6" />
              </TouchableOpacity>
            </View>
            <Calendar
              onDayPress={handleDateSelect}
              theme={{
                backgroundColor: '#ffffff',
                calendarBackground: '#ffffff',
                textSectionTitleColor: '#8B5CF6',
                selectedDayBackgroundColor: '#8B5CF6',
                selectedDayTextColor: '#ffffff',
                todayTextColor: '#8B5CF6',
                dayTextColor: '#2d4150',
                textDisabledColor: '#d9e1e8',
                dotColor: '#8B5CF6',
                selectedDotColor: '#ffffff',
                arrowColor: '#8B5CF6',
                disabledArrowColor: '#d9e1e8',
                monthTextColor: '#8B5CF6',
                indicatorColor: '#8B5CF6',
                textDayFontWeight: '300',
                textMonthFontWeight: 'bold',
                textDayHeaderFontWeight: '300',
                textDayFontSize: 16,
                textMonthFontSize: 16,
                textDayHeaderFontSize: 13
              }}
              // maxDate={new Date().toISOString().split('T')[0]}
              enableSwipeMonths={true}
            />
          </View>
        </View>
      )}

      {/* Edit Calendar Modal */}
      {showEditCalendar && (
        <View style={styles.calendarOverlay}>
          <View style={styles.calendarContainer}>
            <View style={styles.calendarHeader}>
              <Text style={styles.calendarTitle}>Selecionar Data</Text>
              <TouchableOpacity
                style={styles.calendarCloseButton}
                onPress={() => setShowEditCalendar(false)}
              >
                <Ionicons name="close" size={24} color="#8B5CF6" />
              </TouchableOpacity>
            </View>
            <Calendar
              onDayPress={handleEditDateSelect}
              theme={{
                backgroundColor: '#ffffff',
                calendarBackground: '#ffffff',
                textSectionTitleColor: '#8B5CF6',
                selectedDayBackgroundColor: '#8B5CF6',
                selectedDayTextColor: '#ffffff',
                todayTextColor: '#8B5CF6',
                dayTextColor: '#2d4150',
                textDisabledColor: '#d9e1e8',
                dotColor: '#8B5CF6',
                selectedDotColor: '#ffffff',
                arrowColor: '#8B5CF6',
                disabledArrowColor: '#d9e1e8',
                monthTextColor: '#8B5CF6',
                indicatorColor: '#8B5CF6',
                textDayFontWeight: '300',
                textMonthFontWeight: 'bold',
                textDayHeaderFontWeight: '300',
                textDayFontSize: 16,
                textMonthFontSize: 16,
                textDayHeaderFontSize: 13
              }}
              // maxDate={new Date().toISOString().split('T')[0]}
              enableSwipeMonths={true}
            />
          </View>
        </View>
      )}

      {/* Floating Action Button - Only show on current tasks tab */}
      {activeTab === 'current' && (
        <TouchableOpacity
          style={styles.fab}
          onPress={() => setShowAddTask(true)}
        >
          <Ionicons name="add" size={24} color="#fff" />
        </TouchableOpacity>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F6F5FB', // very light lavender
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#ECE9F8',
  },
  headerLeft: {
    flexDirection: 'row',
  },
  logoImage: {
    width: 32,
    height: 32,
    marginRight: 12,
  },
  logoSquare: {
    width: 24,
    height: 24,
    backgroundColor: 'transparent',
    borderWidth: 2,
    borderColor: '#C9B8FF',
    borderRadius: 6,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 2,
  },
  logoSquareOverlay: {
    position: 'absolute',
    top: 4,
    left: 4,
    backgroundColor: 'transparent',
    borderWidth: 2,
    borderColor: '#C9B8FF',
    borderRadius: 6,
    zIndex: 1,
  },
  title: {
    flex: 1,
    fontSize: 22,
    fontWeight: '700',
    color: '#6C4AB6', // muted purple
    textAlign: 'center',
  },
  summaryContainer: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    alignItems: 'center',
    backgroundColor: 'transparent',
  },
  summaryText: {
    fontSize: 15,
    color: '#5B4A78',
  },
  summaryNumbers: {
    color: '#8B5CF6',
    fontWeight: '700',
  },
  tabContainer: {
    flexDirection: 'row',
    marginHorizontal: 18,
    marginBottom: 14,
    backgroundColor: '#F0ECFB', // pastel lilac
    borderRadius: 14,
    padding: 4,
  },
  tab: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 10,
    alignItems: 'center',
  },
  activeTab: {
    backgroundColor: '#BFA7FF', // soft purple highlight
  },
  tabText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#7A62A8',
  },
  activeTabText: {
    color: '#3E2A73',
  },
  taskList: {
    flex: 1,
    paddingHorizontal: 18,
  },
  taskItem: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 14,
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    shadowColor: '#8A7EBF',
    shadowOffset: {
      width: 0,
      height: 6,
    },
    shadowOpacity: 0.06,
    shadowRadius: 12,
    elevation: 3,
    borderWidth: 1,
    borderColor: '#F1EBFB',
  },
  completedTaskItem: {
    backgroundColor: '#FBF9FE',
    borderLeftWidth: 4,
    borderLeftColor: '#9AE6B4', // soft green accent for completed
    opacity: 0.95,
  },
  taskContent: {
    flex: 1,
    marginRight: 12,
  },
  taskHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  taskBadges: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 8,
  },
  priorityBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  priorityBadgeText: {
    color: '#fff',
    fontSize: 11,
    fontWeight: '700',
  },
  taskText: {
    fontSize: 16,
    color: '#403657',
    flex: 1,
  },
  completedTask: {
    textDecorationLine: 'line-through',
    color: '#9A8FB8',
  },
  completedBadge: {
    backgroundColor: '#9AE6B4',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    marginLeft: 8,
  },
  completedBadgeText: {
    color: '#1F2937',
    fontSize: 10,
    fontWeight: '600',
    marginLeft: 4,
  },
  taskDate: {
    fontSize: 13,
    color: '#6B5E7A',
  },
  completedTaskDate: {
    color: '#A89EB6',
  },
  disabledActionButton: {
    opacity: 0.5,
  },
  priorityContainer: {
    marginBottom: 14,
  },
  priorityLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#5B4A78',
    marginBottom: 8,
  },
  priorityOptions: {
    flexDirection: 'row',
    gap: 8,
  },
  priorityOption: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 10,
    borderWidth: 1.5,
    backgroundColor: '#FFF',
    borderColor: '#EFEAF8',
  },
  selectedPriorityOption: {
    backgroundColor: '#F2EDFF',
  },
  priorityDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 8,
  },
  priorityOptionText: {
    fontSize: 13,
    fontWeight: '500',
    color: '#5B4A78',
  },
  selectedPriorityOptionText: {
    color: '#6C4AB6',
    fontWeight: '700',
  },
  taskActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  actionButton: {
    padding: 8,
    marginLeft: 6,
  },
  fab: {
    position: 'absolute',
    bottom: 28,
    right: 28,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#8B5CF6',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#7A63C9',
    shadowOffset: {
      width: 0,
      height: 6,
    },
    shadowOpacity: 0.16,
    shadowRadius: 12,
    elevation: 10,
  },
  modalOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(66, 41, 100, 0.18)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#FBF9FF',
    borderRadius: 14,
    padding: 20,
    width: '90%',
    maxWidth: 420,
    borderWidth: 1,
    borderColor: '#EEE8FB',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 18,
    textAlign: 'center',
    color: '#6C4AB6',
  },
  input: {
    borderWidth: 1,
    borderColor: '#ECE6F8',
    borderRadius: 10,
    padding: 12,
    marginBottom: 14,
    fontSize: 16,
    backgroundColor: '#FFFFFF',
    color: '#3F3350',
  },
  dateInputContainer: {
    marginBottom: 14,
  },
  dateInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  dateInput: {
    flex: 1,
    marginRight: 8,
    marginBottom: 4,
  },
  calendarButton: {
    padding: 12,
    backgroundColor: '#F4F0FF',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#D9CBFF',
  },
  dateHint: {
    fontSize: 12,
    color: '#7A6A8F',
    fontStyle: 'italic',
    marginTop: 6,
  },
  calendarOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(66, 41, 100, 0.18)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
  },
  calendarContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 18,
    width: '90%',
    maxWidth: 420,
    maxHeight: '82%',
    borderWidth: 1,
    borderColor: '#F0EAFB',
  },
  calendarHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  calendarTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: '#6C4AB6',
  },
  calendarCloseButton: {
    padding: 6,
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 6,
  },
  button: {
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 10,
    flex: 1,
    marginHorizontal: 6,
  },
  cancelButton: {
    backgroundColor: '#F6F4FB',
    borderWidth: 1,
    borderColor: '#E9E1FB',
  },
  addButton: {
    backgroundColor: '#7D5CE6',
  },
  cancelButtonText: {
    color: '#6D5F83',
    textAlign: 'center',
    fontWeight: '700',
  },
  addButtonText: {
    color: '#FFFFFF',
    textAlign: 'center',
    fontWeight: '700',
  },
});